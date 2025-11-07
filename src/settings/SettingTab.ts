import { App, PluginSettingTab, Setting } from "obsidian";
import LightweightTasksPlugin from "../main";

export class LightweightTasksSettingTab extends PluginSettingTab {
	plugin: LightweightTasksPlugin;

	constructor(app: App, plugin: LightweightTasksPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Lightweight Task Manager Settings" });

		// Task Folder
		new Setting(containerEl)
			.setName("Task folder")
			.setDesc("Folder where task notes will be created")
			.addText((text) =>
				text
					.setPlaceholder("Tasks")
					.setValue(this.plugin.settings.taskFolder)
					.onChange(async (value) => {
						this.plugin.settings.taskFolder = value;
						await this.plugin.saveSettings();
					})
			);

		// Meeting Folder
		new Setting(containerEl)
			.setName("Meeting folder")
			.setDesc("Folder where meeting notes will be created")
			.addText((text) =>
				text
					.setPlaceholder("Meetings")
					.setValue(this.plugin.settings.meetingFolder)
					.onChange(async (value) => {
						this.plugin.settings.meetingFolder = value;
						await this.plugin.saveSettings();
					})
			);

		// Calendar Integration
		containerEl.createEl("h3", { text: "Calendar Integration" });

		new Setting(containerEl)
			.setName("Outlook calendar URL")
			.setDesc("ICS feed URL from Outlook calendar")
			.addText((text) =>
				text
					.setPlaceholder("https://outlook.office365.com/owa/calendar/...")
					.setValue(this.plugin.settings.calendarURL)
					.onChange(async (value) => {
						this.plugin.settings.calendarURL = value;
						await this.plugin.saveSettings();
					})
			);

		// Task Creation
		containerEl.createEl("h3", { text: "Task Creation" });

		new Setting(containerEl)
			.setName("Natural language dates")
			.setDesc("Enable parsing of dates like 'tomorrow', 'next Friday', etc.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableNaturalLanguageDates)
					.onChange(async (value) => {
						this.plugin.settings.enableNaturalLanguageDates = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Show convert button")
			.setDesc("Show button at end of checkbox lines to convert to task")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showConvertButton)
					.onChange(async (value) => {
						this.plugin.settings.showConvertButton = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Default tags")
			.setDesc("Comma-separated tags to add to new tasks (always includes 'task')")
			.addText((text) =>
				text
					.setPlaceholder("task, work")
					.setValue(this.plugin.settings.defaultTags.join(", "))
					.onChange(async (value) => {
						this.plugin.settings.defaultTags = value
							.split(",")
							.map((tag) => tag.trim())
							.filter((tag) => tag.length > 0);
						if (!this.plugin.settings.defaultTags.includes("task")) {
							this.plugin.settings.defaultTags.unshift("task");
						}
						await this.plugin.saveSettings();
					})
			);

		// HTTP API (MCP Integration)
		containerEl.createEl("h3", { text: "HTTP API (for MCP Integration)" });

		new Setting(containerEl)
			.setName("Enable HTTP API")
			.setDesc("Enable HTTP API for external integrations (MCP server)")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableHTTPAPI)
					.onChange(async (value) => {
						this.plugin.settings.enableHTTPAPI = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("API port")
			.setDesc("Port for HTTP API server")
			.addText((text) =>
				text
					.setPlaceholder("27124")
					.setValue(String(this.plugin.settings.apiPort))
					.onChange(async (value) => {
						const port = parseInt(value);
						if (!isNaN(port) && port > 0 && port < 65536) {
							this.plugin.settings.apiPort = port;
							await this.plugin.saveSettings();
						}
					})
			);

		new Setting(containerEl)
			.setName("API key")
			.setDesc("Authentication key for API requests")
			.addText((text) =>
				text
					.setPlaceholder("Enter API key")
					.setValue(this.plugin.settings.apiKey)
					.onChange(async (value) => {
						this.plugin.settings.apiKey = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
