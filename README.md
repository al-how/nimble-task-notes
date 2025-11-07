# Lightweight Task Manager

A focused Obsidian plugin for task management that eliminates bloat while preserving essential features.

## Features (Planned)

- **Calendar Integration**: One-click import of meetings from Outlook ICS feeds
- **Inline Task Creation**: Convert checkboxes to task notes with automatic metadata prompts
- **Project Association**: Link tasks to projects via wikilinks with backlink support
- **Bases Integration**: View and organize tasks using the Bases plugin
- **MCP Server**: Manage tasks via natural language through Claude and other LLMs

## Current Status

**Phase 1: Project Setup** ✅ Complete

The plugin infrastructure is ready. Basic plugin loading and settings are functional.

### Phase 2-7: Coming Soon

- Core services (TaskManager, TaskService)
- Calendar import from Outlook
- Inline task conversion
- Bases plugin integration
- MCP server for LLM access

## Development

### Prerequisites

- Node.js 16+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Development build (builds and copies to test vault)
npm run dev

# Watch mode
npm run dev:watch

# Production build
npm run build
```

### Test Vault Configuration

By default, the plugin copies to `~/testvault/test/.obsidian/plugins/lightweight-tasks`.

To use a different vault, create a `.copy-files.local` file with your vault path:

```
/path/to/your/vault/.obsidian/plugins/lightweight-tasks
```

## Architecture

- **80% smaller** than TaskNotes (~4,500 vs ~20,000 lines)
- **Calendar-first workflow** for meeting note creation
- **Bases-native views** (no custom view implementations)
- **LLM-ready** via dedicated MCP server
- **Simplified UX** with inline task widgets

## Roadmap

- [x] Phase 1: Project Setup
- [ ] Phase 2: Core Infrastructure
- [ ] Phase 3: Calendar Integration
- [ ] Phase 4: Auto-Prompt Task Creation
- [ ] Phase 5: Bases Integration
- [ ] Phase 6: MCP Server
- [ ] Phase 7: Testing & Polish

## License

MIT
