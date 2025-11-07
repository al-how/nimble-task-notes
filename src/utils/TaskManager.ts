import { App, Events, MetadataCache, TFile } from "obsidian";
import { TaskInfo } from "../types";
import LightweightTasksPlugin from "../main";

/**
 * TaskManager: Just-In-Time (JIT) task data access layer
 *
 * Reads task data on-demand from Obsidian's MetadataCache with NO internal caching.
 * All queries are synchronous for simplicity and reduced latency.
 *
 * Key Responsibilities:
 * - Identify task files (those with #task tag)
 * - Retrieve task information synchronously from metadata cache
 * - Provide queries: getAllTasks, getTasksForDate, getTasksDueInRange, etc.
 * - Emit events when tasks are modified
 *
 * Architectural Decision: Synchronous Data Access
 * - Obsidian's metadataCache.getCache() is synchronous
 * - No promises/async - simplifies calling code
 * - Returns null if frontmatter not cached yet
 * - Caller can subscribe to file update events to retry
 *
 * Simplifications from TaskNotes:
 * - ❌ No dependency caching
 * - ❌ No old compatibility layer
 * - ✅ Keep JIT pattern
 * - ✅ Keep event-driven architecture
 *
 * @example
 * const taskManager = new TaskManager(app, plugin);
 * const allTasks = taskManager.getAllTasks();
 * const task = taskManager.getTaskInfo("Tasks/MyTask.md");
 */
export class TaskManager extends Events {
  private app: App;
  private plugin: LightweightTasksPlugin;
  private metadataCache: MetadataCache;

  constructor(app: App, plugin: LightweightTasksPlugin) {
    super();
    this.app = app;
    this.plugin = plugin;
    this.metadataCache = app.metadataCache;
  }

  /**
   * Check if a file is a task file
   *
   * A file is considered a task if its frontmatter contains
   * the 'task' tag in the tags array.
   *
   * @param frontmatter - Frontmatter object from metadata cache
   * @returns True if file has #task tag
   */
  isTaskFile(frontmatter: any): boolean {
    if (!frontmatter) return false;
    const tags = frontmatter.tags || [];
    return Array.isArray(tags) && tags.includes("task");
  }

  /**
   * Get task information for a specific file (synchronous)
   *
   * Reads task data from metadata cache. Returns null if:
   * - File doesn't exist
   * - File is not a task (missing #task tag)
   * - Frontmatter not yet cached
   *
   * @param path - File path
   * @returns TaskInfo object or null if not a valid task
   */
  getTaskInfo(path: string): TaskInfo | null {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) {
      return null;
    }

    const metadata = this.metadataCache.getCache(path);
    if (!metadata || !metadata.frontmatter) {
      return null;
    }

    const frontmatter = metadata.frontmatter;
    if (!this.isTaskFile(frontmatter)) {
      return null;
    }

    // Extract title from filename
    const title = file.basename;

    // Parse complete (boolean)
    const complete =
      typeof frontmatter.complete === "boolean" ? frontmatter.complete : false;

    // Parse due date (YYYY-MM-DD string or null)
    let due: string | null = null;
    if (frontmatter.due) {
      if (typeof frontmatter.due === "string") {
        if (this.isValidDateString(frontmatter.due)) {
          due = frontmatter.due;
        }
      } else if (frontmatter.due instanceof Date) {
        due = this.formatDate(frontmatter.due);
      }
    }

    // Parse projects (array of wikilinks)
    const projects = Array.isArray(frontmatter.projects)
      ? frontmatter.projects.filter(
          (p: any) => typeof p === "string" && this.isWikilink(p),
        )
      : [];

    // Parse tags (array of strings)
    const tags = Array.isArray(frontmatter.tags)
      ? frontmatter.tags.filter((t: any) => typeof t === "string")
      : ["task"];

    // Parse statusDescription (string)
    const statusDescription =
      typeof frontmatter.statusDescription === "string"
        ? frontmatter.statusDescription
        : "";

    return {
      path,
      title,
      complete,
      due,
      projects,
      tags,
      statusDescription,
      file,
    };
  }

  /**
   * Get all task files in the vault
   *
   * @returns Array of all task files
   */
  getAllTasks(): TaskInfo[] {
    const tasks: TaskInfo[] = [];

    // Iterate all files in vault
    this.app.vault.getMarkdownFiles().forEach((file) => {
      const task = this.getTaskInfo(file.path);
      if (task) {
        tasks.push(task);
      }
    });

    return tasks;
  }

  /**
   * Get all TFile objects that are tasks
   *
   * @returns Array of TFile objects
   */
  getTaskFiles(): TFile[] {
    return this.app.vault.getMarkdownFiles().filter((file) => {
      const metadata = this.metadataCache.getCache(file.path);
      return metadata && this.isTaskFile(metadata.frontmatter);
    });
  }

  /**
   * Get tasks filtered by date (exact date match)
   *
   * @param date - Date string in YYYY-MM-DD format
   * @returns Array of task paths
   */
  getTasksForDate(date: string): string[] {
    return this.getAllTasks()
      .filter((task) => task.due === date)
      .map((task) => task.path);
  }

  /**
   * Get tasks due within a date range (inclusive)
   *
   * @param start - Start date in YYYY-MM-DD format
   * @param end - End date in YYYY-MM-DD format
   * @returns Array of TaskInfo objects
   */
  getTasksDueInRange(start: string, end: string): TaskInfo[] {
    return this.getAllTasks().filter((task) => {
      if (!task.due) return false;
      return task.due >= start && task.due <= end;
    });
  }

  /**
   * Get all incomplete tasks
   *
   * @returns Array of TaskInfo objects with complete === false
   */
  getIncompleteTasks(): TaskInfo[] {
    return this.getAllTasks().filter((task) => !task.complete);
  }

  /**
   * Get all completed tasks
   *
   * @returns Array of TaskInfo objects with complete === true
   */
  getCompleteTasks(): TaskInfo[] {
    return this.getAllTasks().filter((task) => task.complete);
  }

  /**
   * Get tasks associated with a specific project
   *
   * @param projectWikilink - Project wikilink (e.g., [[Project Name]])
   * @returns Array of TaskInfo objects
   */
  getTasksForProject(projectWikilink: string): TaskInfo[] {
    return this.getAllTasks().filter((task) =>
      task.projects.includes(projectWikilink),
    );
  }

  /**
   * Get tasks with a specific tag
   *
   * @param tag - Tag name (without #)
   * @returns Array of TaskInfo objects
   */
  getTasksWithTag(tag: string): TaskInfo[] {
    return this.getAllTasks().filter((task) => task.tags.includes(tag));
  }

  /**
   * Get overdue tasks (due date is in the past)
   *
   * @returns Array of TaskInfo objects with due date before today
   */
  getOverdueTasks(): TaskInfo[] {
    const today = this.formatDate(new Date());
    return this.getAllTasks().filter(
      (task) => task.due && task.due < today && !task.complete,
    );
  }

  /**
   * Check if date string is valid (YYYY-MM-DD format)
   *
   * @private
   * @param dateStr - Date string to validate
   * @returns True if valid date string
   */
  private isValidDateString(dateStr: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      return false;
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return false;
    }

    return true;
  }

  /**
   * Check if string is a wikilink format
   *
   * @private
   * @param str - String to check
   * @returns True if format [[Name]]
   */
  private isWikilink(str: string): boolean {
    return /^\[\[.+\]\]$/.test(str);
  }

  /**
   * Format Date object to YYYY-MM-DD string
   *
   * @private
   * @param date - Date object
   * @returns Date string in YYYY-MM-DD format
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}
