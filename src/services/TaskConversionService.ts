import { Editor, Notice, TFile } from 'obsidian';
import type LightweightTasksPlugin from '../main';
import type {
	CheckboxData,
	TaskCreationData,
	TaskCreationModalResult,
} from '../types';
import { TaskCreationModal } from '../modals/TaskCreationModal';
import type { TaskService } from './TaskService';
import type { NaturalLanguageParser } from './NaturalLanguageParser';

/**
 * Service for converting checkboxes to task notes.
 * Handles extraction, modal display, task creation, and editor replacement.
 */
export class TaskConversionService {
	private taskService: TaskService;
	private nlpParser: NaturalLanguageParser;

	constructor(private plugin: LightweightTasksPlugin) {
		this.taskService = plugin.taskService;
		this.nlpParser = plugin.nlpParser;
	}

	/**
	 * Convert checkbox on current line to task note.
	 * Main entry point for conversion workflow.
	 *
	 * @param editor - Obsidian editor instance
	 * @param lineNumber - Line number to convert (0-indexed)
	 */
	async convertCheckboxToTask(
		editor: Editor,
		lineNumber?: number
	): Promise<void> {
		// Get current line if not specified
		if (lineNumber === undefined) {
			const cursor = editor.getCursor();
			lineNumber = cursor.line;
		}

		// Extract checkbox data from line
		const line = editor.getLine(lineNumber);
		const checkboxData = this.extractCheckboxData(line);

		if (!checkboxData) {
			new Notice('No checkbox found on this line');
			return;
		}

		// Check if line already has a wikilink (already converted)
		if (this.hasWikilink(checkboxData.title)) {
			new Notice('This checkbox is already linked to a task');
			return;
		}

		// Show modal to gather task metadata
		const modalResult = await this.showTaskCreationModal(checkboxData);

		// User cancelled
		if (!modalResult) {
			return;
		}

		try {
			// Create task file
			const taskFile = await this.createTaskFromModal(
				checkboxData,
				modalResult
			);

			// Replace editor line with wikilink
			this.replaceLineWithWikilink(
				editor,
				lineNumber,
				checkboxData,
				taskFile.basename
			);

			new Notice(`Task created: ${taskFile.basename}`);
		} catch (error) {
			console.error('Task conversion error:', error);
			new Notice(`Failed to create task: ${error.message}`);
		}
	}

	/**
	 * Extract checkbox data from editor line.
	 * Pattern: `- [ ] Title` or `- [x] Title` with optional indentation
	 *
	 * @param line - Editor line text
	 * @returns Checkbox data or null if not a checkbox
	 */
	private extractCheckboxData(line: string): CheckboxData | null {
		// Pattern: optional whitespace, -, space, [status], space, title
		const regex = /^(\s*)- \[([ xX])\] (.+)$/;
		const match = line.match(regex);

		if (!match) {
			return null;
		}

		const [, indent, status, title] = match;

		return {
			indent,
			status,
			title: title.trim(),
			complete: status.toLowerCase() === 'x',
		};
	}

	/**
	 * Check if text contains a wikilink
	 */
	private hasWikilink(text: string): boolean {
		return /\[\[.+\]\]/.test(text);
	}

	/**
	 * Show task creation modal and wait for user input.
	 *
	 * @param data - Checkbox data
	 * @returns Modal result or null if cancelled
	 */
	private async showTaskCreationModal(
		data: CheckboxData
	): Promise<TaskCreationModalResult | null> {
		const modal = new TaskCreationModal(this.plugin.app, this.plugin, data);
		modal.open();
		return await modal.waitForResult();
	}

	/**
	 * Create task file from modal result.
	 *
	 * @param checkboxData - Original checkbox data
	 * @param modalResult - User input from modal
	 * @returns Created task file
	 */
	private async createTaskFromModal(
		checkboxData: CheckboxData,
		modalResult: TaskCreationModalResult
	): Promise<TFile> {
		// Handle empty title
		let title = checkboxData.title.trim();
		if (!title) {
			title = 'Untitled Task';
		}

		// Format due date to YYYY-MM-DD
		let dueDate: string | null = null;
		if (modalResult.dueDate) {
			dueDate = this.nlpParser.formatDateForFrontmatter(
				modalResult.dueDate
			);
		}

		// Combine default tags with additional tags
		const defaultTags = this.plugin.settings.defaultTags || [];
		const allTags = [...defaultTags, ...modalResult.additionalTags];

		// Ensure 'task' tag is included
		if (!allTags.includes('task')) {
			allTags.unshift('task');
		}

		// Build task creation data
		const taskData: TaskCreationData = {
			title,
			complete: checkboxData.complete,
			due: dueDate,
			projects: modalResult.projects,
			tags: allTags,
			statusDescription: '',
		};

		// Create task using TaskService
		return await this.taskService.createTask(taskData);
	}

	/**
	 * Replace editor line with wikilink to task.
	 * Uses editor.transaction() for undo/redo support.
	 *
	 * @param editor - Obsidian editor
	 * @param lineNumber - Line to replace
	 * @param checkboxData - Original checkbox data
	 * @param taskTitle - Title of created task
	 */
	private replaceLineWithWikilink(
		editor: Editor,
		lineNumber: number,
		checkboxData: CheckboxData,
		taskTitle: string
	): void {
		// Build new line: indent + checkbox + wikilink
		const newLine = `${checkboxData.indent}- [${checkboxData.status}] [[${taskTitle}]]`;

		// Use transaction for undo/redo support
		editor.transaction({
			changes: [
				{
					from: { line: lineNumber, ch: 0 },
					to: { line: lineNumber, ch: editor.getLine(lineNumber).length },
					text: newLine,
				},
			],
		});
	}

	/**
	 * Convert checkbox to task from command palette or keyboard shortcut.
	 * Gets active editor and converts checkbox on current line.
	 */
	async convertCurrentCheckbox(): Promise<void> {
		const activeLeaf = this.plugin.app.workspace.activeLeaf;
		if (!activeLeaf) {
			new Notice('No active editor');
			return;
		}

		const view = activeLeaf.view;
		// @ts-ignore - MarkdownView has editor property
		const editor = view.editor;

		if (!editor) {
			new Notice('No markdown editor available');
			return;
		}

		await this.convertCheckboxToTask(editor);
	}
}
