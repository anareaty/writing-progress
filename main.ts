import { App, Editor, MarkdownView, MarkdownFileInfo, setIcon, setTooltip, Modal, Notice, Plugin, PluginSettingTab, Setting, ItemView, WorkspaceLeaf, Workspace, Vault, TAbstractFile, TFile, View, EventRef } from 'obsidian';
import Chart from 'chart.js/auto';
import { Moment } from 'moment';
//import { setTimeout } from 'timers/promises';



const LocaleMap: any = {

	date: {
		en: "Date",
		ru: "Дата"
	},
	written: {
		en: "Written",
		ru: "Написано"
	}, 
	writtenThisPeriod: {
		en: "All",
		ru: "Всего"
	},
	writtenAll: {
		en: "Written at all",
		ru: "Написано всего"
	},
	goal: {
		en: "Goal",
		ru: "Цель"
	},
	achive: {
		en: "Achive",
		ru: "Значок"
	}, 
	refresh: {
		en: "Refresh",
		ru: "Обновить"
	},
	fileGoal: {
		en: "File goal",
		ru: "Цель файла"
	},
	dailyGoal: {
		en: "Daily goal",
		ru: "Ежедневная цель"
	},
	weeklyGoal: {
		en: "Weekly goal",
		ru: "Еженедельная цель"
	},
	monthlyGoal: {
		en: "Monthly goal",
		ru: "Ежемесячная цель"
	},
	changeDailyGoal: {
		en: "Change daily goal",
		ru: "Изменить ежедневную цель"
	},
	changeFileGoal: {
		en: "Change file goal",
		ru: "Изменить цель файла"
	},
	setFileGoal: {
		en: "Set words goal for file",
		ru: "Установить цель для текущего файла"
	},
	noGoalSet: {
		en: "No goal set",
		ru: "Не выбрана цель"
	},
	noFileOpen: {
		en: "No file open",
		ru: "Не выбран файл"
	},
	changeWeeklyGoal: {
		en: "Change goal",
		ru: "Изменить цель"
	},
	changeMonthlyGoal: {
		en: "Change goal",
		ru: "Изменить цель"
	},
	weeklyStatistic: {
		en: "Weekly statistic",
		ru: "Статистика недели"
	},
	monthlyStatistic: {
		en: "Monthly statistic",
		ru: "Статистика месяца"
	},
	weeklyGoalCongratulation: {
		en: " 🏆 Weekly goal is achieved!",
		ru: " 🏆 Еженедельная цель достигнута!"
	},
	monthlyGoalCongratulation: {
		en: " 🏆 Monthly goal is achieved!",
		ru: " 🏆 Ежемесячная цель достигнута!"
	},
	progress: {
		en: "Progress",
		ru: "Прогресс"
	},
	fileProgress: {
		en: "Progress",
		ru: "Прогресс"
	},
	dailyProgress: {
		en: "Daily progress",
		ru: "Ежедневный прогресс"
	},
	clearSavedStatistics: {
		en: "Clear saved statistics",
		ru: "Удалить сохранённую статистику"
	},
	clearTodayStats: {
		en: "Clear today stats",
		ru: "Обнулить сегодняшнюю статистику"
	},
	clearAllStats: {
		en: "Clear all stats",
		ru: "Удалить всю статистику"
	},
	openProgressView: {
		en: "Open progress view",
		ru: "Открыть панель прогресса"
	},
	openWeeklyStatsView: {
		en: "Open weekly stats view",
		ru: "Открыть панель статистики недели"
	},
	openMonthlyStatsView: {
		en: "Open monthly stats view",
		ru: "Открыть панель статистики месяца"
	},
	writtenPerDay: {
		en: "Written per day",
		ru: "Написано в день"
	},
	goalProperty: {
		en: "Goal property",
		ru: "Свойство для цели"
	},
	wordCountProperty: {
		en: "Wordcount property",
		ru: "Свойство для количества слов"
	},
	filterCountedFilesProperty: {
		en: "Only count words in files with this property",
		ru: "Считать слова только в файлах с этим свойством"
	},
	startingCount: {
		en: "Starting wordcount",
		ru: "Стартовое количество слов"
	},
	useCurrentWordcount: {
		en: "Use current",
		ru: "Использовать текущее"
	},
	reset: {
		en: "Reset to default",
		ru: "Восстановить по умолчанию"
	},
	save: {
		en: "Save",
		ru: "Сохранить"
	}
}






interface WritingProgressPluginSettings {
	dailyGoal: number;
	weeklyGoal: number;
	monthlyGoal: number;
	goalProperty: string;
	wordCountProperty: string;
	filterCountedFilesProperty: string;

	startingCount: number;
	currentGlobalWordCount: number;
	dailyStats: any;

	
	

}

const DEFAULT_SETTINGS: WritingProgressPluginSettings = {
	dailyGoal: 100,
	weeklyGoal: 700,
	monthlyGoal: 3000,
	currentGlobalWordCount: 0,
	dailyStats: [],
	goalProperty: "goal",
	wordCountProperty: "words",
	filterCountedFilesProperty: "goal",
	startingCount: 0,

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
		return this.plugin.getLocalStrings().progress
	}

	getIcon() {
		return "bar-chart-horizontal-big"
	}

	async onOpen() {
		
		this.updateView()
	}

	async onClose() {
	// Nothing to clean up.
	}


	async updateView () {
		let file: TFile | null = this.app.workspace.getActiveFile()
	
		const container = this.containerEl.children[1];
		container.empty()
		if (file) {
			if (this.plugin.hasTrueProperty(file, this.plugin.settings.goalProperty)) {
				let wordCountContainer = container.createEl("div")
				let dailyStatsContainer = container.createEl("div")
				await this.renderWordCount(file, wordCountContainer)
				this.renderDailyStats(dailyStatsContainer)
				








			} else {
				container.createEl("h4", { text: this.plugin.getLocalStrings().noGoalSet });

				let setGoalButton = container.createEl("p").createEl("button", { text: this.plugin.getLocalStrings().setFileGoal });
				setGoalButton.onclick = async () => {
					//@ts-ignore
					await this.plugin.setFileGoal(file);
				};
			}
		} else {
			container.createEl("h4", { text: this.plugin.getLocalStrings().noFileOpen });
		}
	
	}




	async renderWordCount(file: TFile, container: Element) {
		container.empty()

		let wordCount = await this.plugin.getFileWordCount(file)
		let goal = this.plugin.getFileGoal(file)

		container.createEl("h4", { text: this.plugin.getLocalStrings().fileProgress });
		container.createEl("p", { text: wordCount + "/" + goal });
		this.createProgressBar(goal, wordCount, container)
	}




	renderDailyStats(container: Element) {
		container.empty()
		let dailyGoal = this.plugin.settings.dailyGoal
		let todayStartWordCount = this.plugin.getTodayStartWordCount()
		let currentGlobalWordCount = this.plugin.settings.currentGlobalWordCount
		let writtenToday = currentGlobalWordCount - todayStartWordCount
		let strings = this.plugin.getLocalStrings()

		container.createEl("h4", { text: strings.dailyProgress });
		let statText = container.createEl("p")
		statText.createEl("span", { text: writtenToday + "/" + dailyGoal });

		let button = statText.createEl("button")
		button.onclick = async () => {
			await this.plugin.changeDailyGoal()
		}
		button.className = "wp-inline-button"
		setIcon(button, "edit")
		setTooltip(button, strings.changeDailyGoal, {delay: 1})


		this.createProgressBar(dailyGoal, writtenToday, container)
	}


	createProgressBar(max: number, value: number, container: Element) {
		
		let percents = value * 100 / max
		let colorClass = "value-100"
		if (percents <= 30) { colorClass = 'value-0'}
		else if (percents <= 50) { colorClass = 'value-30'}
		else if (percents <= 80) { colorClass = 'value-50'}
		else if (percents < 100) { colorClass = 'value-80'}

		let progress = container.createEl("progress", {cls: colorClass})
		progress.value = value
		progress.max = max

	}


}


















class NumberInputModal extends Modal {
	result: number | null
	defaultVal: number | null
	plugin: WritingProgressPlugin
	resolve: any
	reject: any
	name: string

	constructor(app: App, plugin: WritingProgressPlugin, name: string, defaultVal: number | null, resolve: any, reject: any) {
	  super(app);
	  this.eventInput = this.eventInput.bind(this);
	  this.defaultVal = defaultVal
	  this.plugin = plugin;
	  this.resolve = resolve 
	  this.reject = reject
	  this.name = name
  
	}
	async eventInput(e: any) {
	  if (e.key === "Enter") {
		e.preventDefault();
		this.resolve(this.result);
		this.close();
	  }
	}
	onOpen() {
	  const { contentEl } = this;
	  contentEl.createEl("h1", { text: this.name });
	  const inputSetting = new Setting(contentEl);
	  inputSetting.settingEl.style.display = "grid";
  
	  inputSetting.addText((text) => {
		text.inputEl.type = "number";
		text.inputEl.className = "number-input-el";
		text.setValue(this.defaultVal + "");
		this.result = this.defaultVal;
		text.onChange((value) => {
		  if (Number.isNaN(value))
			this.result = 0;
		  else
			this.result = Number(value);
		});
		text.inputEl.style.width = "100%";
	  });
  
	  new Setting(contentEl)
	  .addButton((btn) => btn.setButtonText(this.plugin.getLocalStrings().save)
	  .setCta()
	  .onClick(async () => {
		this.resolve(this.result);
		this.close();
	  }));
	  contentEl.addEventListener("keydown", this.eventInput);
	}
	onClose() {
	  const { contentEl } = this;
	  contentEl.empty();
	  this.contentEl.removeEventListener("keydown", this.eventInput);
	}
  };










/* STATISTIC VIEW */

export const WRITING_STATISTIC_VIEW_TYPE = "writing-statistic-view";
export const WEEKLY_STATISTIC_VIEW_TYPE = "weekly-statistic-view";
export const MONTHLY_STATISTIC_VIEW_TYPE = "monthly-statistic-view";

export class WritingStatisticView extends ItemView {
	plugin: WritingProgressPlugin;
	barchart: Chart | undefined;
	linechart: Chart | undefined;

	constructor(leaf: WorkspaceLeaf, plugin: WritingProgressPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return WRITING_STATISTIC_VIEW_TYPE;
	}

	getIcon() {
		return "line-chart"
	}

	getDisplayText(): string {
		return ""
	}

	async onClose() {
		delete this.barchart
		delete this.linechart
	}

	async renderWeeklyStats() {

		let strings = this.plugin.getLocalStrings()

		const container = this.containerEl.children[1];

		let currentWeek = Number(window.moment().format("w"))

		const dailyStats = this.plugin.settings.dailyStats
		const dailyGoal = this.plugin.settings.dailyGoal
		const weeklyGoal = this.plugin.settings.weeklyGoal


		

		let data = JSON.parse(JSON.stringify(dailyStats))
		data[0].startWordCount = data[0].startWordCount + this.plugin.settings.startingCount;

		data = data
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

				let prevEndData = this.plugin.settings.startingCount;
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
			item.writtenThisPeriod = stat.endWordCount - firstDayStart

			let goal = dailyGoal - item.written
			if (goal < 0 ) goal = 0
			item.goal = goal

			item.achive = this.getAchive(written, dailyGoal, date)

			return item
		})


		


		container.empty()
		let contentWrapper = container.createEl("div", {cls: "weekly-statistic-view"});
		contentWrapper.createEl("h1", { text: this.getDisplayText() });


		if (lastDayEnd - firstDayStart >= weeklyGoal) {
			contentWrapper.createEl("p", { text: strings.weeklyGoalCongratulation });
		}

		let statisticWrapper = contentWrapper.createEl("div", {cls: "statistic-wrapper"});
		let tableWrapper = statisticWrapper.createEl("div", {cls: "table-wrapper weekly-stats-table"});
		let chartsWrapper = statisticWrapper.createEl("div", {cls: "charts-wrapper weekly-charts-wrapper"});

		
		let barChartWrapper = chartsWrapper.createEl("div", {cls: "chart-wrapper weekly-bar-chart"});
		let lineChartWrapper = chartsWrapper.createEl("div", {cls: "chart-wrapper weekly-line-chart"});


		let buttonWrapper = tableWrapper.createEl("p")

		let refreshButton = buttonWrapper.createEl("button", {cls: "wp-button"})
		refreshButton.onclick = () => {
			this.renderWeeklyStats()
		}
		let refreshIcon = refreshButton.createEl("div", {cls: "wp-inline-icon"})
		setIcon(refreshIcon, "rotate-cw")
		refreshButton.createEl("span", {text: strings.refresh})

		let changeWeeklyGoalButton = buttonWrapper.createEl("button", {cls: "wp-button"})
		changeWeeklyGoalButton.onclick = () => {
			this.plugin.changeWeeklyGoal()
		}
		let changeWeeklyGoalIcon = changeWeeklyGoalButton.createEl("div", {cls: "wp-inline-icon"})
		setIcon(changeWeeklyGoalIcon, "goal")
		changeWeeklyGoalButton.createEl("span", {text: strings.changeWeeklyGoal})


		this.createTableFromData(weekData, tableWrapper, ["date", "written", "goal", "writtenThisPeriod", "achive"])
		this.createBarChartFromData(weekData, dailyGoal, barChartWrapper)
		this.createLineChartFromData(weekData, weeklyGoal, firstDayStart, lastDayEnd, lineChartWrapper)
	}








	async renderMonthlyStats() {

		let strings = this.plugin.getLocalStrings()

		const container = this.containerEl.children[1];

		let currentMonth = window.moment().month()
		let daysInMonth = window.moment().daysInMonth()

		const dailyStats = this.plugin.settings.dailyStats
		const dailyGoal = this.plugin.settings.dailyGoal
		const monthlyGoal = this.plugin.settings.monthlyGoal

		let data = JSON.parse(JSON.stringify(dailyStats))
		if (data.length > 0) {
			data[0].startWordCount = data[0].startWordCount + this.plugin.settings.startingCount;
		}
		

		data = data
		.filter((stat: any) => {
			return window.moment(stat.date).month() == currentMonth
		})


		let monthData = []

		for (let monthDay = 1; monthDay <= daysInMonth; monthDay++) {
			let dayData = data.find((stat: any) => window.moment(stat.date).date() == monthDay)
			if(dayData) {
				monthData.push(dayData)
			} else {
				let date = window.moment().date(monthDay).month(currentMonth).format("YYYY-MM-DD")

				let prevEndData = this.plugin.settings.startingCount;
				if (monthDay == 1) {
					let prevData = dailyStats.findLast((stat: any) => {
						return window.moment(stat.date).unix() < window.moment(date).unix()
					})
					if (prevData) {
						prevEndData = prevData.endWordCount
					}
				} else {
					prevEndData = monthData[monthDay - 2].endWordCount
				}
				
				let emptyData = {
					date: date,
					startWordCount: prevEndData, 
					endWordCount: prevEndData
				}
				monthData.push(emptyData)
			}
		}


	


		let firstDayStart = monthData[0].startWordCount
		let lastDayEnd = monthData[monthData.length - 1].endWordCount





		monthData = monthData.map((stat: any) => {
			let item: any = {}
			let date = window.moment(stat.date)

			item.date = date.date()

			let written = stat.endWordCount - stat.startWordCount
			item.written = written
			item.writtenAll = stat.endWordCount
			item.writtenThisPeriod = stat.endWordCount - firstDayStart

			let goal = dailyGoal - item.written
			if (goal < 0 ) goal = 0
			item.goal = goal

			item.achive = this.getAchive(written, dailyGoal, date)

			return item
		})


		







		


		container.empty()
		let contentWrapper = container.createEl("div", {cls: "monthly-statistic-view"});
		contentWrapper.createEl("h1", { text: this.getDisplayText() });


		if (lastDayEnd >= monthlyGoal) {
			contentWrapper.createEl("h3", { text: strings.monthlyGoalCongratulation });
		}

		let statisticWrapper = contentWrapper.createEl("div", {cls: "statistic-wrapper"});
		let tableWrapper = statisticWrapper.createEl("div", {cls: "table-wrapper monthly-stats-table"});
		let chartsWrapper = statisticWrapper.createEl("div", {cls: "charts-wrapper monthly-charts-wrapper"});
		let barChartWrapper = chartsWrapper.createEl("div", {cls: "chart-wrapper monthly-bar-chart"});
		let lineChartWrapper = chartsWrapper.createEl("div", {cls: "chart-wrapper monthly-line-chart"});
		


		let buttonWrapper = tableWrapper.createEl("p")

		let refreshButton = buttonWrapper.createEl("button", {cls: "wp-button"})
		refreshButton.onclick = () => {
			this.renderMonthlyStats()
		}
		let refreshIcon = refreshButton.createEl("div", {cls: "wp-inline-icon"})
		setIcon(refreshIcon, "rotate-cw")
		refreshButton.createEl("span", {text: strings.refresh})

		let changeMonthlyGoalButton = buttonWrapper.createEl("button", {cls: "wp-button"})
		changeMonthlyGoalButton.onclick = () => {
			this.plugin.changeMonthlyGoal()
		}
		let changeMonthlyGoalIcon = changeMonthlyGoalButton.createEl("div", {cls: "wp-inline-icon"})
		setIcon(changeMonthlyGoalIcon, "goal")
		changeMonthlyGoalButton.createEl("span", {text: strings.changeMonthlyGoal})


		
		this.createBarChartFromData(monthData, dailyGoal, barChartWrapper)
		this.createLineChartFromData(monthData, monthlyGoal, firstDayStart, lastDayEnd, lineChartWrapper)
		this.createTableFromData(monthData, tableWrapper, ["date", "written", "goal", "writtenThisPeriod", "achive"])
		
	}




	getAchive(written: number, dailyGoal: number, date: Moment) {
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
		return achive
	}










	createTableFromData(data: any, container: Element, columns: string[]) {

		


		let localStrings = this.plugin.getLocalStrings()

		

		let headers = columns.map(c => {
			return localStrings[c]
		})


		let table = container.createEl("table");
		let thead = table.createTHead()
		let theadRow = thead.insertRow();
		//let columns = Object.keys(data[0]);

		for (let column of headers) {
			let th = document.createElement("th");
			let text = document.createTextNode(column);
			th.appendChild(text);
			theadRow.appendChild(th);
		}

		for (let day of data) {
			let row = table.insertRow();
			for (let column of columns) {
			  let cell = row.insertCell();
			  let text = document.createTextNode(day[column]);
			  cell.appendChild(text);
			}
		}
	}

	


	createBarChartFromData(data: any, goal: number, container: Element) {
		let strings = this.plugin.getLocalStrings()
		let canvas = container.createEl("canvas");

		if (this.barchart) {
			this.barchart.destroy()
		} 

		this.barchart = new Chart(
			canvas, 
			{
				options: {
					animation: false,
					responsive: true,
					maintainAspectRatio: false,
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
							label: strings.writtenPerDay,
							data: data.map((row:any) => row.written)
						},
						{
							type: 'line',
							label: strings.dailyGoal,
							data: data.map(() => goal)
						}
					]
				}
			}
			); 
	}



	createLineChartFromData(data: any, goal: number, firstDayStart: number, lastDayEnd: number, container: Element) {
		let strings = this.plugin.getLocalStrings()

		if (this.linechart) {
			this.linechart.destroy()
		}
		
		goal = goal + firstDayStart

		data = [...data]
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
		this.linechart = new Chart(
		canvas,
		{
			type: 'line',
			options: {
				animation: false,
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					y: {
					  min: firstDayStart - maxScale * 0.01,
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
						label: strings.writtenAll,
						data: data.map((row:any) => row.writtenAll)
					},
					{
						label: strings.goal,
						data: goalData.map((row:any) => row)
					}
				]
			}
		}); 
	}



}




export class WeeklyStatisticView extends WritingStatisticView {
	getViewType() {
		return WEEKLY_STATISTIC_VIEW_TYPE;
	}

	getDisplayText(): string {
		return this.plugin.getLocalStrings().weeklyStatistic
	}

	async onOpen() {
		this.renderWeeklyStats()
	}
}

export class MonthlyStatisticView extends WritingStatisticView {
	getViewType() {
		return MONTHLY_STATISTIC_VIEW_TYPE;
	}

	getDisplayText(): string {
		return this.plugin.getLocalStrings().monthlyStatistic
	}

	async onOpen() {
		this.renderMonthlyStats()
	}
}










export default class WritingProgressPlugin extends Plugin {
	settings: WritingProgressPluginSettings;
	timer: any;
	

	async onload() {
		await this.loadSettings();
		
		let strings = this.getLocalStrings()


		await this.updateDailyStats()
		this.addSettingTab(new SampleSettingTab(this.app, this));

		this.registerView(
			WRITING_PROGRESS_VIEW_TYPE,
			(leaf) => new WritingProgressView(leaf, this)
		);

		this.registerView(
			WEEKLY_STATISTIC_VIEW_TYPE,
			(leaf) => new WeeklyStatisticView(leaf, this)
		);

		this.registerView(
			MONTHLY_STATISTIC_VIEW_TYPE,
			(leaf) => new MonthlyStatisticView(leaf, this)
		);

		this.activateProgressView(false);

		this.addCommand({
			id: 'open-writing-progress-view',
			name: strings.openProgressView,
			callback: () => {
				this.activateProgressView(true);
			}
		});

		this.addCommand({
			id: 'open-weekly-statistic-view',
			name: strings.openWeeklyStatsView,
			callback: () => {
				this.activateWeeklyStatisticView(true);
			}
		});


		this.addCommand({
			id: 'open-monthly-statistic-view',
			name: strings.openMonthlyStatsView,
			callback: () => {
				this.activateMonthlyStatisticView(true);
			}
		});

		// Update global word count


		


		this.registerEvent(
			this.app.workspace.on("layout-change", async () => {
				this.updateGlobalWordCount()
				this.updateAllViews()
			})
		);


		this.registerEvent(
			this.app.workspace.on("active-leaf-change", async () => {
				this.updateGlobalWordCount()
				this.updateAllViews()
			})
		);


		this.registerEvent(
			this.app.workspace.on("file-open", async (file: TFile | null) => {
				if (file == this.app.workspace.getActiveFile()) {
					let progressView = this.getProgressView() 
					if (progressView) {
						progressView.updateView()
					}
				}
			})
		);







		

		



		this.registerEvent(
			this.app.workspace.on("editor-change", async () => {
				clearTimeout(this.timer);

				// Update global word count

				this.updateGlobalWordCount()

				// Save file wordcount property (wait 2 seconds after stopping typing to avoid data loss and annoying notices)


				let file: TFile | null = this.app.workspace.getActiveFile()

				if (file instanceof TFile) {
					let wordCount = await this.getFileWordCount(file)
					let wordCountProperty = this.settings.wordCountProperty
					let goalProperty = this.settings.goalProperty;

					this.timer = setTimeout(async() => {
						//@ts-ignore
						this.app.fileManager.processFrontMatter(file, (fm) => {
							if (fm[wordCountProperty] != wordCount && fm[goalProperty]) {
								fm[wordCountProperty] = wordCount
							}
							this.updateAllViews()
						})
					}, 2000)
				}

				// Update progress View

				this.updateProgressView()
			})
		);



		
		
		

	}

	onunload() {

	}



	getLocalStrings() {
		let lang: string = window.localStorage.getItem('language') ?? "en"
		let localStrings = {...LocaleMap}
		for (let key in localStrings) {
			let stringValues = localStrings[key]
			localStrings[key] = stringValues[lang] ?? stringValues["en"]
		}
		return localStrings
	}


	updateProgressView() {
		let progressView = this.getProgressView() 
		if (progressView) {
			progressView.updateView()
		}
	}



	async updateWeeklyStats() {
		let statisticView = this.getWeeklyStatisticView()
		if (statisticView) {
			statisticView.renderWeeklyStats()
		}
	}


	async updateMonthlyStats() {
		let statisticView = this.getMonthlyStatisticView()
		if (statisticView) {
			statisticView.renderMonthlyStats()
		}
	}




	async clearAllStats() {
    
		this.settings.dailyStats = []
		this.settings.startingCount = 0
		this.updateDailyStats()
		this.saveSettings()
		this.updateAllViews()
		
		
	  }
	
	
	
	
	
	  async clearTodayStats() {
		let dailyStats = this.settings.dailyStats;
		let globalWordCount = this.settings.currentGlobalWordCount;
		let today = window.moment().format("YYYY-MM-DD");
		let todayStat = dailyStats.find((stat: any) => stat.date == today);
		if (todayStat) {
		  todayStat.startWordCount = globalWordCount
		}

		this.saveSettings()
		this.updateAllViews()
		
		
	  }
	
	
	
	  async setFileGoal(file: TFile) {
		let goalProperty = this.settings.goalProperty;
		let num = await this.selectNumber(this.getLocalStrings().fileGoal, null)
		if (num) {
			await this.app.fileManager.processFrontMatter(file, (fm) => {
				fm[goalProperty] = num
			})
			setTimeout(() => {
				this.updateProgressView()
			}, 250);
		}
	  }





	  async changeDailyGoal() {
		let dailyGoal = this.settings.dailyGoal;
		let num: number = await this.selectNumber(this.getLocalStrings().dailyGoal, dailyGoal)
		if (num) {
			this.settings.dailyGoal = num
			this.saveSettings()
			setTimeout(() => {
				this.updateProgressView()
			}, 250);
		}
	  }


	  async changeWeeklyGoal() {
		let weeklyGoal = this.settings.weeklyGoal;
		let num: number = await this.selectNumber(this.getLocalStrings().weeklyGoal, weeklyGoal)
		if (num) {
			this.settings.weeklyGoal = num
			this.saveSettings()
			setTimeout(() => {
				this.updateWeeklyStats()
			}, 250);
		}
	  }


	  async changeMonthlyGoal() {
		let monthlyGoal = this.settings.monthlyGoal;
		let num: number = await this.selectNumber(this.getLocalStrings().monthlyGoal, monthlyGoal)
		if (num) {
			this.settings.monthlyGoal = num
			this.saveSettings()
			setTimeout(() => {
				this.updateMonthlyStats()
			}, 250);
		}
	  }




	
	
	  async selectNumber(name: string, defaultVal: number | null): Promise<number> {
		let data: Promise<number> = new Promise((resolve, reject) => {
		  new NumberInputModal(this.app, this, name, defaultVal, resolve, reject).open() 
		})
		return data
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
				startWordCount: this.settings.startingCount,
				endWordCount: globalWordCount
			}

			dailyStats.push(todayStat)
			this.settings.dailyStats = dailyStats
			

		} else {
			todayStat.endWordCount = globalWordCount
		}

		/*

		if (dailyStats.length > 0) {
			this.settings.startingCount = dailyStats[0].startWordCount	
		}
		*/


		await this.saveSettings()
	}


	getTodayStartWordCount() {
		let today = window.moment().format("YYYY-MM-DD")
		let dailyStats = this.settings.dailyStats
		let todayStat = dailyStats.find((stat:any) => stat.date == today)

		if (todayStat && dailyStats.length == 1) {
			return todayStat.startWordCount + this.settings.startingCount
		} else if (todayStat) {
			return todayStat.startWordCount
		} else return this.settings.startingCount
	}


	async updateAllViews() {
		this.updateProgressView()
		this.updateWeeklyStats()
		this.updateMonthlyStats()
	}




	async updateGlobalWordCount() {

		
		let globalWordCount = 0
		let allFiles = this.app.vault.getMarkdownFiles()
		let goalProperty = this.settings.goalProperty
		allFiles = allFiles.filter(file => this.hasTrueProperty(file, goalProperty))

		

		for (let file of allFiles) {
			let fileWordCount = await this.getFileWordCount(file)
			globalWordCount += fileWordCount
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



	getWeeklyStatisticView() {
		let view: any
		this.app.workspace.getLeavesOfType(WEEKLY_STATISTIC_VIEW_TYPE).forEach((leaf) => {
			if (leaf.view instanceof WeeklyStatisticView) {
			  view = leaf.view
			}
		});
		return view
	}


	getMonthlyStatisticView() {
		let view: any
		this.app.workspace.getLeavesOfType(MONTHLY_STATISTIC_VIEW_TYPE).forEach((leaf) => {
			if (leaf.view instanceof MonthlyStatisticView) {
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




	async activateWeeklyStatisticView(reveal:boolean) {
		this.app.workspace.onLayoutReady(async () => {

			const { workspace } = this.app;
			let leaf: WorkspaceLeaf | null = null;
			const leaves = workspace.getLeavesOfType(WEEKLY_STATISTIC_VIEW_TYPE);

			if (leaves.length > 0) {
				leaf = leaves[0];
			} else {
				leaf = workspace.getLeaf(true)!;
				await leaf.setViewState({ type: WEEKLY_STATISTIC_VIEW_TYPE, active: reveal });
			}

			if (reveal) {
				workspace.revealLeaf(leaf);
			}
		});
	}




	async activateMonthlyStatisticView(reveal:boolean) {
		this.app.workspace.onLayoutReady(async () => {

			const { workspace } = this.app;
			let leaf: WorkspaceLeaf | null = null;
			const leaves = workspace.getLeavesOfType(MONTHLY_STATISTIC_VIEW_TYPE);

			if (leaves.length > 0) {
				leaf = leaves[0];
			} else {
				leaf = workspace.getLeaf(true)!;
				await leaf.setViewState({ type: MONTHLY_STATISTIC_VIEW_TYPE, active: reveal });
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
		let strings = this.plugin.getLocalStrings()
		containerEl.empty();




		new Setting(containerEl)
		.setName(strings.goalProperty)
		.addText((text) => {
			text.setValue(this.plugin.settings.goalProperty)
			text.onChange((value) => {
				this.plugin.settings.goalProperty = value
				this.plugin.saveSettings()
				this.plugin.updateProgressView()
			})
		})


		new Setting(containerEl)
		.setName(strings.wordCountProperty)
		.addText((text) => {
			text.setValue(this.plugin.settings.wordCountProperty)
			text.onChange((value) => {
				this.plugin.settings.wordCountProperty = value
				this.plugin.saveSettings()
				this.plugin.updateProgressView()
			})
		})


		new Setting(containerEl)
		.setName(strings.filterCountedFilesProperty)
		.addText((text) => {
			text.setValue(this.plugin.settings.filterCountedFilesProperty)
			text.onChange((value) => {
				this.plugin.settings.filterCountedFilesProperty = value
				this.plugin.saveSettings()
				this.plugin.updateProgressView()
			})
		})

		


		new Setting(containerEl)
		.setName(strings.dailyGoal)
		.addText((text) => {
			text.inputEl.type = "number"
			text.setValue(this.plugin.settings.dailyGoal + "")
			text.onChange((value) => {
				this.plugin.settings.dailyGoal = Number(value)
				this.plugin.saveSettings()
				this.plugin.updateAllViews()
			})
		})


		new Setting(containerEl)
		.setName(strings.weeklyGoal)
		.addText((text) => {
			text.inputEl.type = "number"
			text.setValue(this.plugin.settings.weeklyGoal + "")
			text.onChange((value) => {
				this.plugin.settings.weeklyGoal = Number(value)
				this.plugin.saveSettings()
				this.plugin.updateWeeklyStats()
			})
		})


		new Setting(containerEl)
		.setName(strings.monthlyGoal)
		.addText((text) => {
			text.inputEl.type = "number"
			text.setValue(this.plugin.settings.monthlyGoal + "")
			text.onChange((value) => {
				this.plugin.settings.monthlyGoal = Number(value)
				this.plugin.saveSettings()
				this.plugin.updateMonthlyStats()
			})
		})


		new Setting(containerEl)
		.setName(strings.startingCount)
		.addText((text) => {
			text.inputEl.type = "number"
			text.setValue(this.plugin.settings.startingCount + "")
			text.onChange((value) => {
				this.plugin.settings.startingCount = Number(value)
				this.plugin.saveSettings()
				this.plugin.updateAllViews()
			})
		})
		.addButton((btn) => {
			btn.setIcon("clipboard-copy")
			.onClick(() => {
				this.plugin.settings.startingCount = this.plugin.settings.currentGlobalWordCount
				this.plugin.saveSettings()
				this.display()
				this.plugin.updateAllViews()
			})
			.setTooltip(strings.useCurrentWordcount)
		})
		.addButton((btn) => {
			btn.setIcon("rotate-ccw")
			.onClick(() => {
				this.plugin.settings.startingCount = DEFAULT_SETTINGS.currentGlobalWordCount
				this.plugin.saveSettings()
				this.display()
				this.plugin.updateAllViews()
			})
			.setTooltip(strings.reset)
		})


		new Setting(containerEl)
		.setName(strings.clearSavedStatistics)
		.addButton((btn) => {
			btn.setButtonText(strings.clearAllStats)
			btn.setClass("mod-warning")
			.onClick(() => {
				this.plugin.clearAllStats()
				this.display()
			})
		})
	}


	


}
