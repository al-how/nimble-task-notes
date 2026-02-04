import { AbstractInputSuggest, App } from "obsidian";
import type LightweightTasksPlugin from "../main";
import type { PeopleDiscoveryService } from "../services/PeopleDiscoveryService";

/**
 * Inline autocomplete for people selection as user types
 *
 * Extends Obsidian's AbstractInputSuggest to provide:
 * - Inline dropdown (no separate modal)
 * - Filters as user types (case-insensitive substring match)
 * - Keyboard navigation (up/down to navigate, Enter to select, Esc to cancel)
 * - Auto-clears input after selection (ready for next person)
 */
export class PeopleInputSuggest extends AbstractInputSuggest<string> {
	private peopleDiscovery: PeopleDiscoveryService;
	private onSelectCallback: (person: string) => void;

	constructor(
		app: App,
		inputEl: HTMLInputElement,
		plugin: LightweightTasksPlugin,
		onSelectCallback: (person: string) => void,
	) {
		super(app, inputEl);
		this.peopleDiscovery =
			plugin.container.get<PeopleDiscoveryService>("peopleDiscovery");
		this.onSelectCallback = onSelectCallback;
	}

	/**
	 * Get filtered suggestions based on user input
	 * @param inputStr - Current input value
	 * @returns Filtered array of people names
	 */
	getSuggestions(inputStr: string): string[] {
		const allPeople = this.peopleDiscovery.getAvailablePeople();

		if (!inputStr || inputStr.trim() === "") {
			return allPeople; // Show all if empty
		}

		// Filter by typed characters (case-insensitive contains match)
		const lower = inputStr.toLowerCase();
		return allPeople.filter((person) =>
			person.toLowerCase().includes(lower),
		);
	}

	/**
	 * Render suggestion item in dropdown
	 * @param person - Person name to render
	 * @param el - HTML element to populate
	 */
	renderSuggestion(person: string, el: HTMLElement): void {
		el.setText(person);
	}

	/**
	 * Handle suggestion selection
	 * @param person - Selected person name
	 * @param evt - Mouse or keyboard event
	 */
	selectSuggestion(person: string, _evt: MouseEvent | KeyboardEvent): void {
		this.onSelectCallback(person);
		this.close();
	}
}
