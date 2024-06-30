import { App, Editor, MarkdownView, MarkdownFileInfo, Modal, Notice, Plugin, PluginSettingTab, Setting, ItemView, WorkspaceLeaf, Workspace, Vault, TAbstractFile, TFile } from 'obsidian';
import Chart from 'chart.js/auto';

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
		this.renderWeeklyStats(container)
		let oldSettings = JSON.stringify(this.plugin.settings)



		this.registerInterval(
      		window.setInterval(() => {
				let newSettings = JSON.stringify(this.plugin.settings)
				if (oldSettings == newSettings) {
				} else {
					this.renderWeeklyStats(container)
					oldSettings = newSettings
				}
			}, 10000)
    	);


		this.registerEvent(
			this.app.workspace.on("layout-change", async () => {
				this.renderWeeklyStats(container)
			})
		);

		this.registerEvent(
			this.app.workspace.on("resize", async () => {
				this.renderWeeklyStats(container)
			})
		);


	}


	



	async onClose() {
	// Nothing to clean up.
	}

	async renderWeeklyStats(container: Element) {

		

		let today = window.moment().format("x")
		let currentWeek = Number(window.moment().format("w"))
		let currentYear = window.moment().format("YYYY")

		const dailyStats = this.plugin.settings.dailyStats
		const dailyGoal = this.plugin.settings.dailyGoal
		const weeklyGoal = 700

		let data = dailyStats
		.filter((stat: any) => {
			return Number(window.moment(stat.date).format("w")) == currentWeek
		})


		let weekData = []

		for (let weekDay = 1; weekDay <= 7; weekDay++) {
			let dayData = data.find((stat: any) => Number(window.moment(stat.date).format("E")) == weekDay)
			if(dayData) {
				weekData.push(dayData)
			} else {
				let date = window.moment().day(weekDay).week(currentWeek).format("YYYY-MM-DD")

				let prevEndData = 0
				if (weekDay == 1) {
					let prevData = dailyStats.findLast((stat: any) => {
						return window.moment(stat.date).format("x") < window.moment(date).format("x")
					})
					if (prevData) {
						prevEndData = prevData.endWordCount
					}
				} else {
					prevEndData = weekData[weekDay - 2].endWordCount
				}
				
				let emptyData = {
					date: date,
					startWordCount: prevEndData, 
					endWordCount: prevEndData
				}
				weekData.push(emptyData)
			}
		}


		let firstDayStart = weekData[0].startWordCount
		let lastDayEnd = weekData[weekData.length - 1].endWordCount





		weekData = weekData.map((stat: any) => {
			let item: any = {}
			let date = window.moment(stat.date)
			let month = date.format("MMM").slice(0,3)
			let formattedDate = date.format("dd, DD ") + month
			formattedDate = formattedDate[0].toUpperCase() + formattedDate.slice(1)
			item.date = formattedDate

			let written = stat.endWordCount - stat.startWordCount
			item.written = written
			item.writtenAll = stat.endWordCount

			let goal = dailyGoal - item.written
			if (goal < 0 ) goal = 0
			item.goal = goal

			let achive = ""
			if (written >= (dailyGoal * 3)) {
				achive = "🏆"
			} else if (written >= dailyGoal) {
				achive = "✅"
			} else if (written > 0) {
				achive = "📝"
			} else if (window.moment().diff(date, 'days') > 0) {
				achive = "❌"
			}

			item.achive = achive

			return item
		})


		







		


		container.empty()
		container.createEl("h1", { text: "Недельная статистика" });


		if (lastDayEnd >= weeklyGoal) {
			container.createEl("h3", { text: " ✨ Поздравляю! Недельная цель достигнута! ✨" });
		}

		let tableWrapper = container.createEl("div", {cls: "table-wrapper weekly-stats-table"});
		let barChartWrapper = container.createEl("div", {cls: "chart-wrapper weekly-bar-chart"});
		let lineChartWrapper = container.createEl("div", {cls: "chart-wrapper weekly-line-chart"});

		this.createTableFromData(weekData, tableWrapper)
		this.createBarChartFromData(weekData, dailyGoal, barChartWrapper)
		this.createLineChartFromData(weekData, weeklyGoal, firstDayStart, lastDayEnd, lineChartWrapper)
	}






	createTableFromData(data: any, container: Element) {
		let table = container.createEl("table");
		let thead = table.createTHead()
		let theadRow = thead.insertRow();
		let columns = Object.keys(data[0]);

		for (let column of columns) {
			let th = document.createElement("th");
			let text = document.createTextNode(column);
			th.appendChild(text);
			theadRow.appendChild(th);
		}

		for (let day of data) {
			let row = table.insertRow();
			for (let key in day) {
			  let cell = row.insertCell();
			  let text = document.createTextNode(day[key]);
			  cell.appendChild(text);
			}
		}
	}

	


	createBarChartFromData(data: any, goal: number, container: Element) {
		let aspectRatio = data.length / 7.5
		if (aspectRatio < 1.3) aspectRatio = 1.3


		let canvas = container.createEl("canvas");
		new Chart(
		canvas, 
		{
			options: {
				animation: false,
				aspectRatio: aspectRatio,
				elements: {
					point: {
						pointStyle: false
					},
					line: {
						borderWidth: 2
					}
				}
			},
			data: {
				labels: data.map((row:any) => row.date),
				datasets: [
					{
						type: 'bar',
						label: 'Написано в день',
						data: data.map((row:any) => row.written)
					},
					{
						type: 'line',
						label: 'Ежедневная цель',
						data: data.map(() => goal)
					}
				]
			}
		}
		); 
	}



	createLineChartFromData(data: any, goal: number, firstDayStart: number, lastDayEnd: number, container: Element) {

		let aspectRatio = data.length / 7.5
		if (aspectRatio < 1.3) aspectRatio = 1.3
		data.unshift({
			date: 0,
			writtenAll: firstDayStart
		})

		
		let maxScale = goal + 7
		if (lastDayEnd > goal) {
			maxScale = lastDayEnd + 7
		}

		let goalMultiplier = (goal - firstDayStart) / (data.length - 1)

		let goalData = data.map((el: any, i: number) => {
			return Math.round(firstDayStart + goalMultiplier * i)
		})

		let canvas = container.createEl("canvas");
		new Chart(
		canvas,
		{
			type: 'line',
			options: {
				animation: false,
				aspectRatio: aspectRatio,
				scales: {
					y: {
					  min: firstDayStart - 7,
					  max: maxScale,
					}
				}, 
				elements: {
					line: {
						borderWidth: 2
					}
				}
			},
			data: {
				labels: data.map((row:any) => row.date),
				datasets: [
					{
						label: 'Написано всего',
						data: data.map((row:any) => row.writtenAll)
					},
					{
						label: 'Цель',
						data: goalData.map((row:any) => row)
					}
				]
			}
		}); 
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
		let globalWordCount = this.settings.currentGlobalWordCount

		let todayStat = dailyStats.find((stat:any) => stat.date == today)
		if (!todayStat) {

			if (dailyStats.length > 0) {
				let lastStat = dailyStats[dailyStats.length - 1]
				lastStat.endWordCount = globalWordCount
			}


			todayStat = {
				date: today,
				startWordCount: globalWordCount,
				endWordCount: globalWordCount
			}

			dailyStats.push(todayStat)
			this.settings.dailyStats = dailyStats
			this.settings.todayStartWordCount = globalWordCount

		} else {
			todayStat.endWordCount = globalWordCount
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
			await this.updateDailyStats()

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
		if (this.app.workspace.activeEditor && file == this.app.workspace.activeEditor.file) {
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
