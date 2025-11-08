import { Plugin, Notice } from "obsidian";
import { LightweightTasksSettings } from "./types";
import { DEFAULT_SETTINGS } from "./settings/defaults";
import { LightweightTasksSettingTab } from "./settings/SettingTab";
import { ServiceContainer } from "./utils/ServiceContainer";
import { TaskManager } from "./utils/TaskManager";
import { TaskService } from "./services/TaskService";
import { FieldMapper } from "./services/FieldMapper";
import { ICSSubscriptionService } from "./services/ICSSubscriptionService";
import { CalendarImportService } from "./services/CalendarImportService";
import { NaturalLanguageParser } from "./services/NaturalLanguageParser";
import { TaskConversionService } from "./services/TaskConversionService";

export default class LightweightTasksPlugin extends Plugin {
  settings: LightweightTasksSettings;
  private container: ServiceContainer;

  async onload() {
    const startTime = performance.now();
    console.log("Loading Lightweight Task Manager plugin");

    // Load settings
    await this.loadSettings();

    // Initialize service container with lazy loading
    this.container = new ServiceContainer();
    this.registerServices();

    // Add settings tab
    this.addSettingTab(new LightweightTasksSettingTab(this.app, this));

    // Add ribbon icon for calendar import (Phase 3)
    // Services are lazy-loaded on first click
    this.addRibbonIcon("calendar-days", "Import meetings", async () => {
      const activeFile = this.app.workspace.getActiveFile();
      if (!activeFile) {
        new Notice("No active note. Open a daily note first.");
        return;
      }

      const calendarService = this.container.get<CalendarImportService>("calendarImportService");
      await calendarService.importTodaysMeetings(activeFile);
    });

    // Add command for converting checkbox to task (Phase 4)
    // Task conversion service lazy-loaded on first use
    this.addCommand({
      id: "convert-to-task",
      name: "Convert checkbox to task",
      editorCallback: async (editor) => {
        const conversionService = this.container.get<TaskConversionService>("taskConversionService");
        await conversionService.convertCheckboxToTask(editor);
      },
    });

    const loadTime = (performance.now() - startTime).toFixed(2);
    console.log(`Lightweight Task Manager loaded in ${loadTime}ms`);
    console.log(`Registered services: ${this.container.getRegisteredServices().join(", ")}`);
  }

  /**
   * Register all services with lazy loading factories.
   * Services are NOT instantiated until first get() call.
   */
  private registerServices(): void {
    // Core services (Phase 2)
    this.container.register("taskManager", () => new TaskManager(this.app, this));

    this.container.register("fieldMapper", () => new FieldMapper(this));

    this.container.register("taskService", () => {
      const taskManager = this.container.get<TaskManager>("taskManager");
      return new TaskService(this.app, this, taskManager);
    });

    // Calendar services (Phase 3) - Lazy loaded on first calendar import
    this.container.register("icsService", () => {
      const service = new ICSSubscriptionService(this, this.settings);
      // Initialize asynchronously in background (non-blocking)
      service.initialize().catch((error) => {
        console.error("Failed to initialize ICS service:", error);
      });
      return service;
    });

    this.container.register("calendarImportService", () => {
      const icsService = this.container.get<ICSSubscriptionService>("icsService");
      return new CalendarImportService(this, icsService, this.settings);
    });

    // Task conversion services (Phase 4) - Lazy loaded on first conversion
    this.container.register("nlpParser", () => new NaturalLanguageParser());

    this.container.register("taskConversionService", () => new TaskConversionService(this));
  }

  /**
   * Get a service from the container.
   * Provides type-safe access to services for external use.
   */
  getService<T>(key: string): T {
    return this.container.get<T>(key);
  }

  onunload() {
    console.log("Unloading Lightweight Task Manager plugin");

    // Clear service container (calls destroy() on all services)
    if (this.container) {
      this.container.clear();
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
