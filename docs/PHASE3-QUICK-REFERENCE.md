# Phase 3 Quick Reference Guide

Use this while implementing Phase 3 to stay aligned with architecture.

---

## ICSSubscriptionService Simplified API

### Constructor & Initialization
```typescript
class ICSSubscriptionService extends EventEmitter {
  constructor(plugin: Plugin, settings: LightweightTasksSettings)

  async initialize(): Promise<void>
  // Starts refresh timer, sets up event handlers
}
```

### Core Methods
```typescript
// Fetch calendar events (non-blocking)
async fetchSubscription(subscriptionId: string): Promise<void>
// Fetches from Outlook, updates cache, emits 'data-changed'

// Get all cached events
getAllEvents(): ICSEvent[]
// Returns cached events if valid, triggers background refresh if stale

// Listen for updates
on('data-changed', callback): this
```

### Data Types

```typescript
interface ICSEvent {
  id: string;            // Unique ID from VEVENT
  title: string;         // Event summary
  start: string;         // ISO string or YYYY-MM-DD for all-day
  end?: string;          // ISO string or YYYY-MM-DD for all-day
  allDay: boolean;       // True if DTSTART has no time component
  description?: string;
  location?: string;
}

interface ICSCache {
  subscriptionId: string;
  events: ICSEvent[];
  lastUpdated: string;   // ISO timestamp
  expires: string;       // lastUpdated + refreshInterval
}
```

### Constants
```typescript
// Cache grace period: return stale data for 5 minutes after expiry
const CACHE_GRACE_PERIOD = 5 * 60 * 1000;

// Recurring event limits
const MAX_RECURRING_INSTANCES = 100;
const MAX_RECURRING_LOOKAHEAD_DAYS = 365;
```

---

## CalendarImportService Architecture

### Constructor
```typescript
class CalendarImportService {
  constructor(
    private plugin: Plugin,
    private icsService: ICSSubscriptionService,
    private settings: LightweightTasksSettings
  )
}
```

### Main Entry Point
```typescript
async importTodaysMeetings(activeNote: TFile): Promise<number>
// Returns number of meetings imported
// Side effects:
//   - Modifies activeNote file (adds wikilinks)
//   - Emits notices (success or error)
//   - Updates settings.lastCalendarError on failure
```

### Core Helper Methods

```typescript
// Find "#### 📆 Agenda" heading position
private findAgendaHeading(content: string): number | null
// Returns index of heading in content, or null if not found

// Sanitize meeting title to safe filename
private sanitizeMeetingTitle(title: string): string
// Returns safe wikilink-compatible title

// Extract existing wikilinks under heading
private extractWikilinksUnderHeading(
  content: string,
  headingIndex: number
): string[]
// Returns array of existing wikilink titles to avoid duplicates

// Insert wikilinks at heading location
private insertWikilinksAtHeading(
  content: string,
  headingIndex: number,
  wikilinks: string[]
): string
// Returns modified content with wikilinks inserted
```

---

## Sanitization Rules (Must Match Exactly)

```typescript
function sanitizeMeetingTitle(title: string): string {
  return title
    .trim()                                          // Remove leading/trailing space
    .replace(/[\[\]#^\|]/g, '-')                    // Obsidian syntax → dash
    .replace(/[*"\\/<>:?]/g, '-')                   // Filesystem forbidden → dash
    .replace(/\s+/g, ' ')                           // Multiple spaces → single space
    .replace(/^\.+|\.+$/g, '')                      // Remove leading/trailing dots
    .replace(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, '$1_')  // Windows reserved
    .slice(0, 200)                                  // Max 200 chars
    || 'Untitled Meeting';                          // Fallback if empty
}
```

---

## Settings Required

Add to `LightweightTasksSettings` interface:

```typescript
interface LightweightTasksSettings {
  // ... existing settings ...

  /** Outlook calendar ICS feed URL */
  calendarURL: string;

  /** Calendar refresh interval in minutes */
  calendarRefreshInterval: number;

  /** Last error message (for UI) */
  lastCalendarError?: string;
}
```

Add to settings defaults:

```typescript
export const DEFAULT_SETTINGS: LightweightTasksSettings = {
  // ... existing defaults ...
  calendarURL: "",
  calendarRefreshInterval: 15,
  lastCalendarError: undefined
};
```

---

## Settings UI Components

Add to `SettingTab.ts` display method:

```typescript
// Calendar URL input with test button
new Setting(containerEl)
  .setName("Outlook Calendar URL")
  .setDesc("ICS feed URL from Outlook Calendar settings")
  .addText(text => text
    .setPlaceholder("https://outlook.office365.com/...")
    .setValue(this.plugin.settings.calendarURL)
    .onChange(async (value) => {
      this.plugin.settings.calendarURL = value.trim();
      await this.plugin.saveSettings();
    })
  )
  .addButton(button => button
    .setButtonText("Test")
    .onClick(async () => {
      try {
        await this.plugin.calendarImportService.testConnection();
        new Notice("✅ Calendar connection successful");
      } catch (error) {
        new Notice(`❌ Connection failed: ${error.message}`);
      }
    })
  );

// Refresh interval slider
new Setting(containerEl)
  .setName("Calendar Refresh Interval")
  .setDesc("How often to check for new meetings (5-1440 minutes)")
  .addSlider(slider => slider
    .setMin(5)
    .setMax(1440)
    .setStep(5)
    .setValue(this.plugin.settings.calendarRefreshInterval)
    .setDynamicTooltip()
    .onChange(async (value) => {
      this.plugin.settings.calendarRefreshInterval = value;
      await this.plugin.saveSettings();
    })
  );
```

---

## Ribbon Button & Command Registration

Add to `main.ts` in `onload()`:

```typescript
// Ribbon button
this.addRibbonIcon("calendar", "Import Meetings", async () => {
  const activeFile = this.app.workspace.getActiveFile();
  if (!activeFile) {
    new Notice("No active note");
    return;
  }

  try {
    const count = await this.calendarImportService.importTodaysMeetings(activeFile);
    if (count > 0) {
      new Notice(`✅ Imported ${count} meeting${count !== 1 ? 's' : ''}`);
    }
  } catch (error) {
    console.error("Calendar import error:", error);
    new Notice(`❌ Import failed: ${error.message}`);
  }
});

// Command palette command
this.addCommand({
  id: "import-todays-meetings",
  name: "Import today's meetings",
  callback: async () => {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) {
      new Notice("No active note");
      return;
    }

    try {
      const count = await this.calendarImportService.importTodaysMeetings(activeFile);
      if (count > 0) {
        new Notice(`✅ Imported ${count} meeting${count !== 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error("Calendar import error:", error);
      new Notice(`❌ Import failed: ${error.message}`);
    }
  }
});
```

---

## Error Handling Pattern

Use this pattern consistently:

```typescript
try {
  // Attempt operation
  const result = await risky();
} catch (error) {
  // Log with context
  console.error("Context of operation:", {
    error,
    relatedData: someData,
    timestamp: new Date().toISOString()
  });

  // Show user-friendly notice
  if (error.message.includes("ENOTFOUND")) {
    new Notice("Network error: Check internet connection");
  } else if (error.message.includes("401")) {
    new Notice("Calendar access denied: Check Outlook URL");
  } else {
    new Notice(`Operation failed: ${error.message}`);
  }

  // Re-throw or handle based on context
  throw error;
}
```

---

## Deduplication Algorithm

```typescript
// 1. Extract existing wikilinks from note
const existingLinks = extractWikilinksUnderHeading(content, headingIndex);
// Returns: ["Weekly Standup", "Q4 Planning"]

// 2. Sanitize incoming titles
const incomingTitles = todayEvents.map(e =>
  sanitizeMeetingTitle(e.title)
);
// Returns: ["Weekly Standup", "Client - Q4 Planning", "New Meeting"]

// 3. Filter new ones
const newTitles = incomingTitles.filter(title =>
  !existingLinks.includes(title)
);
// Returns: ["Client - Q4 Planning", "New Meeting"]

// 4. Build wikilinks
const wikilinks = newTitles.map(title =>
  `- [[${title}]]`
);

// 5. Insert at heading
const newContent = insertWikilinksAtHeading(content, headingIndex, wikilinks);
```

---

## Wikilink Insertion Format

**Location:** Under `#### 📆 Agenda` heading

**Format:**
```markdown
#### 📆 Agenda
- [[Meeting Title 1]]
- [[Meeting Title 2]]
- [[Meeting Title 3]]
```

**Sorting:** Chronological by event start time

**Indentation:** Single dash + space (no nested lists)

---

## Testing Checklist

### Manual Testing (Phase 3)
- [ ] Import single meeting
- [ ] Import multiple meetings
- [ ] Run import twice (check no duplicates)
- [ ] Special characters in titles
- [ ] All-day events
- [ ] Recurring meetings
- [ ] Missing heading error
- [ ] Network error handling
- [ ] Invalid URL handling
- [ ] Empty calendar (no meetings)

### Automated Testing (Phase 7)
- [ ] `sanitizeMeetingTitle()` unit tests
- [ ] `findAgendaHeading()` unit tests
- [ ] Deduplication logic unit tests
- [ ] Integration test with mock ICS
- [ ] Error handling integration tests

---

## File References

### Source Files to Reference
- **TaskNotes ICS Service:** `C:\Users\Alex\Documents\Projects\Obsidian-Plugins\tasknotes-fork\src\services\ICSSubscriptionService.ts`

### Documentation Files
- **Full Architecture:** [Phase3-PreWork.md](Phase3-PreWork.md)
- **Requirements:** [PRD-Lightweight-Task-Plugin.md](PRD-Lightweight-Task-Plugin.md#phase-3-calendar-integration-week-2) (lines 1796-1823)
- **Project Context:** [../CLAUDE.md](../CLAUDE.md)

---

## Code Size Budget Check

**Phase 3 Target:** ~700 lines total

- ICSSubscriptionService: ~400 lines ✅
- CalendarImportService: ~300 lines ✅
- **Total:** ~700 lines ✅

**Running Total:**
- Phase 1: ~284 lines
- Phase 2: ~815 lines
- Phase 3: ~700 lines
- **Current:** ~1,799 lines
- **Remaining for Phases 4-7:** ~2,701 lines (target: 4,500 total)

