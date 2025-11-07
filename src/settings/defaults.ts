import { LightweightTasksSettings } from "../types";

export const DEFAULT_SETTINGS: LightweightTasksSettings = {
  taskFolder: "Tasks",
  meetingFolder: "Meetings",
  calendarURL: "",
  defaultTags: ["task"],
  enableNaturalLanguageDates: true,
  showConvertButton: true,
  enableHTTPAPI: false,
  apiPort: 27124,
  apiKey: "",
};
