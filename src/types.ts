import { TFile } from "obsidian";

/**
 * Core task information structure
 */
export interface TaskInfo {
	/** File path of the task note */
	path: string;

	/** Task title (from filename or frontmatter) */
	title: string;

	/** Completion status */
	complete: boolean;

	/** Due date in YYYY-MM-DD format */
	due: string | null;

	/** Associated projects as wikilinks */
	projects: string[];

	/** Tags for categorization (always includes 'task') */
	tags: string[];

	/** Free-text status description */
	statusDescription: string;

	/** Reference to the Obsidian TFile object */
	file?: TFile;
}

/**
 * Data structure for creating a new task
 */
export interface TaskCreationData {
	/** Task title */
	title: string;

	/** Completion status (default: false) */
	complete?: boolean;

	/** Due date in YYYY-MM-DD format */
	due?: string | null;

	/** Associated projects as wikilinks */
	projects?: string[];

	/** Tags (always includes 'task') */
	tags?: string[];

	/** Free-text status description */
	statusDescription?: string;
}

/**
 * Plugin settings interface
 */
export interface LightweightTasksSettings {
	/** Folder path for task notes */
	taskFolder: string;

	/** Folder path for meeting notes */
	meetingFolder: string;

	/** Outlook calendar ICS feed URL */
	calendarURL: string;

	/** Default tags to add to new tasks */
	defaultTags: string[];

	/** Enable natural language date parsing */
	enableNaturalLanguageDates: boolean;

	/** Show convert button at end of checkbox lines */
	showConvertButton: boolean;

	/** Enable HTTP API for MCP integration */
	enableHTTPAPI: boolean;

	/** HTTP API port */
	apiPort: number;

	/** API key for authentication */
	apiKey: string;
}

/**
 * Event data for task updates
 */
export interface TaskUpdatedEvent {
	file: TFile;
	task: TaskInfo;
	changes?: Partial<TaskInfo>;
}

/**
 * Calendar event from ICS feed
 */
export interface CalendarEvent {
	/** Event title/summary */
	title: string;

	/** Start time */
	start: Date;

	/** End time */
	end: Date;

	/** Is all-day event */
	allDay: boolean;
}

// Event constants
export const EVENT_TASK_UPDATED = "lightweight-tasks:task-updated";
export const EVENT_TASK_CREATED = "lightweight-tasks:task-created";
export const EVENT_TASK_DELETED = "lightweight-tasks:task-deleted";
