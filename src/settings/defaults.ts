import { LightweightTasksSettings } from "../types";

export const DEFAULT_SETTINGS: LightweightTasksSettings = {
	taskFolder: "Tasks",
	calendarURL: "",
	defaultTags: ["task"],
	enableNaturalLanguageDates: true,
	enableHTTPAPI: false,
	apiPort: 27124,
	apiKey: "",
	propertyNames: {
		status: "taskStatus",
		due: "due",
		completed: "completed",
		projects: "projects",
		people: "people",
		tags: "tags",
		statusDescription: "statusDescription",
	},
	projectsSourceFolder: "",
	projectsRequiredTag: "project",
	projectsStatusProperty: "status",
	projectsExcludedStatuses: ["deprioritized", "completed"],
	peopleSourceFolder: "",
	peopleRequiredTag: "person",
	peopleStatusProperty: "status",
	peopleExcludedStatuses: [],
};
