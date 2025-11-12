import { App, Notice, TFile, normalizePath } from "obsidian";
import {
  TaskInfo,
  TaskCreationData,
  EVENT_TASK_UPDATED,
  EVENT_TASK_CREATED,
  EVENT_TASK_DELETED,
} from "../types";
import LightweightTasksPlugin from "../main";
import { TaskManager } from "../utils/TaskManager";
import { stringify as stringifyYaml, parse as parseYaml } from "yaml";

/**
 * TaskService: Task CRUD operations and file management
 */
export class TaskService {
  private app: App;
  private plugin: LightweightTasksPlugin;
  private taskManager: TaskManager;

  private readonly WINDOWS_RESERVED_NAMES = [
    "CON",
    "PRN",
    "AUX",
    "NUL",
    "COM1",
    "COM2",
    "COM3",
    "COM4",
    "COM5",
    "COM6",
    "COM7",
    "COM8",
    "COM9",
    "LPT1",
    "LPT2",
    "LPT3",
    "LPT4",
    "LPT5",
    "LPT6",
    "LPT7",
    "LPT8",
    "LPT9",
  ];

  constructor(
    app: App,
    plugin: LightweightTasksPlugin,
    taskManager: TaskManager,
  ) {
    this.app = app;
    this.plugin = plugin;
    this.taskManager = taskManager;
  }

  async createTask(data: TaskCreationData): Promise<TFile> {
    try {
      const sanitizedTitle = this.sanitizeTitle(data.title || "Untitled Task");
      const folder = this.plugin.settings.taskFolder;
      const filename = this.generateUniqueFilename(sanitizedTitle, folder);
      const path = normalizePath(`${folder}/${filename}.md`);

      await this.ensureFolderExists(folder);

      const frontmatter = this.buildFrontmatter(data);
      const content = this.buildFileContent(frontmatter, sanitizedTitle);

      const file = await this.app.vault.create(path, content);

      this.app.workspace.trigger(EVENT_TASK_CREATED, {
        file,
        task: this.taskManager.getTaskInfo(file.path),
      });

      return file;
    } catch (error) {
      console.error("Task creation failed:", {
        error,
        data,
        stack: (error as Error).stack,
      });
      new Notice(
        `Failed to create task: ${data.title || "Untitled Task"}`,
        5000,
      );
      throw error;
    }
  }

  async updateTask(path: string, updates: Partial<TaskInfo>): Promise<void> {
    try {
      const file = this.app.vault.getAbstractFileByPath(path);
      if (!(file instanceof TFile)) {
        throw new Error(`File not found: ${path}`);
      }

      const content = await this.app.vault.read(file);
      const { frontmatter, body } = this.parseFrontmatter(content);

      const statusProp = this.plugin.settings.propertyNames.status;
      if (updates.complete !== undefined) {
        frontmatter[statusProp] = updates.complete;
      }
      if (updates.due !== undefined) {
        frontmatter.due = updates.due;
      }
      if (updates.projects !== undefined) {
        frontmatter.projects = updates.projects;
      }
      if (updates.tags !== undefined) {
        const tags = Array.isArray(updates.tags) ? updates.tags : ["task"];
        if (!tags.includes("task")) {
          tags.push("task");
        }
        frontmatter.tags = tags;
      }
      if (updates.statusDescription !== undefined) {
        frontmatter.statusDescription = updates.statusDescription;
      }

      const newContent = this.buildFileContent(frontmatter, body);
      await this.app.vault.modify(file, newContent);

      this.app.workspace.trigger(EVENT_TASK_UPDATED, {
        file,
        task: this.taskManager.getTaskInfo(file.path),
        changes: updates,
      });
    } catch (error) {
      console.error("Task update failed:", {
        error,
        path,
        updates,
        stack: (error as Error).stack,
      });
      new Notice(`Failed to update task at: ${path}`, 5000);
      throw error;
    }
  }

  async updateTaskStatus(path: string, complete: boolean): Promise<void> {
    await this.updateTask(path, { complete });
  }

  async updateTaskProjects(path: string, projects: string[]): Promise<void> {
    await this.updateTask(path, { projects });
  }

  async updateTaskDueDate(path: string, due: string | null): Promise<void> {
    await this.updateTask(path, { due });
  }

  async deleteTask(path: string): Promise<void> {
    try {
      const file = this.app.vault.getAbstractFileByPath(path);
      if (!(file instanceof TFile)) {
        throw new Error(`File not found: ${path}`);
      }

      const task = this.taskManager.getTaskInfo(path);
      await this.app.vault.delete(file);

      this.app.workspace.trigger(EVENT_TASK_DELETED, {
        path,
        task,
      });
    } catch (error) {
      console.error("Task deletion failed:", {
        error,
        path,
        stack: (error as Error).stack,
      });
      new Notice(`Failed to delete task at: ${path}`, 5000);
      throw error;
    }
  }

  sanitizeTitle(title: string): string {
    let sanitized = title
      .trim()
      .replace(/[\[\]#\^\|]/g, "-")
      .replace(/[*"\\/<>:]/g, "-")
      .replace(/\?/g, "")
      .replace(/\s+/g, " ")
      .replace(/^\.+|\.+$/g, "");

    if (!sanitized) {
      return "Untitled Task";
    }

    const upperName = sanitized.toUpperCase();
    if (this.WINDOWS_RESERVED_NAMES.includes(upperName)) {
      sanitized = `${sanitized}_`;
    }

    if (sanitized.length > 200) {
      sanitized = sanitized.slice(0, 200);
    }

    return sanitized;
  }

  generateUniqueFilename(title: string, folder: string): string {
    let filename = title;
    let counter = 1;

    while (
      this.app.vault.getAbstractFileByPath(
        normalizePath(`${folder}/${filename}.md`),
      )
    ) {
      filename = `${title} ${counter}`;
      counter++;
    }

    return filename;
  }

  private buildFrontmatter(data: TaskCreationData): Record<string, any> {
    const tags = data.tags || [...this.plugin.settings.defaultTags];
    if (!tags.includes("task")) {
      tags.push("task");
    }

    const statusProp = this.plugin.settings.propertyNames.status;
    return {
      [statusProp]: data.complete || false,
      due: data.due || null,
      projects: data.projects || [],
      tags,
      statusDescription: data.statusDescription || "",
    };
  }

  private buildFileContent(
    frontmatter: Record<string, any>,
    body: string,
  ): string {
    const yaml = stringifyYaml(frontmatter);
    return `---\n${yaml}---\n\n${body}`;
  }

  private parseFrontmatter(content: string): {
    frontmatter: Record<string, any>;
    body: string;
  } {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n\n?([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (match) {
      try {
        const frontmatter = parseYaml(match[1]);
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

  private async ensureFolderExists(folderPath: string): Promise<void> {
    const normalizedPath = normalizePath(folderPath);
    const folder = this.app.vault.getAbstractFileByPath(normalizedPath);

    if (!folder) {
      await this.app.vault.createFolder(normalizedPath);
    }
  }
}
