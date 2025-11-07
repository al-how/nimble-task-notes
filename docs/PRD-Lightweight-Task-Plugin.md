- [Product Requirements Document: Lightweight Task Management Plugin](#product-requirements-document-lightweight-task-management-plugin)
  - [Executive Summary](#executive-summary)
    - [Key Differentiators from TaskNotes](#key-differentiators-from-tasknotes)
  - [Goals and Non-Goals](#goals-and-non-goals)
    - [✅ Goals](#-goals)
    - [❌ Non-Goals](#-non-goals)
  - [User Stories](#user-stories)
    - [Story 1: Morning Meeting Prep (Priority #1)](#story-1-morning-meeting-prep-priority-1)
    - [Story 2: Inline Task Capture (Priority #2)](#story-2-inline-task-capture-priority-2)
    - [Story 3: Project Association (Priority #3)](#story-3-project-association-priority-3)
    - [Story 4: LLM Task Management (Priority #4)](#story-4-llm-task-management-priority-4)
    - [Story 5: Bases Integration (Implicit Priority)](#story-5-bases-integration-implicit-priority)
  - [Detailed Requirements](#detailed-requirements)
    - [1. Calendar Integration](#1-calendar-integration)
      - [1.1 Settings](#11-settings)
      - [1.2 Import Behavior](#12-import-behavior)
      - [1.3 ICS Parsing](#13-ics-parsing)
      - [1.4 Edge Cases](#14-edge-cases)
    - [2. Inline Task Conversion](#2-inline-task-conversion)
      - [2.1 Auto-Prompt Trigger](#21-auto-prompt-trigger)
      - [2.2 Prompt Modal Architecture](#22-prompt-modal-architecture)
      - [2.3 Conversion Behavior](#23-conversion-behavior)
      - [2.4 Interactive Task Widgets (Ported from TaskNotes)](#24-interactive-task-widgets-ported-from-tasknotes)
      - [2.5 Checkbox Sync Strategy (Simplified)](#25-checkbox-sync-strategy-simplified)
      - [2.6 Frontmatter Schema](#26-frontmatter-schema)
      - [2.7 Improved Filename Sanitization](#27-improved-filename-sanitization)
      - [2.8 Settings Configuration](#28-settings-configuration)
      - [2.9 Edge Cases](#29-edge-cases)
    - [3. Task Properties Model](#3-task-properties-model)
      - [3.1 Core Properties](#31-core-properties)
      - [3.2 Tag-Based Identification](#32-tag-based-identification)
      - [3.3 Property Validation](#33-property-validation)
      - [3.4 Excluded Properties (from TaskNotes)](#34-excluded-properties-from-tasknotes)
    - [4. Bases Integration (Vanilla Bases Only)](#4-bases-integration-vanilla-bases-only)
      - [4.1 Philosophy](#41-philosophy)
      - [4.2 Integration Scope](#42-integration-scope)
      - [4.3 Property Mapping](#43-property-mapping)
      - [4.4 Bidirectional Updates](#44-bidirectional-updates)
      - [4.5 Graceful Degradation](#45-graceful-degradation)
    - [5. MCP Server (Separate Project)](#5-mcp-server-separate-project)
      - [5.1 Architecture Decision: HTTP API-Based](#51-architecture-decision-http-api-based)
      - [5.2 MCP Tools](#52-mcp-tools)
        - [5.2.1 `list_tasks`](#521-list_tasks)
        - [5.2.2 `create_task`](#522-create_task)
        - [5.2.3 `update_task`](#523-update_task)
        - [5.2.4 `read_task`](#524-read_task)
        - [5.2.5 `delete_task`](#525-delete_task)
        - [5.2.6 `bulk_operations`](#526-bulk_operations)
      - [5.3 Plugin HTTP API Requirements](#53-plugin-http-api-requirements)
      - [5.4 Configuration File (`mcp-config.json`)](#54-configuration-file-mcp-configjson)
  - [Technical Architecture](#technical-architecture)
    - [Component Diagram](#component-diagram)
    - [Data Flow](#data-flow)
      - [Calendar Import Flow](#calendar-import-flow)
      - [Task Conversion Flow](#task-conversion-flow)
      - [MCP Task Creation Flow](#mcp-task-creation-flow)
  - [Component Specifications](#component-specifications)
    - [1. TaskManager (JIT Data Access)](#1-taskmanager-jit-data-access)
    - [2. TaskService (CRUD Operations)](#2-taskservice-crud-operations)
    - [3. CalendarImportService](#3-calendarimportservice)
    - [4. CheckboxPromptWidget (NEW Component)](#4-checkboxpromptwidget-new-component)
    - [5. CheckboxPromptService (NEW Service)](#5-checkboxpromptservice-new-service)
    - [6. NaturalLanguageParser (Ported from TaskNotes)](#6-naturallanguageparser-ported-from-tasknotes)
    - [6. BasesDataAdapter](#6-basesdataadapter)
    - [7. PropertyMappingService](#7-propertymappingservice)
    - [8. Dependency Injection Pattern](#8-dependency-injection-pattern)
    - [9. Event System Schema](#9-event-system-schema)
    - [10. Error Handling Strategy](#10-error-handling-strategy)
    - [11. Lazy Loading for Dependencies](#11-lazy-loading-for-dependencies)
    - [12. Keyboard Shortcuts](#12-keyboard-shortcuts)
  - [Implementation Phases](#implementation-phases)
    - [Phase 1: Project Setup (Week 1, Days 1-2)](#phase-1-project-setup-week-1-days-1-2)
    - [Phase 2: Core Infrastructure (Week 1, Days 3-5)](#phase-2-core-infrastructure-week-1-days-3-5)
    - [Phase 3: Calendar Integration (Week 2)](#phase-3-calendar-integration-week-2)
    - [Phase 4: Auto-Prompt Task Creation (Week 3)](#phase-4-auto-prompt-task-creation-week-3)
    - [Phase 5: Bases Integration (Week 4, Days 1-3)](#phase-5-bases-integration-week-4-days-1-3)
    - [Phase 6: MCP Server (Week 4, Days 4-5 + Week 5)](#phase-6-mcp-server-week-4-days-4-5--week-5)
    - [Phase 7: Testing \& Polish (Week 6)](#phase-7-testing--polish-week-6)
  - [Success Metrics](#success-metrics)
    - [User Experience Metrics](#user-experience-metrics)
    - [Code Quality Metrics](#code-quality-metrics)
    - [Functionality Metrics](#functionality-metrics)
  - [Risk Mitigation](#risk-mitigation)
    - [Risk 1: ICS Feed Compatibility](#risk-1-ics-feed-compatibility)
    - [Risk 2: Bases API Changes](#risk-2-bases-api-changes)
    - [Risk 3: MCP Server Vault Conflicts](#risk-3-mcp-server-vault-conflicts)
    - [Risk 4: Performance with Large Vaults](#risk-4-performance-with-large-vaults)
  - [Appendix A: File Structure](#appendix-a-file-structure)
  - [Appendix B: Example Task Note](#appendix-b-example-task-note)
  - [Appendix C: Example Daily Note with Imported Meetings](#appendix-c-example-daily-note-with-imported-meetings)
  - [Appendix D: MCP Server Configuration](#appendix-d-mcp-server-configuration)
  - [Appendix E: Forbidden Character Mapping Table](#appendix-e-forbidden-character-mapping-table)
  - [Version History](#version-history)
# Product Requirements Document: Lightweight Task Management Plugin

**Version:** 1.0
**Date:** 2025-11-06
**Status:** Approved
**Author:** Alex

---

## Executive Summary

Create a focused Obsidian plugin for task management that eliminates the bloat of TaskNotes while preserving its best features. The plugin will prioritize calendar integration for meeting note creation, seamless inline task conversion, and robust integration with the Bases plugin and LLM access via MCP.

### Key Differentiators from TaskNotes
- **80% smaller codebase** (~4,500 vs ~20,000 lines)
- **Calendar-first workflow** - streamlined meeting note creation from Outlook
- **Bases-native views** - no custom view implementations needed
- **LLM-ready** - dedicated MCP server for AI task management
- **Simplified UX** - inline task checkboxes remain visible after conversion

---

## Goals and Non-Goals

### ✅ Goals
1. **Fast calendar import** - One-click import of today's meetings from Outlook ICS feed
2. **Frictionless task creation** - Convert any checkbox to task note without leaving context
3. **Project-centric organization** - Wikilink-based project associations with backlinks
4. **Flexible viewing** - Leverage Bases plugin for all filtering/grouping/kanban needs
5. **AI integration** - Expose tasks to LLMs via MCP server
6. **Work/life separation** - Tag-based filtering (work vs personal tasks)
7. **Minimal maintenance** - Simple property model, no time tracking complexity

### ❌ Non-Goals
1. **Not building** custom calendar views (Outlook is sufficient)
2. **Not building** time tracking, Pomodoro, or productivity features
3. **Not building** advanced filtering UI (Bases handles this)
4. **Not building** custom kanban/list views (Bases handles this)
5. **Not building** recurring task complexity (future consideration)
6. **Not supporting** custom property name mapping (fixed schema)

---

## User Stories

### Story 1: Morning Meeting Prep (Priority #1)
**As a** busy professional
**I want to** click a button in my daily note to import today's meetings
**So that** I can quickly create meeting notes with one click per meeting

**Acceptance Criteria:**
- [ ] Ribbon button labeled "Import Meetings" is visible
- [ ] Button reads Outlook calendar URL from settings
- [ ] Meetings for today are inserted as wikilinks under `#### 📆 Agenda` heading
- [ ] Meeting names with forbidden characters are sanitized
- [ ] Clicking a wikilink creates empty note (Templater runs on open)
- [ ] Import is idempotent (running twice doesn't duplicate)

**Example:**
```markdown
#### 📆 Agenda
- [[Weekly Standup]]
- [[Client Alpha - Q4 Planning]]
- [[1-1 with Sarah]]
```

---

### Story 2: Inline Task Capture (Priority #2)
**As a** note-taker in a meeting
**I want to** type a checkbox and get prompted for task metadata automatically
**So that** I can capture tasks with due dates without breaking my flow

**Acceptance Criteria:**
- [ ] Type `- [ ] Task title` + Space → auto-prompt appears
- [ ] Prompt shows fields: Due date (natural language), Project (wikilink autocomplete)
- [ ] Tab navigates between fields, Enter submits, Esc cancels
- [ ] Natural language parsing: "friday", "tomorrow", "nov 15", "2 weeks"
- [ ] Original line becomes `- [ ] [[Task title]]`
- [ ] Task note created with metadata (due, projects, tags)
- [ ] Checkbox status syncs with task completion
- [ ] Empty due date is allowed (skip field)

**Flow Example:**
```markdown
## Meeting Notes

You type: "- [ ] Follow up with Sarah "
          (space after "Sarah" triggers prompt)

Prompt appears below line:
┌─────────────────────────────┐
│ 📅 Due: [friday_______] ↵   │
│ 📁 Project: [_________]     │
│ ⚡ Create Task          Esc  │
└─────────────────────────────┘

You type: "friday" + Enter
You type: "[[Client Alpha]]" + Enter
  (or just Enter to skip project)

Result:
## Meeting Notes
- [ ] [[Follow up with Sarah]]
```

**Task Note (`Follow up with Sarah.md`):**
```yaml
---
complete: false
due: 2025-11-08
projects: ["[[Client Alpha]]"]
tags: [task]
statusDescription: ""
---
```

**Alternative: Quick Skip**
- Press Esc on prompt → keeps plain checkbox `- [ ] Follow up with Sarah` (no task note)
- Right-click plain checkbox later → "Convert to Task" → same prompt appears

---

### Story 3: Project Association (Priority #3)
**As a** project manager
**I want to** associate tasks with multiple projects via wikilinks
**So that** I can see all project tasks via backlinks

**Acceptance Criteria:**
- [ ] Task notes have `projects` frontmatter (array of wikilinks)
- [ ] Project notes show backlinks to associated tasks
- [ ] Bases views can filter/group by project
- [ ] Empty array `[]` is valid (tasks without projects)

**Example Task:**
```yaml
---
complete: false
due: 2025-11-15
projects: ["[[Website Redesign]]", "[[Client Alpha]]"]
tags: [task, work]
statusDescription: "waiting for design approval"
---
```

**Project Note (`Website Redesign.md`):**
- Backlinks panel shows all tasks with this project
- Bases view filters to `projects contains [[Website Redesign]]`

---

### Story 4: LLM Task Management (Priority #4)
**As a** power user
**I want to** ask Claude "what are my work tasks due this week?"
**So that** I can interact with tasks via natural language

**Acceptance Criteria:**
- [ ] MCP server runs separately from plugin
- [ ] `list_tasks` tool with filters: tags, due date, completion status
- [ ] `create_task` tool with title, due, projects, tags
- [ ] `update_task` tool for status, due date, description changes
- [ ] `delete_task` tool with confirmation
- [ ] `bulk_operations` tool for batch updates (e.g., complete all overdue tasks)

**Example MCP Interactions:**
```
User: "Show me my work tasks due this week"
MCP: list_tasks(tags=["work"], due_before="2025-11-13")

User: "Create task: Follow up with Sarah, due Friday, project Client Alpha"
MCP: create_task(title="Follow up with Sarah", due="2025-11-08", projects=["Client Alpha"], tags=["work"])

User: "Mark all tasks from last week as complete"
MCP: bulk_operations(action="complete", filter={due_before: "2025-11-01"})
```

---

### Story 5: Bases Integration (Implicit Priority)
**As a** visual thinker
**I want to** view tasks in Bases kanban/list/filter views
**So that** I can organize tasks without custom plugin views

**Acceptance Criteria:**
- [ ] Plugin registers as Bases data source
- [ ] PropertyMappingService maps task properties to Bases fields
- [ ] Bases views can filter by: completion status, tags, projects, due date
- [ ] Bases views can group by: projects, tags, due date
- [ ] Drag-and-drop in Bases kanban updates task properties
- [ ] All task properties are editable in Bases

---

## Detailed Requirements

### 1. Calendar Integration

#### 1.1 Settings
- **Outlook Calendar URL**: Text input for ICS feed URL
  - Validation: Must be valid URL or file path
  - Tooltip: "Get this from Outlook → Calendar → Publish → ICS link"
- **Meeting Folder**: Folder path for meeting notes (default: "Meetings")
- **Task Folder**: Folder path for task notes (default: "Tasks")

#### 1.2 Import Behavior
- **Trigger**: Ribbon button or command palette "Import Today's Meetings"
- **Date Range**: Events from 00:00 to 23:59 today (local timezone)
- **Heading Detection**: Find `#### 📆 Agenda` in active note
  - If not found, show error: "No '#### 📆 Agenda' heading found in current note"
- **Wikilink Format**: `- [[{sanitized_event_title}]]`
- **Sanitization Rules**: Replace forbidden characters with alternatives
  - `[]#^|` → `-` (dash)
  - `*` → `-` (dash)
  - `"` → `'` (single quote)
  - `\/` → `-` (dash)
  - `<>` → `()` (parentheses)
  - `:` → `-` (dash)
  - `?` → `` (remove)
- **Deduplication**: Don't insert duplicate wikilinks (check existing lines under heading)
- **Sorting**: Insert in chronological order (earliest meeting first)

#### 1.3 ICS Parsing
- Use `ical.js` library (already in TaskNotes dependencies)
- Parse `VEVENT` components
- Extract: `SUMMARY` (title), `DTSTART` (start time)
- Handle all-day events (no time component)
- Handle recurring events (show each instance for today)
- Cache ICS data for 15 minutes (avoid repeated network calls)

#### 1.4 Edge Cases
- **No meetings today**: Show notice "No meetings found for today"
- **Network error**: Show error with retry option
- **Invalid ICS format**: Show error "Unable to parse calendar feed"
- **No agenda heading**: Prompt to create heading or cancel

---

### 2. Inline Task Conversion

#### 2.1 Auto-Prompt Trigger
- **Trigger**: Keyboard shortcut or convert button (not auto-space)
  - **Primary**: Ctrl+Enter (Cmd+Enter on Mac) on checkbox line
  - **Secondary**: Right-click checkbox → "Convert to Task"
  - **Tertiary**: Convert button widget at end of checkbox line (ported from TaskNotes)
  - **Discoverability**: Tooltip on first checkbox shows "Ctrl+Enter to create task"
  - Works with checked boxes too: `- [x] {title}` → preserves checked state

#### 2.2 Prompt Modal Architecture
**Why Modal instead of inline widget:**
- CodeMirror 6 widgets cannot contain focusable inputs without complex workarounds
- Modals provide proper focus management and keyboard navigation
- Better for accessibility (ARIA roles, screen readers)
- Avoids editor focus conflicts

**Modal Design (using Obsidian's Modal class):**
```typescript
class TaskCreationModal extends Modal {
  // Two input fields + submit/cancel buttons
  // Proper tab order and keyboard handling built-in
  // Escape to close handled automatically
}
```

**Fields:**
1. **Due Date** (auto-focused)
   - Natural language input: "friday", "tomorrow", "nov 15", "in 2 weeks"
   - Uses chrono-node for parsing (lazy loaded)
   - Shows parsed date preview: "friday" → "📅 Fri, Nov 8, 2025"
   - Empty = no due date (skip with Enter)
   - Optional: Native date picker input as fallback

2. **Project** (Tab to reach)
   - Uses Obsidian's SuggestModal for autocomplete
   - Shows list of existing notes (filtered by folder or tag if desired)
   - Multiple projects: comma-separated `[[Proj1]], [[Proj2]]`
   - Empty = no project assignment

**Keyboard Navigation:**
- Tab → Next field
- Shift+Tab → Previous field
- Enter → Submit from any field (create task)
- Esc → Cancel (keep plain checkbox, modal closes)
- SuggestModal handles ↑↓ for project selection

#### 2.3 Conversion Behavior
**Line Replacement (with Editor Transaction for Undo Support):**
- Before: `- [ ] Follow up with Sarah `
- After: `- [ ] [[Follow up with Sarah]]`
- **Preserve checkbox status**: `[x]` → `- [x] [[{title}]]`
- Use `editor.transaction()` API to enable undo/redo

**File Creation:**
- Path: `{taskFolder}/{sanitized_title}.md`
- Handle duplicates: `Task.md`, `Task 1.md`, `Task 2.md`
- Sanitize filename (improved rules - see section 2.7)
- Create with frontmatter based on prompt inputs

**Metadata Extraction:**
- Due date: Parsed from natural language input (chrono-node)
- Projects: Extracted wikilinks from project field
- Tags: Default `[task]` + any additional from settings
- Complete: Based on checkbox status (`[x]` = true)

#### 2.4 Interactive Task Widgets (Ported from TaskNotes)
**Purpose:** Task wikilinks in parent notes show interactive status indicators

**Behavior:**
- In **Live Preview mode**: Wikilinks like `[[Task Name]]` are replaced with interactive widgets
- Widget displays:
  - **Status dot** (clickable, cycles through statuses: todo → in progress → done)
  - **Task title** (clickable, opens task note)
  - **Due date** (if set, with icon)
  - **Priority dot** (if set, colored indicator)
- Clicking status dot updates task frontmatter instantly
- Checkbox state `[ ]` or `[x]` is NOT synced bidirectionally (see section 2.5)

**Implementation:**
- Port TaskLinkOverlay and TaskLinkWidget from TaskNotes
- Use CodeMirror 6 ViewPlugin for decoration rendering
- Widget is read-only display, not editable input (no focus issues)
- Click handlers update task via TaskService

**Reading Mode:**
- Port ReadingModeTaskLinkProcessor from TaskNotes
- Similar widget rendering in reading view
- Consistent behavior across editing modes

#### 2.5 Checkbox Sync Strategy (Simplified)
**Decision:** Checkboxes do NOT bidirectionally sync with task completion

**Rationale:**
- Checkbox sync creates race conditions (multiple checkboxes pointing to same task)
- Requires file watching and markdown parsing of all notes (expensive)
- Not worth complexity for 80% smaller plugin goal

**User Workflow:**
1. User types `- [ ] Task name` in any note
2. User converts to task (Ctrl+Enter or convert button)
3. Checkbox becomes `- [ ] [[Task name]]` with interactive widget
4. User clicks **status dot on widget** to mark complete (not checkbox itself)
5. Checkbox syntax stays `[ ]` but widget shows completed status visually

**Checkbox Status Preservation:**
- Initial checkbox state `[x]` is captured during conversion
- Sets `complete: true` in frontmatter at creation time
- After that, checkbox is decorative - widget shows real status

**Settings Option:**
- ❌ No "sync checkbox" setting (feature removed for simplicity)
- ✅ Interactive widgets are always enabled in Live Preview

#### 2.6 Frontmatter Schema
```yaml
---
complete: false          # Boolean (from checkbox status)
due: 2025-11-08         # YYYY-MM-DD or empty (from NLP parsing)
projects: ["[[Client Alpha]]"]  # Array of wikilinks
tags: [task]             # Always includes 'task' tag
statusDescription: ""    # Empty by default
---
```

#### 2.7 Improved Filename Sanitization
**Purpose:** Prevent filesystem issues and handle edge cases

**Sanitization Function:**
```typescript
function sanitizeFilename(title: string): string {
  return title
    .trim()
    // Replace forbidden characters with alternatives
    .replace(/[[\]#^|]/g, '-')           // Obsidian syntax conflicts
    .replace(/[*"\\/<>:?]/g, '-')        // Filesystem forbidden chars
    .replace(/\s+/g, ' ')                 // Collapse multiple spaces
    .replace(/^\.+|\.+$/g, '')           // Remove leading/trailing dots
    .replace(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, '$1_')  // Windows reserved names
    .slice(0, 200)                        // Prevent path length issues (Windows 260 char limit)
    || 'Untitled Task';                  // Fallback for empty strings
}
```

**Handled Edge Cases:**
- Leading/trailing whitespace
- Multiple consecutive spaces
- Windows reserved names (CON, PRN, AUX, NUL, COM1-9, LPT1-9)
- Maximum path length (Windows 260 character limit)
- Empty strings after sanitization
- Unicode characters (preserved, modern filesystems handle them)

#### 2.8 Settings Configuration
```yaml
Task Creation:
  ✓ Convert button at end of checkbox lines (toggle)
  ✓ Keyboard shortcut: Ctrl+Enter (customizable)
  ✓ Natural language date parsing (toggle, lazy loads chrono-node)
  ✓ Default tags: [task] (comma-separated, always includes 'task')
  ✓ Task folder: Tasks/
  ✓ Show tooltip on first checkbox (discoverability)

Task Widgets:
  ✓ Interactive status dots (always enabled in Live Preview)
  ✓ Show due dates in widgets (toggle)
  ✓ Show priority indicators (toggle)
  ✓ Widget click behavior: cycle status or open note (choice)
```

#### 2.9 Edge Cases
- **Empty title**: Use "Untitled Task" as fallback
- **File already exists**: Open existing file + show notice "Task already exists"
- **Checkbox already has wikilink**: No prompt (already a task)
- **Invalid date input**: Show error in modal "Could not parse date", keep modal open
- **Cancel (Esc)**: Keep plain checkbox `- [ ] Follow up with Sarah` (no conversion)
- **Retroactive conversion**: Right-click plain checkbox → "Convert to Task" → shows modal
- **Network error loading chrono**: Fallback to native date picker, show notice
- **Duplicate filename after sanitization**: Append counter (Task 1, Task 2, etc.)

---

### 3. Task Properties Model

#### 3.1 Core Properties
| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `complete` | boolean | Yes | `false` | Task completion status |
| `due` | date (YYYY-MM-DD) | No | `null` | Due date |
| `projects` | array of wikilinks | No | `[]` | Associated project notes |
| `tags` | array of strings | Yes | `[task]` | Obsidian tags (always includes `task`) |
| `statusDescription` | string | No | `""` | Free-text status note |

#### 3.2 Tag-Based Identification
- **Task Detection**: File must have `#task` tag in frontmatter `tags` array
- **Context Separation**: Use additional tags for filtering
  - `tags: [task, work]` → work tasks
  - `tags: [task, personal]` → personal tasks
  - `tags: [task]` → untagged tasks

#### 3.3 Property Validation
- `complete`: Must be boolean (`true` or `false`)
- `due`: Must match `YYYY-MM-DD` format or be empty
- `projects`: Must be array of strings in wikilink format `[[Name]]`
- `tags`: Must be array, must include `task`
- `statusDescription`: Any string (Obsidian will auto-wrap multiline)

#### 3.4 Excluded Properties (from TaskNotes)
- ❌ `priority` - too granular
- ❌ `scheduled` - not needed
- ❌ `timeEstimate` - no time tracking
- ❌ `timeEntries` - no time tracking
- ❌ `recurrence` - future consideration
- ❌ `blockedBy`/`blocking` - future consideration

---

### 4. Bases Integration (Vanilla Bases Only)

#### 4.1 Philosophy
**No custom Bases views** - Users configure vanilla Bases plugin themselves

**Why:**
- Bases plugin already provides all filtering, grouping, kanban, list views
- Creating custom Bases views adds ~2,000 lines of code (goes against 80% reduction goal)
- Vanilla Bases is flexible enough for most task management needs
- Users who want advanced views can configure Bases themselves

#### 4.2 Integration Scope
**What we provide:**
- ✅ Task data adapter (BasesDataAdapter) so Bases can see tasks
- ✅ Property mapping (PropertyMappingService) for Bases field compatibility
- ✅ Event emissions (EVENT_TASK_UPDATED) so Bases views auto-refresh

**What we DON'T provide:**
- ❌ Pre-configured Bases views (kanban, calendar, etc.)
- ❌ TaskNotes-specific Bases view classes
- ❌ Custom Bases UI components

**User workflow:**
1. Install Bases plugin separately
2. Install this plugin (tasks auto-detected by Bases)
3. User creates Bases views in settings (filter by `tags contains task`)
4. User configures grouping, sorting, display mode themselves

#### 4.3 Property Mapping
| Task Property | Bases Field | Type |
|---------------|-------------|------|
| `complete` | `complete` | boolean |
| `due` | `due` | date |
| `projects` | `projects` | multifile |
| `tags` | `tags` | tags |
| `statusDescription` | `statusDescription` | text |
| `file.path` | `path` | text |
| `file.ctime` | `created` | date |
| `file.mtime` | `modified` | date |

#### 4.4 Bidirectional Updates
- Changes in Bases → update task frontmatter via PropertyMappingService
- Changes in frontmatter → emit `EVENT_TASK_UPDATED` → Bases refreshes
- No custom refresh logic needed (Bases handles it)

#### 4.5 Graceful Degradation
**If Bases not installed:**
- Plugin works normally (task creation, widgets, etc.)
- Show notice on first run: "Install Bases plugin for advanced views"
- No errors or broken functionality

**Version detection:**
```typescript
const bases = app.plugins.getPlugin('bases');
if (!bases || !bases.publicAPI) {
  // Bases not installed or outdated - skip registration
  return;
}
// Register data adapter with Bases public API
```

---

### 5. MCP Server (Separate Project)

#### 5.1 Architecture Decision: HTTP API-Based
**Why HTTP API instead of direct file access:**
- ❌ Direct file access creates race conditions with plugin
- ❌ Both plugin and MCP writing files → corruption risk
- ❌ MCP needs to parse frontmatter, understand task schema → duplication
- ✅ HTTP API provides single source of truth (plugin owns data)
- ✅ No file locking needed
- ✅ Plugin's metadata cache stays fresh
- ✅ All business logic in one place

**Architecture:**
```
MCP Server (Node.js)
  ↓ HTTP requests
Plugin HTTP API (TaskNotesPlugin.HTTPAPIService)
  ↓ uses
TaskService → TaskManager → Obsidian Metadata Cache
```

**MCP Server Components:**
- **Standalone Node.js project** (not part of Obsidian plugin)
- **MCP SDK**: Use `@modelcontextprotocol/sdk`
- **HTTP Client**: Axios or node-fetch to call plugin API
- **Configuration**: API base URL (http://localhost:27124), API key
- **No file watchers needed** (plugin emits events, MCP polls if needed)

#### 5.2 MCP Tools

##### 5.2.1 `list_tasks`
**HTTP Endpoint:** `GET /api/tasks`
**Parameters:**
- `tags` (optional): Array of tags to filter by
- `projects` (optional): Array of project wikilinks to filter by
- `complete` (optional): Boolean filter (true/false/"all")
- `due_before` (optional): Date string (YYYY-MM-DD)
- `due_after` (optional): Date string (YYYY-MM-DD)

**MCP Tool Implementation:**
```typescript
async function list_tasks(params) {
  const response = await axios.get(`${API_URL}/api/tasks`, {
    params: params,
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  return response.data.tasks;
}
```

##### 5.2.2 `create_task`
**HTTP Endpoint:** `POST /api/tasks`
**Parameters:**
- `title` (required): Task title
- `due` (optional): Due date (YYYY-MM-DD)
- `projects` (optional): Array of project wikilinks
- `tags` (optional): Array of tags (always includes "task")
- `statusDescription` (optional): Free text

**MCP Tool Implementation:**
```typescript
async function create_task(params) {
  const response = await axios.post(`${API_URL}/api/tasks`, params, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  return response.data.task;
}
```

##### 5.2.3 `update_task`
**HTTP Endpoint:** `PATCH /api/tasks/:id`
**Parameters:**
- `path` (required): File path of task (used as ID)
- `complete` (optional): Boolean
- `due` (optional): Date string or null
- `projects` (optional): Array of wikilinks
- `tags` (optional): Array of tags
- `statusDescription` (optional): String

**MCP Tool Implementation:**
```typescript
async function update_task(params) {
  const { path, ...updates } = params;
  const taskId = encodeURIComponent(path);
  const response = await axios.patch(`${API_URL}/api/tasks/${taskId}`, updates, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  return response.data.task;
}
```

##### 5.2.4 `read_task`
**HTTP Endpoint:** `GET /api/tasks/:id`
**Parameters:**
- `path` (required): File path of task

**MCP Tool Implementation:**
```typescript
async function read_task(params) {
  const taskId = encodeURIComponent(params.path);
  const response = await axios.get(`${API_URL}/api/tasks/${taskId}`, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  return response.data.task;
}
```

##### 5.2.5 `delete_task`
**HTTP Endpoint:** `DELETE /api/tasks/:id`
**Parameters:**
- `path` (required): File path of task
- `confirm` (required): Boolean (must be true)

**MCP Tool Implementation:**
```typescript
async function delete_task(params) {
  if (!params.confirm) {
    throw new Error('Must confirm deletion');
  }
  const taskId = encodeURIComponent(params.path);
  const response = await axios.delete(`${API_URL}/api/tasks/${taskId}`, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  return response.data;
}
```

##### 5.2.6 `bulk_operations`
**HTTP Endpoint:** `POST /api/tasks/bulk`
**Parameters:**
- `action` (required): "complete" | "incomplete" | "delete" | "update"
- `filter` (required): Object with filter criteria (same as list_tasks)
- `updates` (optional): Object with properties to update (for "update" action)

**MCP Tool Implementation:**
```typescript
async function bulk_operations(params) {
  const response = await axios.post(`${API_URL}/api/tasks/bulk`, params, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  return response.data;
}
```

#### 5.3 Plugin HTTP API Requirements
**Port from TaskNotes:**
- HTTPAPIService already exists in TaskNotes
- Endpoints: GET /api/tasks, POST /api/tasks, PATCH /api/tasks/:id, DELETE /api/tasks/:id
- Authentication: API key from settings
- CORS: Allow localhost only
- Error handling: Proper HTTP status codes

**Simplifications:**
- ❌ Remove Pomodoro endpoints (not in this plugin)
- ❌ Remove time tracking endpoints (not in this plugin)
- ❌ Remove webhook endpoints (not needed for MCP)
- ✅ Keep core task CRUD endpoints

#### 5.4 Configuration File (`mcp-config.json`)
```json
{
  "apiBaseUrl": "http://localhost:27124",
  "apiKey": "your-api-key-from-plugin-settings",
  "mcpStdioMode": true
}
```

**No vault path needed** - plugin manages all file operations

---

## Technical Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Obsidian Plugin                          │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │   Ribbon    │  │   Settings   │  │  CodeMirror     │   │
│  │   Button    │  │      UI      │  │  Extensions     │   │
│  └──────┬──────┘  └──────┬───────┘  └────────┬────────┘   │
│         │                │                   │             │
│         ▼                ▼                   ▼             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Calendar Import Service                 │  │
│  │  - ICSSubscriptionService (fetch/parse)              │  │
│  │  - Heading finder                                    │  │
│  │  - Wikilink generator                                │  │
│  └─────────────────────────┬────────────────────────────┘  │
│                            │                               │
│  ┌─────────────────────────┴────────────────────────────┐  │
│  │            Task Conversion Service                   │  │
│  │  - InstantConvertButtons (widget)                    │  │
│  │  - InstantTaskConvertService (modified)              │  │
│  └─────────────────────────┬────────────────────────────┘  │
│                            │                               │
│  ┌─────────────────────────┴────────────────────────────┐  │
│  │                  Core Services                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │  │
│  │  │ TaskManager  │  │ TaskService  │  │FieldMapper │ │  │
│  │  │ (JIT access) │  │ (CRUD ops)   │  │ (props)    │ │  │
│  │  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘ │  │
│  │         │                 │                │        │  │
│  │         ▼                 ▼                ▼        │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │      Obsidian Metadata Cache                 │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                               │
│  ┌─────────────────────────┴────────────────────────────┐  │
│  │              Bases Integration                       │  │
│  │  - BasesDataAdapter                                  │  │
│  │  - PropertyMappingService                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Events
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Bases Plugin (External)                   │
│  - Kanban View                                              │
│  - List View                                                │
│  - Filter/Group/Sort UI                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  MCP Server (Separate)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  MCP Tools                                           │   │
│  │  - list_tasks                                        │   │
│  │  - create_task                                       │   │
│  │  - update_task                                       │   │
│  │  - read_task                                         │   │
│  │  - delete_task                                       │   │
│  │  - bulk_operations                                   │   │
│  └─────────────────────┬────────────────────────────────┘   │
│                        │                                    │
│  ┌─────────────────────▼────────────────────────────────┐   │
│  │  HTTP Client (Axios)                                │   │
│  │  - GET/POST/PATCH/DELETE to plugin API              │   │
│  │  - Authentication with API key                      │   │
│  │  - Error handling and retries                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                        │ HTTP localhost:27124               │
└────────────────────────┼────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Plugin HTTP API                            │
│  - HTTPAPIService (ported from TaskNotes)                   │
│  - Endpoints: /api/tasks (GET, POST, PATCH, DELETE)        │
│  - Uses TaskService for all operations                      │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

#### Calendar Import Flow
```
1. User clicks "Import Meetings" ribbon button
2. CalendarImportService.importTodaysMeetings()
3. ICSSubscriptionService.fetchAndParse(calendarURL)
4. Filter events for today (00:00 - 23:59)
5. Sanitize event titles (forbidden chars)
6. HeadingFinder.locate("#### 📆 Agenda", activeNote)
7. Check for duplicate wikilinks
8. Insert wikilinks in chronological order
9. Show success notice with count
```

#### Task Conversion Flow
```
1. User types: "- [ ] Follow up with Sarah"
2. User presses Ctrl+Enter (or clicks convert button)
3. InstantTaskConvertService extracts checkbox status ([x] vs [ ]) and title
4. TaskCreationModal opens with two fields:
   - Due date field (auto-focused)
   - Project field (SuggestModal for autocomplete)
5. User inputs metadata:
   - Types "friday" in due field → chrono-node (lazy loaded) parses → 2025-11-08
   - Tabs to project field → starts typing → SuggestModal shows options
   - Selects "[[Client Alpha]]" from suggestions
   - Presses Enter to submit
6. Modal calls TaskService.createTask({
     title: "Follow up with Sarah",
     due: "2025-11-08",
     projects: ["[[Client Alpha]]"],
     complete: false,
     tags: ["task"]
   })
7. TaskService generates unique filename (sanitize, handle duplicates)
8. TaskService creates file with frontmatter
9. Modal calls editor.transaction() to replace line:
     "- [ ] Follow up with Sarah" → "- [ ] [[Follow up with Sarah]]"
     (enables undo/redo)
10. TaskService emits EVENT_TASK_UPDATED
11. TaskLinkOverlay detects wikilink, renders interactive widget
12. Bases plugin (if installed) auto-refreshes views
```

#### MCP Task Creation Flow
```
1. LLM calls create_task MCP tool
2. MCP server sends POST /api/tasks to plugin HTTP API
3. HTTPAPIService validates API key
4. HTTPAPIService calls TaskService.createTask()
5. TaskService generates filename, creates file with frontmatter
6. HTTPAPIService returns task object with file path
7. MCP tool returns data to LLM
8. Obsidian metadata cache auto-updates (no file watcher needed)
```

---

## Component Specifications

### 1. TaskManager (JIT Data Access)

**File:** `src/utils/TaskManager.ts`
**Lines:** ~400 (simplified from 850)

**Purpose:** Read task data on-demand from Obsidian's metadata cache. No internal caching.

**Key Methods:**
```typescript
class TaskManager extends Events {
  // Task detection
  isTaskFile(frontmatter: any): boolean

  // Data access (SYNCHRONOUS - reads from metadataCache)
  getTaskInfo(path: string): TaskInfo | null  // Changed from Promise
  getAllTasks(): TaskInfo[]                    // Changed from Promise
  getTaskFiles(): TFile[]

  // Date-based queries
  getTasksForDate(date: string): string[]
  getTasksDueInRange(start: string, end: string): TaskInfo[]

  // Event emitters
  trigger(event: string, data: any): void
}
```

**Architectural Decision: Synchronous Data Access**
- Obsidian's `metadataCache.getCache()` is synchronous
- No need for async/await overhead
- Simplifies calling code (no await needed)
- Faster execution (no promise microtask delays)
- If frontmatter not cached yet, return null and caller can retry after cache event

**Simplifications from TaskNotes:**
- ❌ Remove dependency caching methods
- ❌ Remove old cache compatibility layer
- ✅ Keep JIT pattern and event-driven architecture
- ✅ Make data access synchronous (was async unnecessarily)

---

### 2. TaskService (CRUD Operations)

**File:** `src/services/TaskService.ts`
**Lines:** ~600 (simplified from 1,859)

**Purpose:** Create, update, delete tasks. Handle file operations and frontmatter.

**Key Methods:**
```typescript
class TaskService {
  createTask(data: TaskCreationData): Promise<TFile>
  updateTask(path: string, updates: Partial<TaskInfo>): Promise<void>
  deleteTask(path: string): Promise<void>

  // Specific updates
  updateTaskStatus(path: string, complete: boolean): Promise<void>
  updateTaskProjects(path: string, projects: string[]): Promise<void>

  // Utilities
  generateUniqueFilename(title: string, folder: string): string
  sanitizeTitle(title: string): string
}
```

**Simplifications from TaskNotes:**
- ❌ Remove webhook integration
- ❌ Remove time tracking methods
- ❌ Remove recurrence handling
- ✅ Keep core CRUD and filename generation

---

### 3. CalendarImportService

**File:** `src/services/CalendarImportService.ts`
**Lines:** ~300 (new, using ICSSubscriptionService from TaskNotes)

**Purpose:** Import meetings from Outlook calendar and insert wikilinks.

**Key Methods:**
```typescript
class CalendarImportService {
  constructor(
    plugin: Plugin,
    icsService: ICSSubscriptionService
  )

  // Main import method
  importTodaysMeetings(activeNote: TFile): Promise<number>

  // Helper methods
  private findAgendaHeading(content: string): number | null
  private sanitizeMeetingTitle(title: string): string
  private generateWikilink(title: string): string
  private checkDuplicate(content: string, wikilink: string): boolean
  private insertWikilinks(
    content: string,
    headingPos: number,
    wikilinks: string[]
  ): string
}
```

**Dependencies:**
- `ICSSubscriptionService` (from TaskNotes)
- `ical.js` library

**Configuration:**
- `settings.outlookCalendarURL` - ICS feed URL
- `settings.meetingFolder` - Where to create meeting notes

---

### 4. CheckboxPromptWidget (NEW Component)

**File:** `src/editor/CheckboxPromptWidget.ts`
**Lines:** ~350 (new implementation)

**Purpose:** CodeMirror extension that detects checkbox + space and shows inline prompt for metadata.

**Architecture:**
- **ViewPlugin** pattern (listens to editor changes)
- **Widget** renders floating prompt below checkbox line
- **NaturalLanguageParser** for date parsing

**Key Components:**
```typescript
// Main CodeMirror ViewPlugin
export function createCheckboxPromptPlugin(plugin: Plugin): ViewPlugin {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
      }

      update(update: ViewUpdate) {
        // Detect space keypress after checkbox pattern
        if (this.isCheckboxWithSpace(update)) {
          this.showPrompt(update);
        }
      }

      private isCheckboxWithSpace(update: ViewUpdate): boolean {
        // Pattern: "- [ ] Title " or "- [x] Title "
        const line = this.getLineAtCursor(update);
        return /^-\s+\[([ xX])\]\s+.+\s$/.test(line);
      }

      private showPrompt(update: ViewUpdate) {
        // Render prompt widget below current line
        const widget = new TaskPromptWidget(plugin, this.extractCheckboxData(update));
        this.decorations = this.addWidget(widget, update.state.selection.main.head);
      }
    }
  );
}

// Prompt Widget UI
class TaskPromptWidget extends WidgetType {
  constructor(
    private plugin: Plugin,
    private checkboxData: { title: string; status: boolean; indent: string }
  ) {
    super();
  }

  toDOM(): HTMLElement {
    const container = document.createElement("div");
    container.className = "task-prompt-container";

    // Due date field (auto-focused)
    const dueDateInput = document.createElement("input");
    dueDateInput.type = "text";
    dueDateInput.placeholder = "Due date (e.g., friday, tomorrow, nov 15)";
    dueDateInput.className = "task-prompt-due";
    dueDateInput.addEventListener("input", (e) => this.handleDateInput(e));

    // Project field
    const projectInput = document.createElement("input");
    projectInput.type = "text";
    projectInput.placeholder = "Project (e.g., [[Client Alpha]])";
    projectInput.className = "task-prompt-project";

    // Create button
    const createBtn = document.createElement("button");
    createBtn.textContent = "⚡ Create Task";
    createBtn.onclick = () => this.handleSubmit(dueDateInput.value, projectInput.value);

    // Escape hint
    const escHint = document.createElement("span");
    escHint.className = "task-prompt-hint";
    escHint.textContent = "Esc to cancel";

    container.append(dueDateInput, projectInput, createBtn, escHint);

    // Keyboard navigation
    container.addEventListener("keydown", (e) => this.handleKeyboard(e));

    // Auto-focus due date field
    setTimeout(() => dueDateInput.focus(), 10);

    return container;
  }

  private async handleSubmit(dueInput: string, projectInput: string) {
    // Parse natural language date
    const dueDate = this.plugin.nlpParser.parseDate(dueInput);

    // Parse projects (wikilinks)
    const projects = this.extractWikilinks(projectInput);

    // Create task
    await this.plugin.checkboxPromptService.createTaskFromPrompt({
      title: this.checkboxData.title,
      due: dueDate ? formatDateForStorage(dueDate) : null,
      projects,
      complete: this.checkboxData.status,
      tags: ["task"]
    });

    // Replace line with wikilink
    this.replaceCheckboxLine();

    // Close prompt
    this.remove();
  }

  private handleKeyboard(e: KeyboardEvent) {
    switch(e.key) {
      case "Tab":
        e.preventDefault();
        this.focusNext(e.shiftKey);
        break;
      case "Enter":
        e.preventDefault();
        this.handleSubmit(/* current values */);
        break;
      case "Escape":
        e.preventDefault();
        this.remove(); // Cancel, keep plain checkbox
        break;
    }
  }
}
```

**Natural Language Parsing:**
- Uses `chrono-node` (already in TaskNotes)
- Supports: "friday", "tomorrow", "nov 15", "in 2 weeks", "next monday"
- Shows preview: "friday" → "📅 Fri, Nov 8, 2025"

**Configuration:**
- `settings.autoPromptOnSpace` - Enable/disable feature
- `settings.defaultTags` - Tags to add to new tasks

---

### 5. CheckboxPromptService (NEW Service)

**File:** `src/services/CheckboxPromptService.ts`
**Lines:** ~200 (new implementation)

**Purpose:** Handle task creation from prompt widget data.

**Key Methods:**
```typescript
class CheckboxPromptService {
  constructor(
    private plugin: Plugin,
    private taskService: TaskService,
    private nlpParser: NaturalLanguageParser
  ) {}

  async createTaskFromPrompt(data: {
    title: string;
    due: string | null;
    projects: string[];
    complete: boolean;
    tags: string[];
  }): Promise<TFile> {
    // Create task note with metadata
    const taskData: TaskCreationData = {
      title: data.title,
      due: data.due,
      projects: data.projects,
      complete: data.complete,
      tags: data.tags,
      statusDescription: ""
    };

    return await this.taskService.createTask(taskData);
  }

  replaceCheckboxLine(
    editor: Editor,
    lineNumber: number,
    title: string,
    checkboxStatus: boolean
  ): void {
    const checkbox = checkboxStatus ? "[x]" : "[ ]";
    const newLine = `- ${checkbox} [[${title}]]`;
    editor.setLine(lineNumber, newLine);
  }
}
```

---

### 6. NaturalLanguageParser (Ported from TaskNotes)

**File:** `src/services/NaturalLanguageParser.ts`
**Lines:** ~300 (port from TaskNotes, simplified)

**Purpose:** Parse natural language dates and metadata from text.

**Port from TaskNotes with simplifications:**
- ✅ Keep chrono-node date parsing
- ✅ Keep date format utilities
- ❌ Remove context parsing (@context)
- ❌ Remove project tag parsing (#project)
- ❌ Remove recurrence parsing

**Key Method:**
```typescript
class NaturalLanguageParser {
  parseDate(input: string): Date | null {
    if (!input || input.trim() === "") return null;

    // Use chrono-node for natural language
    const parsed = chrono.parseDate(input, new Date(), { forwardDate: true });
    return parsed || null;
  }

  formatDatePreview(input: string): string {
    const date = this.parseDate(input);
    if (!date) return "";

    return `📅 ${format(date, "EEE, MMM d, yyyy")}`;
  }
}
    const taskData: TaskCreationData = {
      title,
      complete: status,
      tags: ['task']
    };

    const file = await this.plugin.taskService.createTask(taskData);

    // 3. Replace line (KEEP CHECKBOX)
    const checkbox = status ? '[x]' : '[ ]';
    const newLine = `${indent}- ${checkbox} [[${title}]]`;

    editor.setLine(lineNumber, newLine);

    // 4. Trigger events
    this.plugin.app.workspace.trigger(EVENT_TASK_UPDATED, { file });
  }
}
```

**Simplifications:**
- ❌ Remove NLP parsing fallback
- ❌ Remove multi-line selection support
- ❌ Remove batch conversion
- ✅ Keep race condition protection

---

### 6. BasesDataAdapter

**File:** `src/bases/BasesDataAdapter.ts`
**Lines:** ~150 (port from TaskNotes)

**Purpose:** Public API wrapper for Bases plugin integration.

**Port as-is from TaskNotes** - well-architected, no changes needed.

**Key Methods:**
```typescript
class BasesDataAdapter {
  extractDataItems(): BasesDataItem[]
  getGroupedData(): any[]
  isGrouped(): boolean
  getSortConfig(): any
  getVisiblePropertyIds(): string[]
  getPropertyDisplayName(propertyId: string): string
  getPropertyValue(entry: any, propertyId: string): any
}
```

---

### 7. PropertyMappingService

**File:** `src/bases/PropertyMappingService.ts`
**Lines:** ~200 (port from TaskNotes)

**Purpose:** Bidirectional mapping between task properties and Bases fields.

**Port as-is from TaskNotes** - handles property conversion correctly.

**Property Mappings:**
```typescript
const PROPERTY_MAPPINGS = {
  'complete': { basesId: 'complete', type: 'boolean' },
  'due': { basesId: 'due', type: 'date' },
  'projects': { basesId: 'projects', type: 'multifile' },
  'tags': { basesId: 'tags', type: 'tags' },
  'statusDescription': { basesId: 'statusDescription', type: 'text' },
};
```

---

### 8. Dependency Injection Pattern

**Purpose:** Reduce coupling, improve testability, enable lazy loading

**Implementation:**
```typescript
// main.ts - Service container
class ServiceContainer {
  private services = new Map<string, any>();
  private factories = new Map<string, () => any>();

  register<T>(key: string, factory: () => T): void {
    this.factories.set(key, factory);
  }

  get<T>(key: string): T {
    if (!this.services.has(key)) {
      const factory = this.factories.get(key);
      if (!factory) throw new Error(`Service ${key} not registered`);
      this.services.set(key, factory());
    }
    return this.services.get(key);
  }

  clear(): void {
    this.services.clear();
  }
}

// Plugin initialization
export default class TaskNotesPlugin extends Plugin {
  container: ServiceContainer;

  async onload() {
    this.container = new ServiceContainer();

    // Register services with factories (lazy instantiation)
    this.container.register('taskManager', () => new TaskManager(this));
    this.container.register('taskService', () => new TaskService(
      this,
      this.container.get('taskManager')
    ));
    this.container.register('calendarService', () => new CalendarImportService(
      this,
      this.container.get('icsService')
    ));

    // Conditional registration
    if (this.settings.enableHTTPAPI) {
      this.container.register('httpAPI', () => new HTTPAPIService(this));
    }
  }

  async onunload() {
    this.container.clear();
  }
}
```

**Benefits:**
- Services only created when first accessed (lazy loading)
- Easy to mock for testing
- Clear dependency graph
- Prevents circular dependencies

---

### 9. Event System Schema

**Purpose:** Define event payloads and prevent infinite loops

**Event Definitions:**
```typescript
// types.ts - Event payload interfaces
export interface TaskUpdatedEvent {
  file: TFile;
  task: TaskInfo;
  changes: Partial<TaskInfo>;
  source: 'plugin' | 'mcp' | 'bases' | 'user';
  timestamp: number;
}

export interface TaskCreatedEvent {
  file: TFile;
  task: TaskInfo;
  source: 'plugin' | 'mcp';
  timestamp: number;
}

export interface TaskDeletedEvent {
  path: string;
  task: TaskInfo;
  source: 'plugin' | 'mcp';
  timestamp: number;
}

// Event constants
export const EVENT_TASK_UPDATED = 'tasknotes:task-updated';
export const EVENT_TASK_CREATED = 'tasknotes:task-created';
export const EVENT_TASK_DELETED = 'tasknotes:task-deleted';
```

**Event Bus with Loop Prevention:**
```typescript
// services/EventBus.ts
export class EventBus {
  private processing = new Map<string, number>();
  private debounceMs = 100;

  emit(event: string, data: TaskUpdatedEvent | TaskCreatedEvent | TaskDeletedEvent): void {
    const key = `${event}:${data.file?.path || data.path}`;
    const now = Date.now();

    // Check if we just processed this event
    const lastProcessed = this.processing.get(key);
    if (lastProcessed && (now - lastProcessed) < this.debounceMs) {
      console.debug(`Debounced ${event} for ${key}`);
      return;
    }

    this.processing.set(key, now);

    // Emit event
    app.workspace.trigger(event, data);

    // Clean up old entries after 1 second
    setTimeout(() => this.processing.delete(key), 1000);
  }
}
```

**Usage:**
```typescript
// In TaskService after updating a task
this.eventBus.emit(EVENT_TASK_UPDATED, {
  file: taskFile,
  task: updatedTask,
  changes: { complete: true },
  source: 'plugin',
  timestamp: Date.now()
});
```

---

### 10. Error Handling Strategy

**Purpose:** Graceful degradation, user-friendly errors, debugging support

**Error Classes:**
```typescript
// errors.ts
export class TaskNotesError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'TaskNotesError';
  }
}

export class TaskCreationError extends TaskNotesError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'TASK_CREATION_FAILED', context);
  }
}

export class CalendarImportError extends TaskNotesError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'CALENDAR_IMPORT_FAILED', context);
  }
}
```

**Error Handling Patterns:**
```typescript
// In TaskService.createTask()
async createTask(data: TaskCreationData): Promise<TFile> {
  try {
    // ... task creation logic
    return file;
  } catch (error) {
    // Log error with context
    console.error('Task creation failed:', {
      error,
      data,
      stack: error.stack
    });

    // Show user-friendly notice
    new Notice(`Failed to create task: ${data.title}`, 5000);

    // Re-throw with context
    throw new TaskCreationError(
      'Failed to create task file',
      { title: data.title, folder: this.settings.taskFolder }
    );
  }
}

// In CalendarImportService
async importTodaysMeetings(): Promise<number> {
  try {
    const events = await this.icsService.fetchEvents();
    // ... import logic
    return imported.length;
  } catch (error) {
    if (error.code === 'ENOTFOUND') {
      // Network error
      new Notice('Calendar import failed: Network error. Check your connection.', 5000);
    } else if (error.code === 'INVALID_ICS') {
      // Parse error
      new Notice('Calendar import failed: Invalid ICS format', 5000);
    } else {
      // Unknown error
      new Notice('Calendar import failed. Check console for details.', 5000);
    }

    // Log for debugging
    console.error('Calendar import error:', {
      error,
      url: this.settings.calendarURL
    });

    throw new CalendarImportError(error.message, { url: this.settings.calendarURL });
  }
}
```

**Rollback Support:**
```typescript
// In InstantTaskConvertService
async convertCheckbox(editor: Editor, lineNumber: number): Promise<void> {
  const originalLine = editor.getLine(lineNumber);
  let createdFile: TFile | null = null;

  try {
    // Create task file
    createdFile = await this.taskService.createTask(data);

    // Replace line
    editor.transaction({
      changes: [{
        from: { line: lineNumber, ch: 0 },
        to: { line: lineNumber, ch: originalLine.length },
        insert: newLine
      }]
    });
  } catch (error) {
    // Rollback: delete created file if line replacement failed
    if (createdFile) {
      await this.app.vault.delete(createdFile);
    }

    // Restore original line if needed
    const currentLine = editor.getLine(lineNumber);
    if (currentLine !== originalLine) {
      editor.setLine(lineNumber, originalLine);
    }

    throw error;
  }
}
```

---

### 11. Lazy Loading for Dependencies

**Purpose:** Reduce initial bundle size, faster plugin load time

**chrono-node Lazy Loading:**
```typescript
// services/NaturalLanguageParser.ts
export class NaturalLanguageParser {
  private chronoPromise: Promise<typeof import('chrono-node')> | null = null;

  private async getChrono() {
    if (!this.chronoPromise) {
      this.chronoPromise = import('chrono-node');
    }
    return this.chronoPromise;
  }

  async parseDate(input: string): Promise<Date | null> {
    if (!input || input.trim() === '') return null;

    try {
      const chrono = await this.getChrono();
      const parsed = chrono.parseDate(input, new Date(), { forwardDate: true });
      return parsed || null;
    } catch (error) {
      console.error('Failed to load chrono-node:', error);
      new Notice('Natural language parsing unavailable. Use YYYY-MM-DD format.');
      return null;
    }
  }
}
```

**ical.js Lazy Loading:**
```typescript
// services/ICSSubscriptionService.ts
export class ICSSubscriptionService {
  private icalPromise: Promise<typeof import('ical.js')> | null = null;

  private async getIcal() {
    if (!this.icalPromise) {
      this.icalPromise = import('ical.js');
    }
    return this.icalPromise;
  }

  async parseICS(icsData: string): Promise<VEVENT[]> {
    const ICAL = await this.getIcal();
    const jcalData = ICAL.parse(icsData);
    const comp = new ICAL.Component(jcalData);
    return comp.getAllSubcomponents('vevent');
  }
}
```

**Bundle Size Impact:**
- chrono-node: ~100KB → loaded only when user types natural language date
- ical.js: ~200KB → loaded only when user imports calendar
- Initial bundle reduced by ~300KB (60% of target savings)

---

### 12. Keyboard Shortcuts

**Purpose:** Power user productivity, discoverability

**Command Registration:**
```typescript
// main.ts
async onload() {
  // Convert checkbox to task
  this.addCommand({
    id: 'convert-to-task',
    name: 'Convert checkbox to task',
    hotkeys: [{ modifiers: ['Mod'], key: 'Enter' }],  // Ctrl/Cmd+Enter
    editorCallback: (editor, view) => {
      this.instantTaskConvertService.convertLine(editor, editor.getCursor().line);
    }
  });

  // Import meetings
  this.addCommand({
    id: 'import-meetings',
    name: 'Import today\'s meetings',
    hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'M' }],  // Ctrl/Cmd+Shift+M
    callback: async () => {
      const activeFile = this.app.workspace.getActiveFile();
      if (!activeFile) {
        new Notice('No active note');
        return;
      }
      const count = await this.calendarService.importTodaysMeetings(activeFile);
      new Notice(`Imported ${count} meetings`);
    }
  });

  // Open task note from cursor
  this.addCommand({
    id: 'open-task-at-cursor',
    name: 'Open task note at cursor',
    hotkeys: [{ modifiers: ['Mod'], key: 'O' }],  // Ctrl/Cmd+O
    editorCallback: (editor) => {
      const cursor = editor.getCursor();
      const line = editor.getLine(cursor.line);
      const wikilink = this.extractWikilink(line);
      if (wikilink) {
        this.app.workspace.openLinkText(wikilink, '');
      }
    }
  });
}
```

**Customizable Shortcuts:**
```typescript
// settings/SettingTab.ts
new Setting(containerEl)
  .setName('Convert to task shortcut')
  .setDesc('Keyboard shortcut to convert checkbox to task note')
  .addText(text => text
    .setPlaceholder('Mod+Enter')
    .setValue(this.plugin.settings.convertShortcut)
    .onChange(async (value) => {
      this.plugin.settings.convertShortcut = value;
      await this.plugin.saveSettings();
      // Re-register commands with new shortcuts
      this.plugin.refreshCommands();
    })
  );
```

---

## Implementation Phases

### Phase 1: Project Setup (Week 1, Days 1-2)
**Goal:** Bootstrap new plugin with TypeScript tooling

**Tasks:**
- [ ] Create new plugin directory structure
- [ ] Setup esbuild configuration (port from TaskNotes)
- [ ] Create manifest.json
- [ ] Setup TypeScript (tsconfig.json)
- [ ] Create basic plugin class (`main.ts`)
- [ ] Add dependencies: `ical.js`, `yaml`, `date-fns`
- [ ] Setup test vault for development

**Deliverable:** Plugin loads in Obsidian, shows in settings

**Claude Code Agents:** No specific agents needed for this phase (basic setup).

---

### Phase 2: Core Infrastructure (Week 1, Days 3-5)
**Goal:** Port essential services from TaskNotes

**Tasks:**
- [ ] Port `TaskManager.ts` (simplified to ~400 lines)
  - Remove dependency cache
  - Remove old compatibility layer
  - Keep JIT pattern
- [ ] Port `TaskService.ts` (simplified to ~600 lines)
  - Remove webhooks
  - Remove time tracking
  - Remove recurrence
  - Keep CRUD methods
- [ ] Port `FieldMapper.ts` (minimal changes)
- [ ] Create type definitions (`types.ts`)
  - `TaskInfo` interface
  - `TaskCreationData` interface
  - Event constants
- [ ] Port date utilities (`dateUtils.ts`)
- [ ] Create settings interface and defaults

**Deliverable:** Task CRUD operations work, can create task notes manually

**Claude Code Agents:**
- Use **service-architect** to design and implement TaskManager, TaskService, and FieldMapper following service-oriented patterns
- Use **test-specialist** to write unit tests for TaskManager and TaskService CRUD operations

---

### Phase 3: Calendar Integration (Week 2)
**Goal:** Implement meeting import from Outlook

**Tasks:**
- [ ] Port `ICSSubscriptionService.ts` from TaskNotes
  - Keep ICS parsing logic
  - Keep caching
  - Remove UI-specific code
- [ ] Create `CalendarImportService.ts`
  - Implement `findAgendaHeading()`
  - Implement `sanitizeMeetingTitle()` with forbidden char rules
  - Implement `importTodaysMeetings()`
  - Implement deduplication logic
- [ ] Add ribbon button for "Import Meetings"
- [ ] Add command palette command
- [ ] Create settings UI:
  - Outlook Calendar URL input
  - Meeting folder path input
  - Task folder path input
- [ ] Test with real Outlook ICS feed
- [ ] Handle edge cases (no meetings, network error, no heading)

**Deliverable:** Can import today's meetings from Outlook calendar into daily note

**Claude Code Agents:**
- Use **service-architect** to implement CalendarImportService as a well-architected service with proper dependency injection
- Use **test-specialist** to write integration tests for ICS parsing and meeting import workflows

---

### Phase 4: Auto-Prompt Task Creation (Week 3)
**Goal:** Auto-prompt for metadata when typing checkbox + space

**Tasks:**
- [ ] Port `NaturalLanguageParser.ts` from TaskNotes (simplified)
  - Keep chrono-node date parsing
  - Remove context/project tag parsing
  - Remove recurrence parsing
  - Add date preview formatting
- [ ] Create `CheckboxPromptWidget.ts` (NEW - ~350 lines)
  - Implement CodeMirror ViewPlugin
  - Detect checkbox + space pattern
  - Render floating prompt widget below line
  - Due date input field (auto-focused, NLP parsing)
  - Project input field (wikilink autocomplete)
  - Keyboard navigation (Tab, Enter, Esc)
  - Submit handler (create task + replace line)
- [ ] Create `CheckboxPromptService.ts` (NEW - ~200 lines)
  - Handle task creation from prompt data
  - Line replacement logic (checkbox → wikilink)
  - Integration with TaskService
- [ ] Style prompt widget (CSS)
  - Float below checkbox line
  - Similar to Obsidian Tasks plugin design
  - Input fields, button, hint text
- [ ] Register CodeMirror extension in plugin
- [ ] Test prompt workflow:
  - Type `- [ ] Task ` → prompt appears
  - Enter "friday" → parses to next Friday
  - Tab to project → autocomplete works
  - Enter → creates `- [ ] [[Task]]` + task file
  - Esc → cancels, keeps plain checkbox
- [ ] Test edge cases:
  - Empty title → "Untitled Task"
  - Invalid date → inline error, stay in field
  - Duplicate filename → append counter
  - Checked box `[x]` → sets `complete: true`
- [ ] Add retroactive conversion:
  - Right-click plain checkbox → "Convert to Task"
  - Shows same prompt

**Deliverable:** Checkbox + space triggers prompt, creates task with metadata, checkbox remains visible as wikilink

**Claude Code Agents:**
- Use **editor-extension-specialist** to implement CheckboxPromptWidget.ts using proper CodeMirror 6 patterns
- Use **service-architect** to implement CheckboxPromptService with proper service integration
- Use **test-specialist** to write tests for the prompt workflow and edge cases

---

### Phase 5: Bases Integration (Week 4, Days 1-3)
**Goal:** Make tasks visible in Bases plugin

**Tasks:**
- [ ] Port `BasesDataAdapter.ts` (no changes)
- [ ] Port `PropertyMappingService.ts` (no changes)
- [ ] Register plugin with Bases (if installed)
- [ ] Test property mapping:
  - `complete` → boolean field
  - `due` → date field
  - `projects` → multifile field
  - `tags` → tags field
- [ ] Test Bases views:
  - Create kanban view grouped by projects
  - Create list view filtered by tags
  - Create calendar view by due date
- [ ] Test bidirectional updates:
  - Change property in Bases → frontmatter updates
  - Change frontmatter → Bases view refreshes
- [ ] Add listener for `EVENT_TASK_UPDATED`

**Deliverable:** Tasks appear in Bases views, can be filtered/grouped/sorted

**Claude Code Agents:**
- Use **bases-integration-expert** to port and configure BasesDataAdapter and PropertyMappingService
- Use **bases-integration-expert** to ensure proper integration with Bases public API and test bidirectional updates
- Use **test-specialist** to write integration tests for Bases property mapping and view updates

---

### Phase 6: MCP Server (Week 4, Days 4-5 + Week 5)
**Goal:** Standalone MCP server for LLM task management

**Tasks:**
- [ ] Create separate Node.js project (`tasknotes-mcp/`)
- [ ] Setup MCP SDK (`@modelcontextprotocol/sdk`)
- [ ] Implement configuration file loader
- [ ] Implement vault file scanner
- [ ] Implement frontmatter parser (use `gray-matter`)
- [ ] Implement MCP tools:
  - [ ] `list_tasks` with filtering
  - [ ] `create_task`
  - [ ] `update_task`
  - [ ] `read_task`
  - [ ] `delete_task`
  - [ ] `bulk_operations`
- [ ] Implement file watcher (chokidar)
- [ ] Implement task metadata cache
- [ ] Test with Claude Desktop MCP config
- [ ] Write MCP server documentation
- [ ] Create example LLM prompts

**Deliverable:** MCP server running, Claude can manage tasks via natural language

**Claude Code Agents:**
- Use **api-endpoint-builder** to implement HTTP API endpoints in the plugin (GET/POST/PATCH/DELETE /api/tasks)
- Use **api-endpoint-builder** to implement MCP tools that call the plugin's HTTP API
- Use **test-specialist** to write integration tests for all MCP tools and HTTP API endpoints

---

### Phase 7: Testing & Polish (Week 6)
**Goal:** Production-ready plugin

**Tasks:**
- [ ] **Calendar Import Testing:**
  - [ ] Test with recurring Outlook events
  - [ ] Test with all-day events (DTSTART without DTEND)
  - [ ] Test with meetings with special characters (HTML entities)
  - [ ] Test with cancelled events (METHOD:CANCEL)
  - [ ] Test timezone handling (DTSTART in different zones)
  - [ ] Test duplicate detection
  - [ ] Test error handling (no network, invalid URL, invalid ICS)
  - [ ] Test retry logic with exponential backoff
- [ ] **Modal Task Creation Testing:**
  - [ ] Test modal opens on Ctrl+Enter
  - [ ] Test modal opens on convert button click
  - [ ] Test modal opens on right-click → "Convert to Task"
  - [ ] Test natural language date parsing (friday, tomorrow, etc.)
  - [ ] Test SuggestModal autocomplete for projects
  - [ ] Test keyboard navigation (Tab, Shift+Tab, Enter, Esc)
  - [ ] Test with checked/unchecked boxes
  - [ ] Test empty titles (fallback to "Untitled Task")
  - [ ] Test invalid dates (error shown, modal stays open)
  - [ ] Test duplicate filenames (counter appended)
  - [ ] Test filename sanitization (forbidden chars, Windows reserved names)
  - [ ] Test editor.transaction() enables undo/redo
  - [ ] Test tooltip shows on first checkbox (discoverability)
  - [ ] Test chrono-node lazy loading (works when loaded, fallback when fails)
- [ ] **Interactive Widget Testing:**
  - [ ] Test widgets render in Live Preview mode
  - [ ] Test status dot click cycles through statuses
  - [ ] Test task title click opens note
  - [ ] Test due date and priority indicators display
  - [ ] Test widgets update when frontmatter changes
  - [ ] Test widgets render in Reading Mode
  - [ ] Test multiple widgets for same task (all update together)
- [ ] **Error Handling Tests:**
  - [ ] Test task creation rollback (file created but line replacement fails)
  - [ ] Test calendar import network timeout handling
  - [ ] Test calendar import retry with exponential backoff
  - [ ] Test corrupted frontmatter validation
  - [ ] Test file deletion recovery (undo)
  - [ ] Test error logging to console with context
  - [ ] Test user-friendly error notices
- [ ] **UI Testing (with Playwright):**
  - [ ] Install Playwright for E2E tests
  - [ ] Test modal rendering and focus management
  - [ ] Test SuggestModal keyboard navigation
  - [ ] Test widget click interactions
  - [ ] Visual regression tests for modal UI
- [ ] **Bases Integration Testing:**
  - [ ] Test plugin works without Bases installed (graceful degradation)
  - [ ] Test Bases version detection
  - [ ] Test all property types map correctly
  - [ ] Test property updates from Bases → frontmatter
  - [ ] Test EVENT_TASK_UPDATED triggers Bases refresh
  - [ ] Test filtering by tags in vanilla Bases
  - [ ] Test grouping by projects in vanilla Bases
- [ ] **MCP Server Testing:**
  - [ ] Test all MCP tools via HTTP API
  - [ ] Test API authentication with API key
  - [ ] Test concurrent requests don't corrupt files
  - [ ] Test error handling (404, 401, 500)
  - [ ] Test HTTP API disabled when setting off
- [ ] **Documentation:**
  - [ ] README.md with installation steps
  - [ ] User guide with screenshots (modal, widgets, calendar import)
  - [ ] MCP server setup guide (HTTP API config)
  - [ ] Settings documentation
  - [ ] Architecture decisions document (why Modal not widget, etc.)
- [ ] **Code Quality:**
  - [ ] Add JSDoc comments to all public methods
  - [ ] Lint and format all code (eslint, prettier)
  - [ ] Remove debug console.logs (keep error logging)
  - [ ] Optimize performance (debouncing event emitters)
  - [ ] Run type checker with --strict mode

**Deliverable:** Production-ready plugin, comprehensive documentation, E2E test suite

**Claude Code Agents:**
- Use **test-specialist** to write all test suites (calendar import, modal creation, widget rendering, error handling, Bases integration, MCP server)
- Use **editor-extension-specialist** to optimize widget rendering performance and fix any editor-related bugs
- Use **bases-integration-expert** to verify Bases integration testing and graceful degradation
- Use **api-endpoint-builder** to test HTTP API endpoints and MCP tool integration
- Use **performance-optimizer** to profile and optimize calendar import, task conversion, and Bases view refresh performance
- Use **service-architect** to review overall architecture and ensure service patterns are followed consistently

---

## Success Metrics

### User Experience Metrics
- [ ] **Calendar import** completes in <2 seconds for 20 meetings
- [ ] **Task conversion** feels instant (<100ms perceived latency)
- [ ] **Bases views** refresh in <500ms after task update
- [ ] **MCP queries** return in <1 second for vault with 1000 tasks

### Code Quality Metrics
- [ ] **Plugin size** <5,000 lines (vs TaskNotes ~20,000)
- [ ] **Bundle size** <500KB (TaskNotes is ~800KB)
- [ ] **No console errors** during normal operation
- [ ] **TypeScript strict mode** enabled with no errors

### Functionality Metrics
- [ ] **Calendar import** handles 100% of Outlook event types
- [ ] **Task conversion** preserves 100% of checkbox states
- [ ] **Bases integration** supports 100% of task properties
- [ ] **MCP server** handles 100% of CRUD operations

---

## Risk Mitigation

### Risk 1: ICS Feed Compatibility
**Risk:** Outlook calendar format may vary by organization/version
**Mitigation:**
- Test with multiple Outlook configurations
- Add robust error handling and logging
- Provide manual ICS file upload as fallback

### Risk 2: Bases API Changes
**Risk:** Bases plugin may update API in future
**Mitigation:**
- Use only public API (1.10.0+)
- Version check for Bases plugin
- Graceful degradation if Bases not installed

### Risk 3: MCP Server Vault Conflicts
**Risk:** MCP server may conflict with plugin when both access vault
**Mitigation:**
- File locking strategy
- Debounced file watching
- Event-based synchronization
- Read-only mode for MCP server (optional setting)

### Risk 4: Performance with Large Vaults
**Risk:** JIT pattern may be slow with 10,000+ tasks
**Mitigation:**
- Profile performance with large test vault
- Add optional indexing cache if needed
- Limit Bases queries to filtered subsets
- Paginate MCP list_tasks results

---

## Appendix A: File Structure

```
obsidian-task-plugin/
├── src/
│   ├── main.ts                          # Plugin entry point
│   ├── types.ts                         # Core type definitions
│   ├── utils/
│   │   ├── TaskManager.ts              # JIT data access (~400 lines)
│   │   ├── dateUtils.ts                # Date utilities (from TaskNotes)
│   │   └── helpers.ts                  # General utilities
│   ├── services/
│   │   ├── TaskService.ts              # CRUD operations (~600 lines)
│   │   ├── FieldMapper.ts              # Property mapping (~300 lines)
│   │   ├── CalendarImportService.ts    # Meeting import (~300 lines)
│   │   ├── ICSSubscriptionService.ts   # ICS parsing (from TaskNotes)
│   │   └── InstantTaskConvertService.ts # Checkbox conversion (~400 lines)
│   ├── editor/
│   │   └── InstantConvertButtons.ts    # CodeMirror widget (~270 lines)
│   ├── bases/
│   │   ├── BasesDataAdapter.ts         # Bases API wrapper (~150 lines)
│   │   └── PropertyMappingService.ts   # Property mapping (~200 lines)
│   ├── settings/
│   │   ├── settings.ts                 # Settings interface
│   │   ├── defaults.ts                 # Default values
│   │   └── SettingTab.ts               # Settings UI
│   └── styles.css                      # Plugin styles
├── tasknotes-mcp/                       # Separate MCP server project
│   ├── src/
│   │   ├── index.ts                    # MCP server entry
│   │   ├── tools/
│   │   │   ├── listTasks.ts
│   │   │   ├── createTask.ts
│   │   │   ├── updateTask.ts
│   │   │   ├── readTask.ts
│   │   │   ├── deleteTask.ts
│   │   │   └── bulkOperations.ts
│   │   ├── services/
│   │   │   ├── VaultScanner.ts
│   │   │   ├── TaskCache.ts
│   │   │   └── FileWatcher.ts
│   │   └── utils/
│   │       └── frontmatterParser.ts
│   ├── config.json                     # MCP server config
│   ├── package.json
│   └── tsconfig.json
├── manifest.json
├── package.json
├── tsconfig.json
├── esbuild.config.mjs
└── README.md
```

---

## Appendix B: Example Task Note

**File:** `Tasks/Follow up with Sarah.md`

```yaml
---
complete: false
due: 2025-11-08
projects:
  - "[[Client Alpha]]"
  - "[[Q4 Planning]]"
tags:
  - task
  - work
statusDescription: "waiting for her response on proposal"
---

# Follow up with Sarah

Meeting notes from 2025-11-06:
- She needs time to review the proposal
- Expected response by end of week
- Follow up if no response by Friday
```

---

## Appendix C: Example Daily Note with Imported Meetings

**File:** `Daily Notes/2025-11-06.md`

```markdown
# 2025-11-06

## 🌅 Morning Routine
- [x] Review calendar
- [x] Check emails

#### 📆 Agenda
- [[Weekly Standup]]
- [[Client Alpha - Q4 Planning Session]]
- [[1-1 with Sarah]]
- [[Team Retrospective]]

## 📝 Notes
During [[Weekly Standup]]:
- [ ] [[Follow up with Sarah on proposal]]
- [ ] [[Review Q4 budget numbers]]

## ✅ Tasks Completed Today
- [x] [[Finish presentation slides]]
- [x] [[Send proposal to Client Alpha]]

## 🎯 Tomorrow
- [ ] [[Prepare for board meeting]]
```

---

## Appendix D: MCP Server Configuration

**File:** `~/.config/claude/mcp.json` (Claude Desktop)

```json
{
  "mcpServers": {
    "tasknotes": {
      "command": "node",
      "args": ["/path/to/tasknotes-mcp/dist/index.js"],
      "env": {
        "VAULT_PATH": "/Users/alex/Documents/Obsidian/MyVault",
        "TASK_FOLDER": "Tasks",
        "TASK_TAG": "task"
      }
    }
  }
}
```

**Example MCP Interactions:**

```
User: What are my work tasks due this week?

Claude: <thinking>I'll use the tasknotes MCP server to list work tasks due this week</thinking>

<function_calls>
<invoke name="list_tasks">
<parameter name="tags">["work"]</parameter>
<parameter name="due_before">2025-11-13</parameter>
<parameter name="complete">false</parameter>
</invoke>
</function_calls>

You have 5 work tasks due this week:

1. **Follow up with Sarah** - Due: 2025-11-08 (Friday)
   - Projects: Client Alpha, Q4 Planning
   - Status: waiting for her response on proposal

2. **Review Q4 budget numbers** - Due: 2025-11-09 (Saturday)
   - Projects: Finance

[...]
```

---

## Appendix E: Forbidden Character Mapping Table

| Input Character | Replacement | Reason |
|-----------------|-------------|--------|
| `[` | `-` | Obsidian wikilink syntax conflict |
| `]` | `-` | Obsidian wikilink syntax conflict |
| `#` | `-` | Obsidian tag syntax conflict |
| `^` | `-` | Obsidian block reference conflict |
| `\|` | `-` | Obsidian embed/alias syntax conflict |
| `*` | `-` | Markdown emphasis, filesystem issues |
| `"` | `'` | Windows filename issues |
| `\` | `-` | Windows path separator |
| `/` | `-` | Unix path separator |
| `<` | `(` | Windows filename issues |
| `>` | `)` | Windows filename issues |
| `:` | `-` | Windows drive letter separator |
| `?` | `` (remove) | Windows filename issues |

**Example Transformation:**
```
Input:  "Q4 Planning: Review <Budget> #Final"
Output: "Q4 Planning- Review (Budget) -Final"
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-06 | Initial PRD approved |

---

**Next Steps:** Begin Phase 1 implementation upon approval.
