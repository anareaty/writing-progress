import { App, Editor, MarkdownView, MarkdownFileInfo, Modal, Notice, Plugin, PluginSettingTab, Setting, ItemView, WorkspaceLeaf, Workspace, Vault, TAbstractFile, TFile } from 'obsidian';

// Remember to rename these classes and interfaces!

interface WritingProgressPluginSettings {
	dailyGoal: number;
	todayStartWordCount: number;
	currentGlobalWordCount: number;
	dailyStats: any;
	goalProperty: string;
	wordCountProperty: string;
	filterCountedFilesProperty: string;
}

const DEFAULT_SETTINGS: WritingProgressPluginSettings = {
	dailyGoal: 100,
	todayStartWordCount: 0,
	currentGlobalWordCount: 0,
	dailyStats: [],
	goalProperty: "Цель",
	wordCountProperty: "Слов",
	filterCountedFilesProperty: "Цель"
}







/* PROGRESS VIEW */

export const WRITING_PROGRESS_VIEW_TYPE = "writing-progress-view";

export class WritingProgressView extends ItemView {
  plugin: WritingProgressPlugin;


  constructor(leaf: WorkspaceLeaf, plugin: WritingProgressPlugin) {
    super(leaf);
	this.plugin = plugin;
  }

  getViewType() {
    return WRITING_PROGRESS_VIEW_TYPE;
  }

  getDisplayText(): string {
	return ""
  }

  getActiveFile() {
	return this.app.workspace.getActiveFile()
  }



  async onOpen() {
	const container = this.containerEl.children[1];
    
	let file: TFile | null = this.app.workspace.getActiveFile()
	this.updateView(file, container)


	this.registerEvent(
		this.app.workspace.on("editor-change", async () => {
			let file: TFile | null = this.app.workspace.getActiveFile()
			await this.updateView(file, container)
		})
	);


	this.registerEvent(
		this.app.workspace.on("file-open", async (file: TFile) => {
			if (file == this.app.workspace.getActiveFile()) {
				await this.updateView(file, container)
			}
		})
	);

	this.registerEvent(
		this.app.workspace.on("layout-change", async () => {
			let file: TFile | null = this.app.workspace.getActiveFile()
			await this.updateView(file, container)
		})
	);



  }

	async onClose() {
	// Nothing to clean up.
	}


	async updateView (file: TFile | null, container: Element) {
		container.empty()
		if (file) {
			await this.renderWordCount(file, container)
			this.renderDailyStats(container)
		} else {
			container.createEl("h4", { text: "No file open" });
		}
	}




	async renderWordCount(file: TFile, container: Element) {

		let wordCount = await this.plugin.getFileWordCount(file)
		let goal = this.plugin.getFileGoal(file)

		container.createEl("h4", { text: "Прогресс сцены" });
		container.createEl("p", { text: wordCount + "/" + goal });
		let fileProgress = container.createEl("progress");
		fileProgress.max = goal
		fileProgress.value = wordCount
	}




	renderDailyStats(container: Element) {
		let dailyGoal = this.plugin.settings.dailyGoal
		let todayStartWordCount = this.plugin.settings.todayStartWordCount
		let currentGlobalWordCount = this.plugin.settings.currentGlobalWordCount
		let writtenToday = currentGlobalWordCount - todayStartWordCount

		container.createEl("h4", { text: "Ежедневный прогресс" });
		container.createEl("p", { text: writtenToday + "/" + dailyGoal });
		let dailyProgress = container.createEl("progress");
		dailyProgress.max = dailyGoal
		dailyProgress.value = writtenToday
	}


}










/* STATISTIC VIEW */


export const WRITING_STATISTIC_VIEW_TYPE = "writing-statistic-view";

export class WritingStatisticView extends ItemView {
  plugin: WritingProgressPlugin;


  constructor(leaf: WorkspaceLeaf, plugin: WritingProgressPlugin) {
    super(leaf);
	this.plugin = plugin;
  }

  getViewType() {
    return WRITING_STATISTIC_VIEW_TYPE;
  }

  getDisplayText(): string {
	return ""
  }

  getActiveFile() {
	return this.app.workspace.getActiveFile()
  }



  async onOpen() {
	const container = this.containerEl.children[1];
	container.empty()

	container.createEl("h4", { text: "Статистика" });
    

  }

	async onClose() {
	// Nothing to clean up.
	}

}











export default class WritingProgressPlugin extends Plugin {
	settings: WritingProgressPluginSettings;
	timer: any;
	

	async onload() {
		await this.loadSettings();
		await this.updateDailyStats()
		this.addSettingTab(new SampleSettingTab(this.app, this));

		this.registerView(
			WRITING_PROGRESS_VIEW_TYPE,
			(leaf) => new WritingProgressView(leaf, this)
		);

		this.registerView(
			WRITING_STATISTIC_VIEW_TYPE,
			(leaf) => new WritingStatisticView(leaf, this)
		);

		this.activateProgressView(false);

		this.addCommand({
			id: 'open-writing-progress-view',
			name: 'Открыть панель прогресса',
			callback: () => {
				this.activateProgressView(true);
			}
		});

		this.addCommand({
			id: 'open-writing-statistic-view',
			name: 'Открыть панель статистики',
			callback: () => {
				this.activateStatisticView(true);
			}
		});

		// Update global word count

		this.registerEvent(
			this.app.workspace.on("editor-change", async () => {
				this.updateGlobalWordCount()
			})
		);

		this.registerEvent(
			this.app.workspace.on("layout-change", async () => {
				this.updateGlobalWordCount()
			})
		);

		// Save file wordcount property (wait 2 seconds after stopping typing to avoid data loss and annoying notices)

		this.registerEvent(
			this.app.workspace.on("editor-change", async () => {
				clearTimeout(this.timer);
				this.timer = setTimeout(async() => {
					let file: TFile | null = this.app.workspace.getActiveFile()
					if (file) {
						let wordCount = await this.getFileWordCount(file)
						let wordCountProperty = this.settings.wordCountProperty
						this.app.fileManager.processFrontMatter(file, (fm) => {
							if (fm[wordCountProperty] != wordCount) {
								fm[wordCountProperty] = wordCount
							}
						})
					}
				}, 2000)
			})
		);

	
	}

	onunload() {

	}



	async updateDailyStats() {

		let today = window.moment().format("YYYY-MM-DD")
		let dailyStats = this.settings.dailyStats




		let todayStat = dailyStats.find((stat:any) => stat.date == today)
		if (!todayStat) {

			if (dailyStats.length > 0) {
				let lastStat = dailyStats[dailyStats.length - 1]
				lastStat.endWordCount = this.settings.currentGlobalWordCount
			}


			todayStat = {
				date: today,
				startWordCount: this.settings.currentGlobalWordCount
			}

			dailyStats.push(todayStat)
			this.settings.dailyStats = dailyStats
			this.settings.todayStartWordCount = this.settings.currentGlobalWordCount
		}

		

		await this.saveSettings()
	}




	async updateGlobalWordCount() {
		let globalWordCount = 0
		let allFiles = this.app.vault.getMarkdownFiles()
		let goalProperty = this.settings.goalProperty

		for (let file of allFiles) {
			if (this.hasTrueProperty(file, goalProperty)) {
				let fileWordCount = await this.getFileWordCount(file)
				globalWordCount += fileWordCount
			}
		}

		if (globalWordCount != this.settings.currentGlobalWordCount) {
			this.settings.currentGlobalWordCount = globalWordCount
			await this.saveSettings();

		}
	}




	hasTrueProperty(file: TFile, propName: string) : boolean {
		let cache = this.app.metadataCache.getFileCache(file)
		return cache?.frontmatter?.[propName]		
	}




	getFileGoal(file: TFile) : number {
		let goalProperty = this.settings.goalProperty
		return this.app.metadataCache.getFileCache(file)?.frontmatter?.[goalProperty] ?? 0
	}




	async getFileWordCount(file: TFile) {

		let content: string = ""
		if (file == this.app.workspace.getActiveFile()) {
			let activeEditor = this.app.workspace.activeEditor
			if (activeEditor && activeEditor instanceof MarkdownView) {
				content = activeEditor.getViewData()
			}
		} else {
			content = await this.app.vault.cachedRead(file)
		}

		content = content
		.replace(/^---\n.*?\n---/ms, "")
		.replace(/%%.*?%%/gms, "")
		.replaceAll("—", "")
		.replaceAll(/[\n]+/mg, " ")
		.replaceAll(/[ ]+/mg, " ")
		.replaceAll("==", "")
		.replaceAll("*", "")
		.replaceAll("#", "")
		.replaceAll(/\[\[.*?\]\]/gms, "")
		.trim()

		let words = content.split(" ")
		if (words.length == 1 && words[0] == "") {
				words = []
		}
		return words.length
	}





	getProgressView() {
		let view: any
		this.app.workspace.getLeavesOfType(WRITING_PROGRESS_VIEW_TYPE).forEach((leaf) => {
			if (leaf.view instanceof WritingProgressView) {
			  view = leaf.view
			}
		});
		return view
	}





	async activateProgressView(reveal:boolean) {
		this.app.workspace.onLayoutReady(async () => {

			const { workspace } = this.app;
			let leaf: WorkspaceLeaf | null = null;
			const leaves = workspace.getLeavesOfType(WRITING_PROGRESS_VIEW_TYPE);

			if (leaves.length > 0) {
				leaf = leaves[0];
			} else {
				leaf = workspace.getRightLeaf(false)!;
				await leaf.setViewState({ type: WRITING_PROGRESS_VIEW_TYPE, active: reveal });
			}

			if (reveal) {
				workspace.revealLeaf(leaf);
			}
		});
	}




	async activateStatisticView(reveal:boolean) {
		this.app.workspace.onLayoutReady(async () => {

			const { workspace } = this.app;
			let leaf: WorkspaceLeaf | null = null;
			const leaves = workspace.getLeavesOfType(WRITING_STATISTIC_VIEW_TYPE);

			if (leaves.length > 0) {
				leaf = leaves[0];
			} else {
				leaf = workspace.getLeaf(true)!;
				await leaf.setViewState({ type: WRITING_STATISTIC_VIEW_TYPE, active: reveal });
			}

			if (reveal) {
				workspace.revealLeaf(leaf);
			}
		});
	}






	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}



class SampleSettingTab extends PluginSettingTab {
	plugin: WritingProgressPlugin;

	constructor(app: App, plugin: WritingProgressPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();
	}
}
