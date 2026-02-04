import { App, Modal, Notice, Setting } from "obsidian";
import type LightweightTasksPlugin from "../main";
import type { CheckboxData, TaskCreationModalResult } from "../types";
import type { NaturalLanguageParser } from "../services/NaturalLanguageParser";
import { ProjectInputSuggest } from "./ProjectInputSuggest";
import { PeopleInputSuggest } from "./PeopleInputSuggest";

/**
 * Modal for gathering task metadata during checkbox-to-task conversion.
 * Provides two input fields: due date (with natural language parsing) and projects.
 */
export class TaskCreationModal extends Modal {
	private nlpParser: NaturalLanguageParser;
	private taskData: CheckboxData;
	private result: TaskCreationModalResult | null = null;
	private resolvePromise:
		| ((value: TaskCreationModalResult | null) => void)
		| null = null;

	// Form elements
	private dueDateInput: HTMLInputElement;
	private datePreview: HTMLElement;
	private projectInput: HTMLInputElement;
	private notesInput: HTMLTextAreaElement;
	private errorElement: HTMLElement;

	// Project chips UI
	private selectedProjects: string[] = [];
	private chipContainer: HTMLElement;
	private projectSuggest: ProjectInputSuggest | null = null;

	// People chips UI
	private selectedPeople: string[] = [];
	private peopleChipContainer: HTMLElement;
	private peopleInput: HTMLInputElement;
	private peopleSuggest: PeopleInputSuggest | null = null;

	constructor(
		app: App,
		private plugin: LightweightTasksPlugin,
		data: CheckboxData,
	) {
		super(app);
		this.taskData = data;
		// Lazy-load NLP parser from service container
		this.nlpParser = plugin.getService("nlpParser");
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("nimble-task-notes-modal");

		// Modal title
		contentEl.createEl("h2", { text: "Create Task" });

		// Task title display
		contentEl.createEl("p", {
			text: `Converting: "${this.taskData.title}"`,
			cls: "task-title-display",
		});

		// Due date field
		this.setupDueDateField(contentEl);

		// Project field
		this.setupProjectField(contentEl);

		// People field
		this.setupPeopleField(contentEl);

		// Other notes field
		this.setupNotesField(contentEl);

		// Error display
		this.errorElement = contentEl.createDiv("error-message");
		this.errorElement.style.display = "none";

		// Buttons
		this.setupButtons(contentEl);

		// Auto-focus due date field
		setTimeout(() => {
			this.dueDateInput.focus();
		}, 50);
	}

	/**
	 * Set up due date input field with live preview
	 */
	private setupDueDateField(container: HTMLElement): void {
		const setting = new Setting(container)
			.setName("Due date")
			.setDesc("Natural language or YYYY-MM-DD format");

		// Create input element
		setting.addText((text) => {
			this.dueDateInput = text.inputEl;
			text.setPlaceholder("e.g., tomorrow, friday, 2025-11-15");

			// Update preview on input
			text.inputEl.addEventListener("input", async () => {
				await this.updateDatePreview();
			});

			// Handle Enter key to submit
			text.inputEl.addEventListener("keydown", (evt) => {
				if (evt.key === "Enter") {
					evt.preventDefault();
					this.handleSubmit();
				}
			});

			return text;
		});

		// Date preview element
		this.datePreview = container.createDiv("date-preview");
		this.datePreview.style.marginLeft = "160px";
		this.datePreview.style.marginTop = "-10px";
		this.datePreview.style.marginBottom = "10px";
		this.datePreview.style.fontSize = "0.9em";
		this.datePreview.style.color = "var(--text-muted)";
	}

	/**
	 * Set up project input field
	 */
	private setupProjectField(container: HTMLElement): void {
		const setting = new Setting(container)
			.setName("Projects")
			.setDesc("Type to search and select projects");

		// Create text input with autocomplete
		setting.addText((text) => {
			this.projectInput = text.inputEl;
			text.setPlaceholder("Start typing project name...");

			// Initialize AbstractInputSuggest for project suggestions
			this.projectSuggest = new ProjectInputSuggest(
				this.app,
				text.inputEl,
				this.plugin,
				(project) => this.addProject(project),
			);

			// Handle Enter key to submit form
			text.inputEl.addEventListener("keydown", (evt) => {
				if (evt.key === "Enter") {
					evt.preventDefault();
					this.handleSubmit();
				}
			});

			return text;
		});

		// Create chip container below input
		this.chipContainer = container.createDiv("project-chips");
	}

	/**
	 * Set up other notes textarea field
	 */
	private setupNotesField(container: HTMLElement): void {
		const setting = new Setting(container)
			.setName("Other notes")
			.setDesc("Additional context for the task note body");

		// Create textarea element
		setting.addTextArea((text) => {
			this.notesInput = text.inputEl;
			text.setPlaceholder("Enter any additional notes or context...");

			// Configure textarea
			this.notesInput.rows = 4;
			this.notesInput.style.width = "100%";
			this.notesInput.style.resize = "vertical";

			// Handle Ctrl+Enter or Cmd+Enter to submit (allow Enter for new lines)
			text.inputEl.addEventListener("keydown", (evt) => {
				if (evt.key === "Enter" && (evt.ctrlKey || evt.metaKey)) {
					evt.preventDefault();
					this.handleSubmit();
				}
			});

			return text;
		});
	}

	/**
	 * Add project chip to UI and selected list
	 */
	private addProject(projectName: string): void {
		const wikilink = `[[${projectName}]]`;

		// Prevent duplicates
		if (this.selectedProjects.includes(wikilink)) {
			new Notice(`${projectName} is already added`);
			return;
		}

		this.selectedProjects.push(wikilink);
		this.renderChip(projectName, wikilink);
	}

	/**
	 * Render a chip element for a selected project
	 */
	private renderChip(displayName: string, wikilink: string): void {
		const chip = this.chipContainer.createDiv("project-chip");

		chip.createSpan({
			text: displayName,
			cls: "project-chip-text",
		});

		const removeBtn = chip.createSpan({
			text: "×",
			cls: "project-chip-remove",
		});

		removeBtn.addEventListener("click", () => {
			this.removeProject(wikilink);
			chip.remove();
		});
	}

	/**
	 * Remove project from selected list
	 */
	private removeProject(wikilink: string): void {
		const index = this.selectedProjects.indexOf(wikilink);
		if (index > -1) {
			this.selectedProjects.splice(index, 1);
		}
	}

	/**
	 * Set up people input field
	 */
	private setupPeopleField(container: HTMLElement): void {
		const setting = new Setting(container)
			.setName("People")
			.setDesc("Type to search and select people");

		// Create text input with autocomplete
		setting.addText((text) => {
			this.peopleInput = text.inputEl;
			text.setPlaceholder("Start typing person name...");

			// Initialize AbstractInputSuggest for people suggestions
			this.peopleSuggest = new PeopleInputSuggest(
				this.app,
				text.inputEl,
				this.plugin,
				(person) => this.addPerson(person),
			);

			// Handle Enter key to submit form
			text.inputEl.addEventListener("keydown", (evt) => {
				if (evt.key === "Enter") {
					evt.preventDefault();
					this.handleSubmit();
				}
			});

			return text;
		});

		// Create chip container below input
		this.peopleChipContainer = container.createDiv("people-chips");
	}

	/**
	 * Add person chip to UI and selected list
	 */
	private addPerson(personName: string): void {
		const wikilink = `[[${personName}]]`;

		// Prevent duplicates
		if (this.selectedPeople.includes(wikilink)) {
			new Notice(`${personName} is already added`);
			return;
		}

		this.selectedPeople.push(wikilink);
		this.renderPersonChip(personName, wikilink);
	}

	/**
	 * Render a chip element for a selected person
	 */
	private renderPersonChip(displayName: string, wikilink: string): void {
		const chip = this.peopleChipContainer.createDiv("project-chip");

		chip.createSpan({
			text: displayName,
			cls: "project-chip-text",
		});

		const removeBtn = chip.createSpan({
			text: "×",
			cls: "project-chip-remove",
		});

		removeBtn.addEventListener("click", () => {
			this.removePerson(wikilink);
			chip.remove();
		});
	}

	/**
	 * Remove person from selected list
	 */
	private removePerson(wikilink: string): void {
		const index = this.selectedPeople.indexOf(wikilink);
		if (index > -1) {
			this.selectedPeople.splice(index, 1);
		}
	}

	/**
	 * Set up modal buttons (Create and Cancel)
	 */
	private setupButtons(container: HTMLElement): void {
		const buttonContainer = container.createDiv("modal-button-container");
		buttonContainer.style.display = "flex";
		buttonContainer.style.justifyContent = "flex-end";
		buttonContainer.style.gap = "10px";
		buttonContainer.style.marginTop = "20px";

		// Cancel button
		const cancelButton = buttonContainer.createEl("button", {
			text: "Cancel",
		});
		cancelButton.addEventListener("click", () => {
			this.handleCancel();
		});

		// Create button
		const createButton = buttonContainer.createEl("button", {
			text: "Create Task",
			cls: "mod-cta",
		});
		createButton.addEventListener("click", () => {
			this.handleSubmit();
		});
	}

	/**
	 * Update date preview based on current input
	 */
	private async updateDatePreview(): Promise<void> {
		const input = this.dueDateInput.value.trim();

		if (input === "") {
			this.datePreview.textContent = "";
			return;
		}

		try {
			const preview = await this.nlpParser.formatDatePreview(input);
			this.datePreview.textContent = preview;
			this.hideError();
		} catch (error) {
			console.error("Date preview error:", error);
			this.datePreview.textContent = "";
		}
	}

	/**
	 * Handle form submission
	 */
	private async handleSubmit(): Promise<void> {
		this.hideError();

		// Parse due date
		const dueDateInput = this.dueDateInput.value.trim();
		let dueDate: Date | null = null;

		if (dueDateInput !== "") {
			dueDate = await this.nlpParser.parseDate(dueDateInput);
			if (dueDate === null) {
				this.showError(
					'Invalid date format. Use natural language (e.g., "tomorrow") or YYYY-MM-DD format.',
				);
				this.dueDateInput.focus();
				return;
			}
		}

		// Parse projects
		const projectsInput = this.projectInput.value.trim();
		const projects = this.extractProjects(projectsInput);

		// Get body content
		const bodyContent = this.notesInput.value.trim();

		// Build result
		this.result = {
			dueDate,
			projects,
			people: this.selectedPeople,
			additionalTags: [],
			bodyContent: bodyContent || undefined,
		};

		// Resolve promise and close
		if (this.resolvePromise) {
			this.resolvePromise(this.result);
		}
		this.close();
	}

	/**
	 * Handle cancellation
	 */
	private handleCancel(): void {
		this.result = null;
		if (this.resolvePromise) {
			this.resolvePromise(null);
		}
		this.close();
	}

	/**
	 * Extract project wikilinks from selected chips
	 * Returns selected projects from chip UI
	 */
	private extractProjects(_input?: string): string[] {
		return this.selectedProjects;
	}

	/**
	 * Show error message
	 */
	private showError(message: string): void {
		this.errorElement.textContent = message;
		this.errorElement.style.display = "block";
		this.errorElement.style.color = "var(--text-error)";
		this.errorElement.style.marginTop = "10px";
		this.errorElement.style.padding = "10px";
		this.errorElement.style.backgroundColor =
			"var(--background-modifier-error)";
		this.errorElement.style.borderRadius = "4px";
	}

	/**
	 * Hide error message
	 */
	private hideError(): void {
		this.errorElement.style.display = "none";
	}

	/**
	 * Wait for user to submit or cancel the modal
	 */
	waitForResult(): Promise<TaskCreationModalResult | null> {
		return new Promise((resolve) => {
			this.resolvePromise = resolve;
		});
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();

		// Cleanup suggest instances
		if (this.projectSuggest) {
			this.projectSuggest.close();
		}
		if (this.peopleSuggest) {
			this.peopleSuggest.close();
		}

		// If modal was closed without submit/cancel, resolve with null
		if (this.resolvePromise) {
			this.resolvePromise(null);
			this.resolvePromise = null;
		}
	}
}
