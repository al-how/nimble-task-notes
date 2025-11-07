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

**Current Phase**: Phase 1 Complete ✅

- ✅ Phase 1: Project Setup (COMPLETE)
- ⏳ Phase 2: Core Infrastructure (TaskManager, TaskService, FieldMapper)
- ⏳ Phase 3: Calendar Integration
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

- [src/main.ts](src/main.ts) - Plugin entry point (~45 lines currently)
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
- **Current**: ~550 lines (Phase 1 complete)
- **Remaining**: 3,950 lines for Phases 2-7

## Testing

Tests will be added in Phase 7. Use manual testing during development.

## Important Notes

- Always use tag `#task` to identify task files
- Calendar imports go under `#### 📆 Agenda` heading
- Filename sanitization must handle Windows reserved names (CON, PRN, etc.)
- Natural language date parsing via chrono-node (lazy loaded)
- MCP server is a separate Node.js project (not part of plugin)
