import { Notice } from 'obsidian';

/**
 * Service for parsing natural language date expressions.
 * Lazy-loads chrono-node library to reduce initial bundle size.
 * Falls back to strict YYYY-MM-DD parsing if chrono is unavailable.
 */
export class NaturalLanguageParser {
	private chronoPromise: Promise<typeof import('chrono-node') | null> | null = null;
	private chronoLoadFailed = false;

	/**
	 * Lazy-load chrono-node library.
	 * @returns Promise resolving to chrono-node module
	 */
	private async getChrono(): Promise<typeof import('chrono-node') | null> {
		// Return null if previous load failed
		if (this.chronoLoadFailed) {
			return null;
		}

		// Return cached promise if already loading/loaded
		if (this.chronoPromise) {
			return this.chronoPromise;
		}

		// Start loading chrono-node
		this.chronoPromise = import('chrono-node').catch((error) => {
			console.error('Failed to load chrono-node:', error);
			this.chronoLoadFailed = true;
			new Notice('Natural language date parsing unavailable');
			return null;
		});

		return this.chronoPromise;
	}

	/**
	 * Parse a natural language date expression.
	 * Examples: "friday", "tomorrow", "nov 15", "in 2 weeks"
	 *
	 * @param input - Natural language date string
	 * @returns Promise resolving to Date or null if parsing fails
	 */
	async parseDate(input: string): Promise<Date | null> {
		if (!input || input.trim() === '') {
			return null;
		}

		const trimmed = input.trim();

		// Try chrono-node first
		const chrono = await this.getChrono();
		if (chrono) {
			try {
				// Use parseDate with forwardDate option (prefer future dates)
				const result = chrono.parseDate(trimmed, new Date(), {
					forwardDate: true,
				});
				if (result) {
					return result;
				}
			} catch (error) {
				console.error('Chrono parsing error:', error);
			}
		}

		// Fallback to strict YYYY-MM-DD parsing
		return this.parseDateStrict(trimmed);
	}

	/**
	 * Parse date in strict YYYY-MM-DD format.
	 * Fallback when chrono-node is unavailable or fails.
	 *
	 * @param input - Date string in YYYY-MM-DD format
	 * @returns Date or null if invalid
	 */
	parseDateStrict(input: string): Date | null {
		// Match YYYY-MM-DD format
		const match = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
		if (!match) {
			return null;
		}

		const [, year, month, day] = match;
		const date = new Date(
			parseInt(year, 10),
			parseInt(month, 10) - 1, // Month is 0-indexed
			parseInt(day, 10)
		);

		// Validate the date is valid (e.g., not Feb 31)
		if (
			date.getFullYear() !== parseInt(year, 10) ||
			date.getMonth() !== parseInt(month, 10) - 1 ||
			date.getDate() !== parseInt(day, 10)
		) {
			return null;
		}

		return date;
	}

	/**
	 * Parse date and format as preview string.
	 * Example: "📅 Fri, Nov 8, 2025"
	 *
	 * @param input - Natural language date string
	 * @returns Promise resolving to formatted preview or empty string
	 */
	async formatDatePreview(input: string): Promise<string> {
		const date = await this.parseDate(input);
		if (!date) {
			return '';
		}

		// Format as "EEE, MMM d, yyyy" (e.g., "Fri, Nov 8, 2025")
		const options: Intl.DateTimeFormatOptions = {
			weekday: 'short',
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		};

		const formatted = date.toLocaleDateString('en-US', options);
		return `📅 ${formatted}`;
	}

	/**
	 * Format date to YYYY-MM-DD string for frontmatter.
	 *
	 * @param date - Date object
	 * @returns Date string in YYYY-MM-DD format
	 */
	formatDateForFrontmatter(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	/**
	 * Check if natural language parsing is available.
	 * @returns true if chrono-node is loaded or can be loaded
	 */
	async isNaturalLanguageAvailable(): Promise<boolean> {
		if (this.chronoLoadFailed) {
			return false;
		}
		const chrono = await this.getChrono();
		return chrono !== null;
	}
}
