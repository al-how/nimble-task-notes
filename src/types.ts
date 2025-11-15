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

  /** Completion date in YYYY-MM-DD format */
  completed: string | null;

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

  /** Completion date in YYYY-MM-DD format */
  completed?: string | null;

  /** Associated projects as wikilinks */
  projects?: string[];

  /** Tags (always includes 'task') */
  tags?: string[];

  /** Free-text status description */
  statusDescription?: string;
}

/**
 * Property name configuration for task frontmatter
 */
export interface PropertyNames {
  /** Name of the status/completion property (default: "taskStatus") */
  status: string;
  /** Name of the due date property (default: "due") */
  due: string;
  /** Name of the completed date property (default: "completed") */
  completed: string;
  /** Name of the projects property (default: "projects") */
  projects: string;
  /** Name of the tags property (default: "tags") */
  tags: string;
  /** Name of the status description property (default: "statusDescription") */
  statusDescription: string;
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

  /** Configurable property names for task frontmatter */
  propertyNames: PropertyNames;

  /** Enable project suggestions in task creation modal */
  enableProjectSuggestions: boolean;

  /** Folder containing project files (empty = vault root) */
  projectsSourceFolder: string;

  /** Tag that identifies project files (without #) */
  projectsRequiredTag: string;

  /** Frontmatter property containing status value */
  projectsStatusProperty: string;

  /** Status values to exclude from suggestions */
  projectsExcludedStatuses: string[];
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
 * Calendar event from ICS feed (parsed)
 */
export interface ICSEvent {
  /** Unique event ID */
  id: string;

  /** Event title/summary */
  title: string;

  /** Start time as ISO string or YYYY-MM-DD for all-day */
  start: string;

  /** End time as ISO string or YYYY-MM-DD for all-day */
  end?: string;

  /** Is all-day event */
  allDay: boolean;

  /** Event description */
  description?: string;

  /** Event location */
  location?: string;
}

/**
 * ICS subscription cache
 */
export interface ICSCache {
  /** Subscription ID */
  subscriptionId: string;

  /** Cached events */
  events: ICSEvent[];

  /** When cache was last updated */
  lastUpdated: string;

  /** When cache expires */
  expires: string;
}

/**
 * Checkbox data extracted from editor line
 */
export interface CheckboxData {
	/** Indentation before checkbox (spaces/tabs) */
	indent: string;

	/** Checkbox status: ' ' | 'x' | 'X' */
	status: string;

	/** Task title text after checkbox */
	title: string;

	/** Whether checkbox is checked */
	complete: boolean;
}

/**
 * Result from task creation modal
 */
export interface TaskCreationModalResult {
	/** Parsed due date or null */
	dueDate: Date | null;

	/** Array of project wikilinks */
	projects: string[];

	/** Additional tags beyond default */
	additionalTags: string[];
}

// Event constants
export const EVENT_TASK_UPDATED = "lightweight-tasks:task-updated";
export const EVENT_TASK_CREATED = "lightweight-tasks:task-created";
export const EVENT_TASK_DELETED = "lightweight-tasks:task-deleted";
