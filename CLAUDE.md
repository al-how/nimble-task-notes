# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

Lightweight Task Manager is a focused Obsidian plugin for task management. It's an 80% smaller alternative to TaskNotes (~4,500 vs ~20,000 lines), focusing on:
- Calendar integration for meeting note creation from Outlook
- Inline task conversion with natural language date parsing
- Bases plugin integration (no custom views)
- MCP server for LLM task management

See [docs/PRD-Lightweight-Task-Plugin.md](docs/PRD-Lightweight-Task-Plugin.md) for complete requirements.

## Build Commands

```bash
# Development build (builds and copies to test vault)
npm run dev

# Development with watch mode
npm run dev:watch

# Production build (type checks, builds, minifies)
npm run build

# Type checking only
npm run typecheck

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:check
```

## Project Status

**Current Phase**: Phase 4 Complete ✅

- ✅ Phase 1: Project Setup (COMPLETE)
- ✅ Phase 2: Core Infrastructure (COMPLETE)
- ✅ Phase 3: Calendar Integration (COMPLETE)
- ✅ Phase 4: Inline Task Conversion (COMPLETE)
- ⏳ Phase 5: Bases Integration
- ⏳ Phase 6: MCP Server
- ⏳ Phase 7: Testing & Polish

## Architecture Overview

### Simplified vs TaskNotes

This plugin is built from scratch with only essential features:

**What we KEEP from TaskNotes:**
- TaskManager (JIT data access, simplified to ~400 lines)
- TaskService (CRUD operations, simplified to ~600 lines)
- FieldMapper (property mapping, ~300 lines)
- ICSSubscriptionService (calendar parsing)
- BasesDataAdapter (Bases integration)
- Date utilities and natural language parsing

**What we REMOVE from TaskNotes:**
- ❌ Time tracking and Pomodoro features
- ❌ Custom calendar/kanban/list views
- ❌ Recurring task complexity (rrule)
- ❌ Dependency tracking
- ❌ Advanced filtering UI
- ❌ Webhook integration
- ❌ Custom property name mapping

### Core Architecture Decisions

1. **Tag-based task identification**: Files with `#task` tag in frontmatter
2. **Synchronous data access**: TaskManager reads from metadata cache without async overhead
3. **Modal-based prompts**: Use Obsidian's Modal class instead of CodeMirror widgets
4. **No checkbox sync**: Interactive widgets show status, but checkboxes don't bidirectionally sync
5. **HTTP API for MCP**: MCP server calls plugin API instead of direct file access

## Key Files

### Phase 2 Core Services
- [src/utils/TaskManager.ts](src/utils/TaskManager.ts) - JIT data access layer (~291 lines)
- [src/services/TaskService.ts](src/services/TaskService.ts) - CRUD operations (~274 lines)
- [src/services/FieldMapper.ts](src/services/FieldMapper.ts) - Property mapping (~190 lines)

### Phase 3 Calendar Services
- [src/services/ICSSubscriptionService.ts](src/services/ICSSubscriptionService.ts) - Calendar event fetching (~208 lines)
- [src/services/CalendarImportService.ts](src/services/CalendarImportService.ts) - Meeting import (~194 lines)
- [src/utils/EventEmitter.ts](src/utils/EventEmitter.ts) - Event-driven pub/sub (~41 lines)

### Phase 4 Task Conversion Services
- [src/services/NaturalLanguageParser.ts](src/services/NaturalLanguageParser.ts) - Date parsing with chrono-node (~147 lines)
- [src/modals/TaskCreationModal.ts](src/modals/TaskCreationModal.ts) - Task metadata input modal (~280 lines)
- [src/services/TaskConversionService.ts](src/services/TaskConversionService.ts) - Checkbox-to-task conversion (~235 lines)

### Plugin Infrastructure
- [src/main.ts](src/main.ts) - Plugin entry point with service initialization (~90 lines)
- [src/types.ts](src/types.ts) - Core type definitions (~174 lines)
- [src/settings/SettingTab.ts](src/settings/SettingTab.ts) - Settings UI
- [src/settings/defaults.ts](src/settings/defaults.ts) - Default configuration
- [docs/PRD-Lightweight-Task-Plugin.md](docs/PRD-Lightweight-Task-Plugin.md) - Full requirements

## Task Properties Model

```yaml
---
complete: false          # Boolean
due: 2025-11-08         # YYYY-MM-DD or null
projects: ["[[Client Alpha]]"]  # Array of wikilinks
tags: [task]            # Always includes 'task'
statusDescription: ""   # Free text
---
```

## Development Workflow

1. Make changes in `src/`
2. Run `npm run dev` to build and copy to test vault
3. Reload Obsidian plugin (Ctrl+R in dev mode)
4. Check console for errors
5. Test in Obsidian

## Code Size Budget

- **Target**: 4,500 lines total
- **Current**: ~2,344 lines (Phase 1-4 complete)
  - Phase 1: ~284 lines (types, settings, UI)
  - Phase 2: ~815 lines (TaskManager, TaskService, FieldMapper)
  - Phase 3: ~443 lines (ICSSubscriptionService, CalendarImportService, EventEmitter)
  - Phase 4: ~802 lines (NaturalLanguageParser, TaskCreationModal, TaskConversionService)
- **Remaining**: ~2,156 lines for Phases 5-7

## Phase 3 Implementation Details

### ICSSubscriptionService (src/services/ICSSubscriptionService.ts)
- **Purpose**: Fetch and cache calendar events from Outlook ICS feed
- **Design**: Simplified from TaskNotes (694 → 208 lines)
- **Key Methods**:
  - `initialize()` - Start refresh timer
  - `fetchSubscription()` - Fetch from URL, parse, cache
  - `getAllEvents()` - Return cached events (with grace period)
- **Caching**: 15-minute expiration + 5-minute grace period
- **Architecture**: Extends EventEmitter for event-driven pattern
- **Features**: VTIMEZONE support, all-day detection, RRULE expansion (1-year, max 100 instances)
- **Simplifications**: No EXDATE/RECURRENCE-ID, no local files, no multi-subscription UI

### CalendarImportService (src/services/CalendarImportService.ts)
- **Purpose**: Import calendar meetings into daily notes as wikilinks
- **Key Methods**:
  - `importTodaysMeetings(activeNote)` - Main entry point
  - `findAgendaHeading(content)` - Locate "#### 📆 Agenda" heading
  - `sanitizeMeetingTitle(title)` - Safe filename conversion
  - `extractWikilinksUnderHeading(content, headingIndex)` - Deduplication
  - `insertWikilinksAtHeading(content, headingIndex, wikilinks)` - Update note
- **Sanitization Rules**: Obsidian syntax, filesystem forbidden chars, Windows reserved names
- **Deduplication**: Check existing wikilinks before insertion
- **Error Handling**: User notices for missing heading, network errors, invalid ICS, no meetings

### EventEmitter (src/utils/EventEmitter.ts)
- **Purpose**: Simple pub/sub for service communication
- **Methods**: `on()`, `emit()`, `removeAllListeners()`
- **Usage**: ICSSubscriptionService emits 'data-changed' events

## Phase 2 Implementation Details

### TaskManager (src/utils/TaskManager.ts)
- **Purpose**: Just-In-Time data access layer for reading task information
- **Design**: Synchronous queries from Obsidian's MetadataCache (no async overhead)
- **Key Methods**:
  - `getAllTasks()` - Get all tasks in vault
  - `getTaskInfo(path)` - Get single task info
  - `getTasksForDate(date)` - Filter by due date
  - `getTasksDueInRange(start, end)` - Date range queries
  - `getIncompleteTasks()`, `getCompleteTasks()`, `getOverdueTasks()`
  - `getTasksForProject()`, `getTasksWithTag()`
- **Architecture**: Extends EventEmitter for event-driven patterns
- **No Internal Caching**: All queries read fresh from metadata cache

### TaskService (src/services/TaskService.ts)
- **Purpose**: CRUD operations and file management
- **Key Methods**:
  - `createTask(data)` - Create new task file with frontmatter
  - `updateTask(path, updates)` - Modify task properties
  - `deleteTask(path)` - Delete task file
  - `updateTaskStatus()`, `updateTaskProjects()`, `updateTaskDueDate()` - Convenience methods
- **Filename Handling**:
  - Sanitizes forbidden characters: [#^|] → `-`, * → `-`, " → `'`, etc.
  - Handles Windows reserved names (CON, PRN, AUX, NUL, COM1-9, LPT1-9)
  - Enforces max 200 character limit
  - Generates unique filenames with counter suffix
- **Frontmatter Management**: Uses YAML library for parsing/generation
- **Error Handling**: Proper try/catch with user-facing notices

### FieldMapper (src/services/FieldMapper.ts)
- **Purpose**: Property mapping between TaskInfo and frontmatter
- **Key Methods**:
  - `mapTaskInfoToFrontmatter(task)` - Convert to frontmatter format
  - `mapFrontmatterToTaskInfo(frontmatter, path)` - Parse to TaskInfo
  - `validateTaskFrontmatter(frontmatter)` - Validate structure and types
  - `createDefaultFrontmatter(partial)` - Create with defaults
- **Validation Rules**:
  - Must have `task` tag in tags array
  - `complete`: boolean only
  - `due`: YYYY-MM-DD date string or null
  - `projects`: array of wikilinks ([[Name]] format)
  - `tags`: string array (always includes "task")
  - `statusDescription`: any string

## Phase 4 Implementation Details

### NaturalLanguageParser (src/services/NaturalLanguageParser.ts)
- **Purpose**: Parse natural language date expressions using chrono-node
- **Design**: Lazy loading pattern to reduce initial bundle size (~100KB saved)
- **Key Methods**:
  - `parseDate(input)` - Parse natural language or YYYY-MM-DD dates
  - `formatDatePreview(input)` - Format as "📅 Fri, Nov 8, 2025"
  - `formatDateForFrontmatter(date)` - Convert Date to YYYY-MM-DD
  - `parseDateStrict(input)` - Fallback YYYY-MM-DD parser
- **Natural Language Examples**: "friday", "tomorrow", "nov 15", "in 2 weeks", "next monday"
- **Fallback Behavior**: If chrono-node fails to load, falls back to strict YYYY-MM-DD parsing
- **Error Handling**: Returns null for invalid dates, shows notice if chrono fails to load

### TaskCreationModal (src/modals/TaskCreationModal.ts)
- **Purpose**: Modal UI for gathering task metadata during conversion
- **Architecture**: Extends Obsidian's Modal class (not CodeMirror widget per PRD 2.2)
- **Form Fields**:
  - Due date input (auto-focused, with live preview)
  - Project input (comma-separated wikilinks, auto-wraps in [[]])
- **Live Date Preview**: Updates as user types, shows formatted preview below input
- **Keyboard Navigation**:
  - Tab: Move to next field
  - Shift+Tab: Move to previous field
  - Enter: Submit form from any field
  - Esc: Cancel and close modal
- **Project Parsing**: Accepts "Project A, Project B" or "[[Project A]], [[Project B]]"
- **Error Display**: Shows inline error for invalid date input, keeps modal open
- **Promise-Based**: `waitForResult()` returns Promise<TaskCreationModalResult | null>

### TaskConversionService (src/services/TaskConversionService.ts)
- **Purpose**: Orchestrate checkbox-to-task conversion workflow
- **Main Entry Point**: `convertCheckboxToTask(editor, lineNumber)`
- **Conversion Flow**:
  1. Extract checkbox data from line (pattern: `- [x] Title`)
  2. Validate line is a checkbox (not already a wikilink)
  3. Show TaskCreationModal to gather metadata
  4. Create task file via TaskService
  5. Replace editor line with wikilink using transaction
  6. Show success notice
- **Key Methods**:
  - `extractCheckboxData(line)` - Parse checkbox pattern with regex
  - `showTaskCreationModal(data)` - Display modal and wait for result
  - `createTaskFromModal(checkboxData, modalResult)` - Build TaskCreationData and create file
  - `replaceLineWithWikilink(editor, lineNumber, data, title)` - Use editor.transaction() for undo support
- **Edge Cases Handled**:
  - Empty title → "Untitled Task"
  - Line already has wikilink → show notice, don't convert
  - User cancels modal → keep original checkbox
  - Task creation fails → show error, don't modify line
- **Undo/Redo**: Uses `editor.transaction()` for proper undo stack integration
- **Checkbox Status Preservation**: `[x]` → `- [x] [[Task]]`, `[ ]` → `- [ ] [[Task]]`

### Integration in main.ts
- **Services Initialized**: NaturalLanguageParser, TaskConversionService
- **Command Added**: "Convert checkbox to task" with Ctrl+Enter (Cmd+Enter on Mac) hotkey
- **Command Callback**: Calls `taskConversionService.convertCheckboxToTask(editor)`

## Testing

Tests will be added in Phase 7. Use manual testing during development.

**Verification Steps for Phase 2**:
1. Create task files with proper frontmatter
2. Use TaskService to create/update/delete tasks
3. Verify frontmatter is preserved on updates
4. Check event emissions (EVENT_TASK_CREATED, etc.)
5. Test filename sanitization with special characters
6. Verify Windows reserved name handling

**Verification Steps for Phase 4**:
1. Type `- [ ] Test task` in any note
2. Press Ctrl+Enter (Cmd+Enter on Mac) → modal opens
3. Enter "friday" in due date → preview shows next Friday's date
4. Tab to project field → enter "Project A, Project B"
5. Press Enter → task file created, line becomes `- [ ] [[Test task]]`
6. Verify task file has correct frontmatter (due date, projects as wikilinks)
7. Test with checked box: `- [x] Done task` → preserves [x] status
8. Test empty title: `- [ ]` → uses "Untitled Task"
9. Test cancel (Esc) → modal closes, checkbox unchanged
10. Test undo (Ctrl+Z) → line reverts to original checkbox
11. Test with existing wikilink: `- [ ] [[Existing]]` → shows notice "Already a task"
12. Test invalid date: enter "asdfasdf" → shows error, modal stays open
13. Test special characters in title: `Task: with <symbols> & #tags`
14. Test natural language dates: "tomorrow", "nov 15", "in 2 weeks"

## Important Notes

- Always use tag `#task` to identify task files
- Calendar imports go under `#### 📆 Agenda` heading
- Filename sanitization must handle Windows reserved names (CON, PRN, etc.)
- Natural language date parsing via chrono-node (lazy loaded)
- MCP server is a separate Node.js project (not part of plugin)
