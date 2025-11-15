import { App, PluginSettingTab, Setting } from "obsidian";
import LightweightTasksPlugin from "../main";

export class LightweightTasksSettingTab extends PluginSettingTab {
  plugin: LightweightTasksPlugin;

  constructor(app: App, plugin: LightweightTasksPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl("h2", { text: "Lightweight Task Manager Settings" });

    // Task Folder
    new Setting(containerEl)
      .setName("Task folder")
      .setDesc("Folder where task notes will be created")
      .addText((text) =>
        text
          .setPlaceholder("Tasks")
          .setValue(this.plugin.settings.taskFolder)
          .onChange(async (value) => {
            this.plugin.settings.taskFolder = value;
            await this.plugin.saveSettings();
          }),
      );

    // Meeting Folder
    new Setting(containerEl)
      .setName("Meeting folder")
      .setDesc("Folder where meeting notes will be created")
      .addText((text) =>
        text
          .setPlaceholder("Meetings")
          .setValue(this.plugin.settings.meetingFolder)
          .onChange(async (value) => {
            this.plugin.settings.meetingFolder = value;
            await this.plugin.saveSettings();
          }),
      );

    // Calendar Integration
    containerEl.createEl("h3", { text: "Calendar Integration" });

    new Setting(containerEl)
      .setName("Outlook calendar URL")
      .setDesc("ICS feed URL from Outlook calendar")
      .addText((text) =>
        text
          .setPlaceholder("https://outlook.office365.com/owa/calendar/...")
          .setValue(this.plugin.settings.calendarURL)
          .onChange(async (value) => {
            this.plugin.settings.calendarURL = value;
            await this.plugin.saveSettings();
          }),
      );

    // Property Configuration
    containerEl.createEl("h3", { text: "Property Configuration" });

    new Setting(containerEl)
      .setName("Status property name")
      .setDesc("Name of the property that stores task completion status (boolean)")
      .addText((text) =>
        text
          .setPlaceholder("taskStatus")
          .setValue(this.plugin.settings.propertyNames.status)
          .onChange(async (value) => {
            const trimmed = value.trim();
            if (trimmed) {
              this.plugin.settings.propertyNames.status = trimmed;
              await this.plugin.saveSettings();
            }
          }),
      );

    new Setting(containerEl)
      .setName("Due date property name")
      .setDesc("Name of the property that stores task due date (YYYY-MM-DD)")
      .addText((text) =>
        text
          .setPlaceholder("due")
          .setValue(this.plugin.settings.propertyNames.due)
          .onChange(async (value) => {
            const trimmed = value.trim();
            if (trimmed) {
              this.plugin.settings.propertyNames.due = trimmed;
              await this.plugin.saveSettings();
            }
          }),
      );

    new Setting(containerEl)
      .setName("Completion date property name")
      .setDesc("Name of the property that stores task completion date (YYYY-MM-DD, auto-set when task marked complete)")
      .addText((text) =>
        text
          .setPlaceholder("completed")
          .setValue(this.plugin.settings.propertyNames.completed)
          .onChange(async (value) => {
            const trimmed = value.trim();
            if (trimmed) {
              this.plugin.settings.propertyNames.completed = trimmed;
              await this.plugin.saveSettings();
            }
          }),
      );

    new Setting(containerEl)
      .setName("Projects property name")
      .setDesc("Name of the property that stores project wikilinks (array)")
      .addText((text) =>
        text
          .setPlaceholder("projects")
          .setValue(this.plugin.settings.propertyNames.projects)
          .onChange(async (value) => {
            const trimmed = value.trim();
            if (trimmed) {
              this.plugin.settings.propertyNames.projects = trimmed;
              await this.plugin.saveSettings();
            }
          }),
      );

    new Setting(containerEl)
      .setName("Tags property name")
      .setDesc("Name of the property that stores tags (array, always includes 'task')")
      .addText((text) =>
        text
          .setPlaceholder("tags")
          .setValue(this.plugin.settings.propertyNames.tags)
          .onChange(async (value) => {
            const trimmed = value.trim();
            if (trimmed) {
              this.plugin.settings.propertyNames.tags = trimmed;
              await this.plugin.saveSettings();
            }
          }),
      );

    new Setting(containerEl)
      .setName("Status description property name")
      .setDesc("Name of the property that stores free-text status notes (string)")
      .addText((text) =>
        text
          .setPlaceholder("statusDescription")
          .setValue(this.plugin.settings.propertyNames.statusDescription)
          .onChange(async (value) => {
            const trimmed = value.trim();
            if (trimmed) {
              this.plugin.settings.propertyNames.statusDescription = trimmed;
              await this.plugin.saveSettings();
            }
          }),
      );

    // Task Creation
    containerEl.createEl("h3", { text: "Task Creation" });

    new Setting(containerEl)
      .setName("Natural language dates")
      .setDesc("Enable parsing of dates like 'tomorrow', 'next Friday', etc.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableNaturalLanguageDates)
          .onChange(async (value) => {
            this.plugin.settings.enableNaturalLanguageDates = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Show convert button")
      .setDesc("Show button at end of checkbox lines to convert to task")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showConvertButton)
          .onChange(async (value) => {
            this.plugin.settings.showConvertButton = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Default tags")
      .setDesc(
        "Comma-separated tags to add to new tasks (always includes 'task')",
      )
      .addText((text) =>
        text
          .setPlaceholder("task, work")
          .setValue(this.plugin.settings.defaultTags.join(", "))
          .onChange(async (value) => {
            this.plugin.settings.defaultTags = value
              .split(",")
              .map((tag) => tag.trim())
              .filter((tag) => tag.length > 0);
            if (!this.plugin.settings.defaultTags.includes("task")) {
              this.plugin.settings.defaultTags.unshift("task");
            }
            await this.plugin.saveSettings();
          }),
      );

    // Project Suggestions
    containerEl.createEl("h3", { text: "Project Suggestions" });

    // Master toggle
    new Setting(containerEl)
      .setName("Enable project suggestions")
      .setDesc("Show project picker when creating tasks from checkboxes")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.enableProjectSuggestions)
          .onChange(async (value) => {
            this.plugin.settings.enableProjectSuggestions = value;
            await this.plugin.saveSettings();
            // Refresh display to show/hide other settings
            this.display();
          });
      });

    // Only show these settings if feature is enabled
    if (this.plugin.settings.enableProjectSuggestions) {

      new Setting(containerEl)
        .setName("Projects source folder")
        .setDesc("Folder containing project files (leave empty for vault root)")
        .addText((text) => {
          text
            .setPlaceholder("e.g., Work/01-Projects")
            .setValue(this.plugin.settings.projectsSourceFolder)
            .onChange(async (value) => {
              this.plugin.settings.projectsSourceFolder = value;
              await this.plugin.saveSettings();
            });
        });

      new Setting(containerEl)
        .setName("Projects tag")
        .setDesc("Tag that identifies project files (without #)")
        .addText((text) => {
          text
            .setPlaceholder("e.g., project")
            .setValue(this.plugin.settings.projectsRequiredTag)
            .onChange(async (value) => {
              this.plugin.settings.projectsRequiredTag = value;
              await this.plugin.saveSettings();
            });
        });

      new Setting(containerEl)
        .setName("Status property name")
        .setDesc("Frontmatter property containing status value")
        .addText((text) => {
          text
            .setPlaceholder("e.g., status")
            .setValue(this.plugin.settings.projectsStatusProperty)
            .onChange(async (value) => {
              this.plugin.settings.projectsStatusProperty = value;
              await this.plugin.saveSettings();
            });
        });

      new Setting(containerEl)
        .setName("Excluded status values")
        .setDesc("Comma-separated status values to exclude from suggestions")
        .addText((text) => {
          text
            .setPlaceholder("e.g., deprioritized, completed")
            .setValue(this.plugin.settings.projectsExcludedStatuses.join(', '))
            .onChange(async (value) => {
              this.plugin.settings.projectsExcludedStatuses =
                value.split(',').map(s => s.trim()).filter(s => s.length > 0);
              await this.plugin.saveSettings();
            });
        });
    }

    // HTTP API (MCP Integration)
    containerEl.createEl("h3", { text: "HTTP API (for MCP Integration)" });

    new Setting(containerEl)
      .setName("Enable HTTP API")
      .setDesc("Enable HTTP API for external integrations (MCP server)")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableHTTPAPI)
          .onChange(async (value) => {
            this.plugin.settings.enableHTTPAPI = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("API port")
      .setDesc("Port for HTTP API server")
      .addText((text) =>
        text
          .setPlaceholder("27124")
          .setValue(String(this.plugin.settings.apiPort))
          .onChange(async (value) => {
            const port = parseInt(value);
            if (!isNaN(port) && port > 0 && port < 65536) {
              this.plugin.settings.apiPort = port;
              await this.plugin.saveSettings();
            }
          }),
      );

    new Setting(containerEl)
      .setName("API key")
      .setDesc("Authentication key for API requests")
      .addText((text) =>
        text
          .setPlaceholder("Enter API key")
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (value) => {
            this.plugin.settings.apiKey = value;
            await this.plugin.saveSettings();
          }),
      );
  }
}
