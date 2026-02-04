import { App, TFile } from "obsidian";
import type { LightweightTasksSettings } from "../types";

/**
 * Service for discovering eligible people files based on configured filters
 *
 * Filters people by:
 * - Source folder path (optional)
 * - Required tag in frontmatter
 * - Excluded status values
 *
 * Returns sorted list of people names (most recently modified first)
 */
export class PeopleDiscoveryService {
	private app: App;
	private settings: LightweightTasksSettings;

	constructor(app: App, settings: LightweightTasksSettings) {
		this.app = app;
		this.settings = settings;
	}

	/**
	 * Get list of available people based on settings
	 * @returns Array of people names (sorted by modification time, most recent first)
	 */
	getAvailablePeople(): string[] {
		const allFiles = this.app.vault.getMarkdownFiles();
		const eligiblePeople: TFile[] = [];

		for (const file of allFiles) {
			if (this.isEligiblePerson(file)) {
				eligiblePeople.push(file);
			}
		}

		// Sort by modification time (most recent first)
		eligiblePeople.sort((a, b) => b.stat.mtime - a.stat.mtime);

		// Return basenames without .md extension
		return eligiblePeople.map((file) => file.basename);
	}

	/**
	 * Check if file matches people criteria
	 * @param file - File to check
	 * @returns true if file is a valid person suggestion
	 */
	private isEligiblePerson(file: TFile): boolean {
		// Check folder restriction
		if (!this.isInSourceFolder(file)) {
			return false;
		}

		// Check required tag
		if (!this.hasRequiredTag(file)) {
			return false;
		}

		// Check status exclusions
		if (!this.hasAllowedStatus(file)) {
			return false;
		}

		return true;
	}

	/**
	 * Check if file is in configured source folder
	 * @param file - File to check
	 * @returns true if in source folder (or no folder restriction)
	 */
	private isInSourceFolder(file: TFile): boolean {
		const sourceFolder = this.settings.peopleSourceFolder?.trim();

		// No folder restriction
		if (!sourceFolder) {
			return true;
		}

		// Normalize paths: forward slashes, lowercase, no leading/trailing slashes
		const filePath = file.path.replace(/\\/g, "/").toLowerCase();
		const folderPath = sourceFolder
			.replace(/\\/g, "/")
			.replace(/^\/+|\/+$/g, "") // Remove leading/trailing slashes
			.toLowerCase();

		// Check if file path starts with folder path + /
		// This ensures "People" matches "People/file.md" but not "People2/file.md"
		return filePath.startsWith(folderPath + "/");
	}

	/**
	 * Check if file has required tag
	 * @param file - File to check
	 * @returns true if has required tag
	 */
	private hasRequiredTag(file: TFile): boolean {
		const requiredTag = this.settings.peopleRequiredTag?.trim();

		// No tag requirement
		if (!requiredTag) {
			return true;
		}

		// Get frontmatter from cache
		const cache = this.app.metadataCache.getFileCache(file);
		if (!cache?.frontmatter) {
			return false;
		}

		// Check tags array in frontmatter
		const tags = cache.frontmatter.tags;
		if (!Array.isArray(tags)) {
			return false;
		}

		// Check if required tag exists (with or without # prefix)
		const normalizedRequired = requiredTag.replace(/^#/, "");
		return tags.some((tag) => {
			const normalizedTag = String(tag).replace(/^#/, "");
			return normalizedTag === normalizedRequired;
		});
	}

	/**
	 * Check if file's status is not in excluded list
	 * @param file - File to check
	 * @returns true if status is allowed
	 */
	private hasAllowedStatus(file: TFile): boolean {
		const excludedStatuses = this.settings.peopleExcludedStatuses || [];

		// No status exclusions
		if (excludedStatuses.length === 0) {
			return true;
		}

		// Get frontmatter from cache
		const cache = this.app.metadataCache.getFileCache(file);
		if (!cache?.frontmatter) {
			// No frontmatter = no status = not excluded
			return true;
		}

		const statusProperty = this.settings.peopleStatusProperty || "status";
		const fileStatus = cache.frontmatter[statusProperty];

		// No status property = not excluded
		if (fileStatus === undefined || fileStatus === null) {
			return true;
		}

		// Check if status is in excluded list (case-insensitive)
		const normalizedStatus = String(fileStatus).toLowerCase().trim();
		return !excludedStatuses.some(
			(excluded) => excluded.toLowerCase().trim() === normalizedStatus,
		);
	}
}
