import { Plugin } from "obsidian";
import { LightweightTasksSettings } from "./types";
import { DEFAULT_SETTINGS } from "./settings/defaults";
import { LightweightTasksSettingTab } from "./settings/SettingTab";

export default class LightweightTasksPlugin extends Plugin {
	settings: LightweightTasksSettings;

	async onload() {
		console.log("Loading Lightweight Task Manager plugin");

		// Load settings
		await this.loadSettings();

		// Add settings tab
		this.addSettingTab(new LightweightTasksSettingTab(this.app, this));

		// Add ribbon icon for calendar import (placeholder for Phase 3)
		this.addRibbonIcon("calendar-days", "Import meetings", () => {
			console.log("Import meetings - not yet implemented (Phase 3)");
		});

		// Add command for converting checkbox to task (placeholder for Phase 4)
		this.addCommand({
			id: "convert-to-task",
			name: "Convert checkbox to task",
			editorCallback: (editor) => {
				console.log("Convert to task - not yet implemented (Phase 4)");
			},
		});

		console.log("Lightweight Task Manager plugin loaded successfully");
	}

	onunload() {
		console.log("Unloading Lightweight Task Manager plugin");
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
