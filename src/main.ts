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
import { ProjectDiscoveryService } from "./services/ProjectDiscoveryService";
import { PeopleDiscoveryService } from "./services/PeopleDiscoveryService";

export default class LightweightTasksPlugin extends Plugin {
	settings: LightweightTasksSettings;
	container: ServiceContainer;

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

			const calendarService = this.container.get<CalendarImportService>(
				"calendarImportService",
			);
			await calendarService.importTodaysMeetings(activeFile);
		});

		// Add command for converting checkbox to task (Phase 4)
		// Task conversion service lazy-loaded on first use
		this.addCommand({
			id: "convert-to-task",
			name: "Convert checkbox to task",
			editorCallback: async (editor) => {
				const conversionService =
					this.container.get<TaskConversionService>(
						"taskConversionService",
					);
				await conversionService.convertCheckboxToTask(editor);
			},
		});

		// Add metadata change listener to auto-update completion date
		this.registerEvent(
			this.app.metadataCache.on("changed", async (file) => {
				await this.handleMetadataChange(file);
			}),
		);

		const loadTime = (performance.now() - startTime).toFixed(2);
		console.log(`Lightweight Task Manager loaded in ${loadTime}ms`);
		console.log(
			`Registered services: ${this.container.getRegisteredServices().join(", ")}`,
		);
	}

	/**
	 * Register all services with lazy loading factories.
	 * Services are NOT instantiated until first get() call.
	 */
	private registerServices(): void {
		// Core services (Phase 2)
		this.container.register(
			"taskManager",
			() => new TaskManager(this.app, this),
		);

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
			const icsService =
				this.container.get<ICSSubscriptionService>("icsService");
			return new CalendarImportService(this, icsService, this.settings);
		});

		// Task conversion services (Phase 4) - Lazy loaded on first conversion
		this.container.register("nlpParser", () => new NaturalLanguageParser());

		this.container.register(
			"taskConversionService",
			() => new TaskConversionService(this),
		);

		// Project discovery service - Lazy loaded when project suggestions used
		this.container.register(
			"projectDiscovery",
			() => new ProjectDiscoveryService(this.app, this.settings),
		);

		// People discovery service - Lazy loaded when people suggestions used
		this.container.register(
			"peopleDiscovery",
			() => new PeopleDiscoveryService(this.app, this.settings),
		);
	}

	/**
	 * Get a service from the container.
	 * Provides type-safe access to services for external use.
	 */
	getService<T>(key: string): T {
		return this.container.get<T>(key);
	}

	/**
	 * Handle metadata changes to auto-update completion date.
	 * When taskStatus changes, automatically set/clear the completed date.
	 */
	private async handleMetadataChange(file: any): Promise<void> {
		try {
			const taskManager = this.container.get<TaskManager>("taskManager");

			// Check if this is a task file
			const cache = this.app.metadataCache.getFileCache(file);
			if (!cache?.frontmatter) return;

			if (!taskManager.isTaskFile(cache.frontmatter)) return;

			const propNames = this.settings.propertyNames;
			const statusValue =
				cache.frontmatter[propNames.status] ??
				cache.frontmatter.complete;
			const currentCompleted = cache.frontmatter[propNames.completed];

			// Determine what the completed date should be
			const shouldHaveCompletedDate = statusValue === true;
			let needsUpdate = false;

			if (shouldHaveCompletedDate && !currentCompleted) {
				// Task is complete but missing completion date - add it
				needsUpdate = true;
			} else if (!shouldHaveCompletedDate && currentCompleted) {
				// Task is incomplete but has completion date - remove it
				needsUpdate = true;
			}

			if (needsUpdate) {
				// Read the file and update the frontmatter directly
				const content = await this.app.vault.read(file);
				const { frontmatter, body } = this.parseFrontmatter(content);

				if (shouldHaveCompletedDate) {
					// Add today's date
					frontmatter[propNames.completed] =
						this.formatDateForFrontmatter(new Date());
				} else {
					// Clear the date
					frontmatter[propNames.completed] = null;
				}

				// Write back to file
				const newContent = this.buildFileContent(frontmatter, body);
				await this.app.vault.modify(file, newContent);
			}
		} catch (error) {
			console.error("Error handling metadata change:", error);
		}
	}

	private parseFrontmatter(content: string): {
		frontmatter: Record<string, any>;
		body: string;
	} {
		const frontmatterRegex = /^---\n([\s\S]*?)\n---\n\n?([\s\S]*)$/;
		const match = content.match(frontmatterRegex);

		if (match) {
			try {
				// Import YAML at runtime
				const YAML = require("yaml");
				const frontmatter = YAML.parse(match[1]);
				return {
					frontmatter: frontmatter || {},
					body: match[2] || "",
				};
			} catch (error) {
				console.error("Failed to parse frontmatter:", error);
			}
		}

		return {
			frontmatter: {},
			body: content,
		};
	}

	private buildFileContent(
		frontmatter: Record<string, any>,
		body: string,
	): string {
		const YAML = require("yaml");
		const yaml = YAML.stringify(frontmatter);
		return `---\n${yaml}---\n\n${body}`;
	}

	private formatDateForFrontmatter(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	}

	onunload() {
		console.log("Unloading Lightweight Task Manager plugin");

		// Clear service container (calls destroy() on all services)
		if (this.container) {
			this.container.clear();
		}
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
