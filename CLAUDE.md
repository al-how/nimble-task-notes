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

**Current Phase**: Phase 3 Complete ✅

- ✅ Phase 1: Project Setup (COMPLETE)
- ✅ Phase 2: Core Infrastructure (COMPLETE)
- ✅ Phase 3: Calendar Integration (COMPLETE)
- ⏳ Phase 4: Inline Task Conversion
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

### Plugin Infrastructure
- [src/main.ts](src/main.ts) - Plugin entry point with service initialization (~60 lines)
- [src/types.ts](src/types.ts) - Core type definitions
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
- **Current**: ~1,594 lines (Phase 1 + Phase 2 + Phase 3 complete)
  - Phase 1: ~284 lines (types, settings, UI)
  - Phase 2: ~815 lines (TaskManager, TaskService, FieldMapper)
  - Phase 3: ~443 lines (ICSSubscriptionService, CalendarImportService, EventEmitter)
- **Remaining**: ~2,906 lines for Phases 4-7

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

## Testing

Tests will be added in Phase 7. Use manual testing during development.

**Verification Steps for Phase 2**:
1. Create task files with proper frontmatter
2. Use TaskService to create/update/delete tasks
3. Verify frontmatter is preserved on updates
4. Check event emissions (EVENT_TASK_CREATED, etc.)
5. Test filename sanitization with special characters
6. Verify Windows reserved name handling

## Important Notes

- Always use tag `#task` to identify task files
- Calendar imports go under `#### 📆 Agenda` heading
- Filename sanitization must handle Windows reserved names (CON, PRN, etc.)
- Natural language date parsing via chrono-node (lazy loaded)
- MCP server is a separate Node.js project (not part of plugin)
