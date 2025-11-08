import { App, Modal, Notice, Setting } from 'obsidian';
import type LightweightTasksPlugin from '../main';
import type { CheckboxData, TaskCreationModalResult } from '../types';
import type { NaturalLanguageParser } from '../services/NaturalLanguageParser';

/**
 * Modal for gathering task metadata during checkbox-to-task conversion.
 * Provides two input fields: due date (with natural language parsing) and projects.
 */
export class TaskCreationModal extends Modal {
	private nlpParser: NaturalLanguageParser;
	private taskData: CheckboxData;
	private result: TaskCreationModalResult | null = null;
	private resolvePromise: ((value: TaskCreationModalResult | null) => void) | null = null;

	// Form elements
	private dueDateInput: HTMLInputElement;
	private datePreview: HTMLElement;
	private projectInput: HTMLInputElement;
	private errorElement: HTMLElement;

	constructor(
		app: App,
		private plugin: LightweightTasksPlugin,
		data: CheckboxData
	) {
		super(app);
		this.taskData = data;
		this.nlpParser = plugin.nlpParser;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('lightweight-tasks-modal');

		// Modal title
		contentEl.createEl('h2', { text: 'Create Task' });

		// Task title display
		contentEl.createEl('p', {
			text: `Converting: "${this.taskData.title}"`,
			cls: 'task-title-display',
		});

		// Due date field
		this.setupDueDateField(contentEl);

		// Project field
		this.setupProjectField(contentEl);

		// Error display
		this.errorElement = contentEl.createDiv('error-message');
		this.errorElement.style.display = 'none';

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
			.setName('Due date')
			.setDesc('Natural language or YYYY-MM-DD format');

		// Create input element
		setting.addText((text) => {
			this.dueDateInput = text.inputEl;
			text.setPlaceholder('e.g., tomorrow, friday, 2025-11-15');

			// Update preview on input
			text.inputEl.addEventListener('input', async () => {
				await this.updateDatePreview();
			});

			// Handle Enter key to submit
			text.inputEl.addEventListener('keydown', (evt) => {
				if (evt.key === 'Enter') {
					evt.preventDefault();
					this.handleSubmit();
				}
			});

			return text;
		});

		// Date preview element
		this.datePreview = container.createDiv('date-preview');
		this.datePreview.style.marginLeft = '160px';
		this.datePreview.style.marginTop = '-10px';
		this.datePreview.style.marginBottom = '10px';
		this.datePreview.style.fontSize = '0.9em';
		this.datePreview.style.color = 'var(--text-muted)';
	}

	/**
	 * Set up project input field
	 */
	private setupProjectField(container: HTMLElement): void {
		new Setting(container)
			.setName('Projects')
			.setDesc('Comma-separated wikilinks (e.g., [[Project A]], [[Project B]])')
			.addText((text) => {
				this.projectInput = text.inputEl;
				text.setPlaceholder('e.g., [[Project Name]]');

				// Handle Enter key to submit
				text.inputEl.addEventListener('keydown', (evt) => {
					if (evt.key === 'Enter') {
						evt.preventDefault();
						this.handleSubmit();
					}
				});

				return text;
			});
	}

	/**
	 * Set up modal buttons (Create and Cancel)
	 */
	private setupButtons(container: HTMLElement): void {
		const buttonContainer = container.createDiv('modal-button-container');
		buttonContainer.style.display = 'flex';
		buttonContainer.style.justifyContent = 'flex-end';
		buttonContainer.style.gap = '10px';
		buttonContainer.style.marginTop = '20px';

		// Cancel button
		const cancelButton = buttonContainer.createEl('button', {
			text: 'Cancel',
		});
		cancelButton.addEventListener('click', () => {
			this.handleCancel();
		});

		// Create button
		const createButton = buttonContainer.createEl('button', {
			text: 'Create Task',
			cls: 'mod-cta',
		});
		createButton.addEventListener('click', () => {
			this.handleSubmit();
		});
	}

	/**
	 * Update date preview based on current input
	 */
	private async updateDatePreview(): Promise<void> {
		const input = this.dueDateInput.value.trim();

		if (input === '') {
			this.datePreview.textContent = '';
			return;
		}

		try {
			const preview = await this.nlpParser.formatDatePreview(input);
			this.datePreview.textContent = preview;
			this.hideError();
		} catch (error) {
			console.error('Date preview error:', error);
			this.datePreview.textContent = '';
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

		if (dueDateInput !== '') {
			dueDate = await this.nlpParser.parseDate(dueDateInput);
			if (dueDate === null) {
				this.showError(
					'Invalid date format. Use natural language (e.g., "tomorrow") or YYYY-MM-DD format.'
				);
				this.dueDateInput.focus();
				return;
			}
		}

		// Parse projects
		const projectsInput = this.projectInput.value.trim();
		const projects = this.extractProjects(projectsInput);

		// Build result
		this.result = {
			dueDate,
			projects,
			additionalTags: [],
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
	 * Extract project wikilinks from input string
	 * Handles: [[Project A]], [[Project B]] or just "Project A, Project B"
	 */
	private extractProjects(input: string): string[] {
		if (!input) {
			return [];
		}

		const projects: string[] = [];

		// Extract existing wikilinks: [[Project Name]]
		const wikilinkRegex = /\[\[([^\]]+)\]\]/g;
		let match;
		while ((match = wikilinkRegex.exec(input)) !== null) {
			projects.push(`[[${match[1]}]]`);
		}

		// If no wikilinks found, split by comma and wrap each in [[]]
		if (projects.length === 0) {
			const parts = input.split(',').map((p) => p.trim());
			for (const part of parts) {
				if (part) {
					projects.push(`[[${part}]]`);
				}
			}
		}

		return projects;
	}

	/**
	 * Show error message
	 */
	private showError(message: string): void {
		this.errorElement.textContent = message;
		this.errorElement.style.display = 'block';
		this.errorElement.style.color = 'var(--text-error)';
		this.errorElement.style.marginTop = '10px';
		this.errorElement.style.padding = '10px';
		this.errorElement.style.backgroundColor = 'var(--background-modifier-error)';
		this.errorElement.style.borderRadius = '4px';
	}

	/**
	 * Hide error message
	 */
	private hideError(): void {
		this.errorElement.style.display = 'none';
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

		// If modal was closed without submit/cancel, resolve with null
		if (this.resolvePromise) {
			this.resolvePromise(null);
			this.resolvePromise = null;
		}
	}
}
