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
    return {
      complete: task.complete,
      due: task.due,
      projects: task.projects,
      tags: task.tags,
      statusDescription: task.statusDescription,
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

    const complete =
      typeof frontmatter.complete === "boolean" ? frontmatter.complete : false;

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

    const projects = Array.isArray(frontmatter.projects)
      ? frontmatter.projects.filter(
          (p: any) => typeof p === "string" && this.isWikilink(p),
        )
      : [];

    const tags = Array.isArray(frontmatter.tags)
      ? frontmatter.tags.filter((t: any) => typeof t === "string")
      : ["task"];
    if (!tags.includes("task")) {
      tags.push("task");
    }

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
    };
  }

  /**
   * Validate task frontmatter structure
   */
  validateTaskFrontmatter(frontmatter: any): boolean {
    if (!frontmatter) return false;

    if (
      !Array.isArray(frontmatter.tags) ||
      !frontmatter.tags.includes("task")
    ) {
      return false;
    }

    if (
      frontmatter.complete !== undefined &&
      typeof frontmatter.complete !== "boolean"
    ) {
      return false;
    }

    if (frontmatter.due !== undefined && frontmatter.due !== null) {
      if (typeof frontmatter.due === "string") {
        if (!this.isValidDateString(frontmatter.due)) {
          return false;
        }
      } else if (!(frontmatter.due instanceof Date)) {
        return false;
      }
    }

    if (
      frontmatter.projects !== undefined &&
      !Array.isArray(frontmatter.projects)
    ) {
      return false;
    }

    if (
      frontmatter.statusDescription !== undefined &&
      typeof frontmatter.statusDescription !== "string"
    ) {
      return false;
    }

    return true;
  }

  /**
   * Create default frontmatter for a new task
   */
  createDefaultFrontmatter(partial: Partial<TaskInfo>): Record<string, any> {
    const tags = partial.tags || [...this.plugin.settings.defaultTags];
    if (!tags.includes("task")) {
      tags.push("task");
    }

    return {
      complete: partial.complete || false,
      due: partial.due || null,
      projects: partial.projects || [],
      tags,
      statusDescription: partial.statusDescription || "",
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
