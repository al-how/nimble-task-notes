import { App, TFile, MetadataCache, Vault } from "obsidian";
import { PeopleDiscoveryService } from "../../services/PeopleDiscoveryService";
import type { LightweightTasksSettings } from "../../types";
import { DEFAULT_SETTINGS } from "../../settings/defaults";

// Helper to create mock settings with overrides
function createSettings(
	overrides: Partial<LightweightTasksSettings> = {},
): LightweightTasksSettings {
	return {
		...DEFAULT_SETTINGS,
		...overrides,
	};
}

// Helper to create mock file with metadata
function createMockFile(
	app: App,
	path: string,
	frontmatter?: Record<string, any>,
	mtime?: number,
): TFile {
	const file = new TFile(path);
	if (mtime !== undefined) {
		file.stat.mtime = mtime;
	}
	(app.vault as Vault).files.set(path, file);
	if (frontmatter) {
		(app.metadataCache as MetadataCache).setFileCache(file, { frontmatter });
	}
	return file;
}

describe("PeopleDiscoveryService", () => {
	let app: App;

	beforeEach(() => {
		app = new App();
	});

	describe("getAvailablePeople", () => {
		it("should return empty array when no files exist", () => {
			const settings = createSettings();
			const service = new PeopleDiscoveryService(app, settings);

			const result = service.getAvailablePeople();

			expect(result).toEqual([]);
		});

		it("should return people with required tag", () => {
			const settings = createSettings({ peopleRequiredTag: "person" });
			const service = new PeopleDiscoveryService(app, settings);

			createMockFile(app, "People/Alice.md", { tags: ["person"] });
			createMockFile(app, "People/Bob.md", { tags: ["person", "team"] });
			createMockFile(app, "Projects/Project A.md", { tags: ["project"] });

			const result = service.getAvailablePeople();

			expect(result).toContain("Alice");
			expect(result).toContain("Bob");
			expect(result).not.toContain("Project A");
		});

		it("should filter by source folder", () => {
			const settings = createSettings({
				peopleRequiredTag: "person",
				peopleSourceFolder: "People",
			});
			const service = new PeopleDiscoveryService(app, settings);

			createMockFile(app, "People/Alice.md", { tags: ["person"] });
			createMockFile(app, "Other/Bob.md", { tags: ["person"] });

			const result = service.getAvailablePeople();

			expect(result).toContain("Alice");
			expect(result).not.toContain("Bob");
		});

		it("should exclude people with excluded status", () => {
			const settings = createSettings({
				peopleRequiredTag: "person",
				peopleStatusProperty: "status",
				peopleExcludedStatuses: ["inactive", "archived"],
			});
			const service = new PeopleDiscoveryService(app, settings);

			createMockFile(app, "People/Alice.md", {
				tags: ["person"],
				status: "active",
			});
			createMockFile(app, "People/Bob.md", {
				tags: ["person"],
				status: "inactive",
			});
			createMockFile(app, "People/Charlie.md", {
				tags: ["person"],
				status: "archived",
			});
			createMockFile(app, "People/Dana.md", { tags: ["person"] }); // No status

			const result = service.getAvailablePeople();

			expect(result).toContain("Alice");
			expect(result).toContain("Dana");
			expect(result).not.toContain("Bob");
			expect(result).not.toContain("Charlie");
		});

		it("should sort by modification time (most recent first)", () => {
			const settings = createSettings({ peopleRequiredTag: "person" });
			const service = new PeopleDiscoveryService(app, settings);

			const now = Date.now();
			createMockFile(app, "People/Alice.md", { tags: ["person"] }, now);
			createMockFile(
				app,
				"People/Bob.md",
				{ tags: ["person"] },
				now + 1000,
			);
			createMockFile(
				app,
				"People/Charlie.md",
				{ tags: ["person"] },
				now + 2000,
			);

			const result = service.getAvailablePeople();

			expect(result[0]).toBe("Charlie");
			expect(result[1]).toBe("Bob");
			expect(result[2]).toBe("Alice");
		});

		it("should handle case-insensitive status exclusion", () => {
			const settings = createSettings({
				peopleRequiredTag: "person",
				peopleStatusProperty: "status",
				peopleExcludedStatuses: ["Inactive"],
			});
			const service = new PeopleDiscoveryService(app, settings);

			createMockFile(app, "People/Alice.md", {
				tags: ["person"],
				status: "INACTIVE",
			});
			createMockFile(app, "People/Bob.md", {
				tags: ["person"],
				status: "inactive",
			});
			createMockFile(app, "People/Charlie.md", {
				tags: ["person"],
				status: "active",
			});

			const result = service.getAvailablePeople();

			expect(result).toContain("Charlie");
			expect(result).not.toContain("Alice");
			expect(result).not.toContain("Bob");
		});

		it("should handle tags with # prefix", () => {
			const settings = createSettings({ peopleRequiredTag: "#person" });
			const service = new PeopleDiscoveryService(app, settings);

			createMockFile(app, "People/Alice.md", { tags: ["person"] });

			const result = service.getAvailablePeople();

			expect(result).toContain("Alice");
		});

		it("should return all files if no tag requirement", () => {
			const settings = createSettings({ peopleRequiredTag: "" });
			const service = new PeopleDiscoveryService(app, settings);

			createMockFile(app, "People/Alice.md", { tags: ["person"] });
			createMockFile(app, "Random/Note.md", {});

			const result = service.getAvailablePeople();

			expect(result).toContain("Alice");
			expect(result).toContain("Note");
		});

		it("should exclude files without frontmatter when tag required", () => {
			const settings = createSettings({ peopleRequiredTag: "person" });
			const service = new PeopleDiscoveryService(app, settings);

			createMockFile(app, "People/Alice.md", { tags: ["person"] });
			// File without frontmatter - just add to vault without setting cache
			const noFrontmatter = new TFile("People/NoFrontmatter.md");
			(app.vault as Vault).files.set(noFrontmatter.path, noFrontmatter);

			const result = service.getAvailablePeople();

			expect(result).toContain("Alice");
			expect(result).not.toContain("NoFrontmatter");
		});
	});
});
