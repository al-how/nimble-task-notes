import { TaskInfo, TaskCreationData } from "../types";
import LightweightTasksPlugin from "../main";

/**
 * FieldMapper: Property mapping between TaskInfo and frontmatter
 *
 * Handles conversion between internal TaskInfo structure and Obsidian
 * frontmatter format. Validates property types and provides defaults.
 */
export class FieldMapper {
  private plugin: LightweightTasksPlugin;

  constructor(plugin: LightweightTasksPlugin) {
    this.plugin = plugin;
  }

  /**
   * Convert TaskInfo to frontmatter format
   */
  mapTaskInfoToFrontmatter(task: TaskInfo): Record<string, any> {
    const propNames = this.plugin.settings.propertyNames;
    return {
      [propNames.status]: task.complete,
      [propNames.due]: task.due,
      [propNames.projects]: task.projects,
      [propNames.tags]: task.tags,
      [propNames.statusDescription]: task.statusDescription,
    };
  }

  /**
   * Parse frontmatter to TaskInfo object
   */
  mapFrontmatterToTaskInfo(frontmatter: any, path: string): TaskInfo | null {
    if (!this.validateTaskFrontmatter(frontmatter)) {
      return null;
    }

    const title = this.extractTitleFromPath(path);
    const propNames = this.plugin.settings.propertyNames;

    // Status: support both configured property name and legacy "complete" for backward compatibility
    const statusValue = frontmatter[propNames.status] ?? frontmatter.complete;
    const complete = typeof statusValue === "boolean" ? statusValue : false;

    // Due date: use configured property name
    let due: string | null = null;
    if (frontmatter[propNames.due]) {
      if (typeof frontmatter[propNames.due] === "string") {
        if (this.isValidDateString(frontmatter[propNames.due])) {
          due = frontmatter[propNames.due];
        }
      } else if (frontmatter[propNames.due] instanceof Date) {
        due = this.formatDate(frontmatter[propNames.due]);
      }
    }

    // Projects: use configured property name
    const projects = Array.isArray(frontmatter[propNames.projects])
      ? frontmatter[propNames.projects].filter(
          (p: any) => typeof p === "string" && this.isWikilink(p),
        )
      : [];

    // Tags: use configured property name
    const tags = Array.isArray(frontmatter[propNames.tags])
      ? frontmatter[propNames.tags].filter((t: any) => typeof t === "string")
      : ["task"];
    if (!tags.includes("task")) {
      tags.push("task");
    }

    // Status description: use configured property name
    const statusDescription =
      typeof frontmatter[propNames.statusDescription] === "string"
        ? frontmatter[propNames.statusDescription]
        : "";

    return {
      path,
      title,
      complete,
      due,
      projects,
      tags,
      statusDescription,
    };
  }

  /**
   * Validate task frontmatter structure
   */
  validateTaskFrontmatter(frontmatter: any): boolean {
    if (!frontmatter) return false;

    const propNames = this.plugin.settings.propertyNames;

    // Tags validation: use configured property name
    if (
      !Array.isArray(frontmatter[propNames.tags]) ||
      !frontmatter[propNames.tags].includes("task")
    ) {
      return false;
    }

    // Status validation: check configured property name, but also support legacy "complete"
    const statusValue = frontmatter[propNames.status] ?? frontmatter.complete;
    if (statusValue !== undefined && typeof statusValue !== "boolean") {
      return false;
    }

    // Due date validation: use configured property name
    if (frontmatter[propNames.due] !== undefined && frontmatter[propNames.due] !== null) {
      if (typeof frontmatter[propNames.due] === "string") {
        if (!this.isValidDateString(frontmatter[propNames.due])) {
          return false;
        }
      } else if (!(frontmatter[propNames.due] instanceof Date)) {
        return false;
      }
    }

    // Projects validation: use configured property name
    if (
      frontmatter[propNames.projects] !== undefined &&
      !Array.isArray(frontmatter[propNames.projects])
    ) {
      return false;
    }

    // Status description validation: use configured property name
    if (
      frontmatter[propNames.statusDescription] !== undefined &&
      typeof frontmatter[propNames.statusDescription] !== "string"
    ) {
      return false;
    }

    return true;
  }

  /**
   * Create default frontmatter for a new task
   */
  createDefaultFrontmatter(partial: Partial<TaskInfo>): Record<string, any> {
    const propNames = this.plugin.settings.propertyNames;

    const tags = partial.tags || [...this.plugin.settings.defaultTags];
    if (!tags.includes("task")) {
      tags.push("task");
    }

    return {
      [propNames.status]: partial.complete || false,
      [propNames.due]: partial.due || null,
      [propNames.projects]: partial.projects || [],
      [propNames.tags]: tags,
      [propNames.statusDescription]: partial.statusDescription || "",
    };
  }

  /**
   * Validate date string format (YYYY-MM-DD)
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
   */
  private isWikilink(str: string): boolean {
    return /^\[\[.+\]\]$/.test(str);
  }

  /**
   * Extract title from file path
   */
  private extractTitleFromPath(path: string): string {
    const parts = path.split("/");
    const filename = parts[parts.length - 1];
    return filename.replace(/\.md$/, "");
  }

  /**
   * Format Date object to YYYY-MM-DD string
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}
