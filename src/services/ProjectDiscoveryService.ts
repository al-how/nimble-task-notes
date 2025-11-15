import { App, TFile, Notice } from "obsidian";
import type { LightweightTasksSettings } from "../types";

/**
 * Service for discovering eligible project files based on configured filters
 *
 * Filters projects by:
 * - Source folder path (optional)
 * - Required tag in frontmatter
 * - Excluded status values
 *
 * Returns sorted list of project names (most recently modified first)
 */
export class ProjectDiscoveryService {
	private app: App;
	private settings: LightweightTasksSettings;

	constructor(app: App, settings: LightweightTasksSettings) {
		this.app = app;
		this.settings = settings;
	}

	/**
	 * Get list of available projects based on settings
	 * @returns Array of project names (sorted by modification time, most recent first)
	 */
	getAvailableProjects(): string[] {
		// If feature is disabled, return empty array
		if (!this.settings.enableProjectSuggestions) {
			return [];
		}

		const allFiles = this.app.vault.getMarkdownFiles();
		const eligibleProjects: TFile[] = [];

		for (const file of allFiles) {
			if (this.isEligibleProject(file)) {
				eligibleProjects.push(file);
			}
		}

		// Sort by modification time (most recent first)
		eligibleProjects.sort((a, b) => b.stat.mtime - a.stat.mtime);

		// Return basenames without .md extension
		return eligibleProjects.map(file => file.basename);
	}

	/**
	 * Check if file matches project criteria
	 * @param file - File to check
	 * @returns true if file is a valid project suggestion
	 */
	private isEligibleProject(file: TFile): boolean {
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
		const sourceFolder = this.settings.projectsSourceFolder?.trim();

		// No folder restriction
		if (!sourceFolder) {
			return true;
		}

		// Normalize paths for comparison
		const filePath = file.path.replace(/\\/g, '/');
		const folderPath = sourceFolder.replace(/\\/g, '/');

		// Check if file path starts with folder path
		return filePath.startsWith(folderPath + '/') || filePath.startsWith(folderPath);
	}

	/**
	 * Check if file has required tag
	 * @param file - File to check
	 * @returns true if has required tag
	 */
	private hasRequiredTag(file: TFile): boolean {
		const requiredTag = this.settings.projectsRequiredTag?.trim();

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
		const normalizedRequired = requiredTag.replace(/^#/, '');
		return tags.some(tag => {
			const normalizedTag = String(tag).replace(/^#/, '');
			return normalizedTag === normalizedRequired;
		});
	}

	/**
	 * Check if file's status is not in excluded list
	 * @param file - File to check
	 * @returns true if status is allowed
	 */
	private hasAllowedStatus(file: TFile): boolean {
		const excludedStatuses = this.settings.projectsExcludedStatuses || [];

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

		const statusProperty = this.settings.projectsStatusProperty || 'status';
		const fileStatus = cache.frontmatter[statusProperty];

		// No status property = not excluded
		if (fileStatus === undefined || fileStatus === null) {
			return true;
		}

		// Check if status is in excluded list (case-insensitive)
		const normalizedStatus = String(fileStatus).toLowerCase().trim();
		return !excludedStatuses.some(excluded =>
			excluded.toLowerCase().trim() === normalizedStatus
		);
	}
}
