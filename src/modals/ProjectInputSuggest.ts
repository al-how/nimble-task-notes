import { AbstractInputSuggest, App } from "obsidian";
import type LightweightTasksPlugin from "../main";
import type { ProjectDiscoveryService } from "../services/ProjectDiscoveryService";

/**
 * Inline autocomplete for project selection as user types
 *
 * Extends Obsidian's AbstractInputSuggest to provide:
 * - Inline dropdown (no separate modal)
 * - Filters as user types (case-insensitive substring match)
 * - Keyboard navigation (↑↓ to navigate, Enter to select, Esc to cancel)
 * - Auto-clears input after selection (ready for next project)
 */
export class ProjectInputSuggest extends AbstractInputSuggest<string> {
	private projectDiscovery: ProjectDiscoveryService;
	private onSelectCallback: (project: string) => void;

	constructor(
		app: App,
		inputEl: HTMLInputElement,
		plugin: LightweightTasksPlugin,
		onSelectCallback: (project: string) => void,
	) {
		super(app, inputEl);
		this.projectDiscovery =
			plugin.container.get<ProjectDiscoveryService>("projectDiscovery");
		this.onSelectCallback = onSelectCallback;
	}

	/**
	 * Get filtered suggestions based on user input
	 * @param inputStr - Current input value
	 * @returns Filtered array of project names
	 */
	getSuggestions(inputStr: string): string[] {
		const allProjects = this.projectDiscovery.getAvailableProjects();

		if (!inputStr || inputStr.trim() === "") {
			return allProjects; // Show all if empty
		}

		// Filter by typed characters (case-insensitive contains match)
		const lower = inputStr.toLowerCase();
		return allProjects.filter((project) =>
			project.toLowerCase().includes(lower),
		);
	}

	/**
	 * Render suggestion item in dropdown
	 * @param project - Project name to render
	 * @param el - HTML element to populate
	 */
	renderSuggestion(project: string, el: HTMLElement): void {
		el.setText(project);
	}

	/**
	 * Handle suggestion selection
	 * @param project - Selected project name
	 * @param evt - Mouse or keyboard event
	 */
	selectSuggestion(project: string, _evt: MouseEvent | KeyboardEvent): void {
		this.onSelectCallback(project);
		this.close();
	}
}
