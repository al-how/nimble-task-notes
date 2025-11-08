import { Plugin, Notice } from "obsidian";
import { LightweightTasksSettings } from "./types";
import { DEFAULT_SETTINGS } from "./settings/defaults";
import { LightweightTasksSettingTab } from "./settings/SettingTab";
import { TaskManager } from "./utils/TaskManager";
import { TaskService } from "./services/TaskService";
import { FieldMapper } from "./services/FieldMapper";
import { ICSSubscriptionService } from "./services/ICSSubscriptionService";
import { CalendarImportService } from "./services/CalendarImportService";
import { NaturalLanguageParser } from "./services/NaturalLanguageParser";
import { TaskConversionService } from "./services/TaskConversionService";

export default class LightweightTasksPlugin extends Plugin {
  settings: LightweightTasksSettings;

  // Core services (Phase 2)
  taskManager: TaskManager;
  taskService: TaskService;
  fieldMapper: FieldMapper;

  // Calendar services (Phase 3)
  icsService: ICSSubscriptionService;
  calendarImportService: CalendarImportService;

  // Task conversion services (Phase 4)
  nlpParser: NaturalLanguageParser;
  taskConversionService: TaskConversionService;

  async onload() {
    console.log("Loading Lightweight Task Manager plugin");

    // Load settings
    await this.loadSettings();

    // Initialize core services (Phase 2)
    this.taskManager = new TaskManager(this.app, this);
    this.taskService = new TaskService(this.app, this, this.taskManager);
    this.fieldMapper = new FieldMapper(this);

    // Initialize calendar services (Phase 3)
    this.icsService = new ICSSubscriptionService(this, this.settings);
    await this.icsService.initialize();
    this.calendarImportService = new CalendarImportService(
      this,
      this.icsService,
      this.settings,
    );

    // Initialize task conversion services (Phase 4)
    this.nlpParser = new NaturalLanguageParser();
    this.taskConversionService = new TaskConversionService(this);

    // Add settings tab
    this.addSettingTab(new LightweightTasksSettingTab(this.app, this));

    // Add ribbon icon for calendar import (Phase 3)
    this.addRibbonIcon("calendar-days", "Import meetings", async () => {
      const activeFile = this.app.workspace.getActiveFile();
      if (!activeFile) {
        new Notice("No active note. Open a daily note first.");
        return;
      }

      await this.calendarImportService.importTodaysMeetings(activeFile);
    });

    // Add command for converting checkbox to task (Phase 4)
    this.addCommand({
      id: "convert-to-task",
      name: "Convert checkbox to task",
      editorCallback: async (editor) => {
        await this.taskConversionService.convertCheckboxToTask(editor);
      },
    });

    console.log("Lightweight Task Manager plugin loaded successfully");
    console.log("Phase 4 complete: Inline task conversion enabled");
  }

  onunload() {
    console.log("Unloading Lightweight Task Manager plugin");

    // Cleanup Phase 3 services
    if (this.icsService) {
      this.icsService.destroy();
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
