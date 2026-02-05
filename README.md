# Nimble Task Notes

A fast, focused task note management plugin for Obsidian that integrates with your Outlook calendar and makes task creation effortless with natural language date parsing.

![Demo](assets/demo.gif)

> **Note**: This is a personal project that I vibe coded to scratch my own itch. It's actively maintained and I use it daily, but it's experimental and has no formal release schedule. Feedback and contributions are very welcome! 🙂

## Why I Made This

I wanted note-based task management that would work seamlessly with the [Bases plugin](https://github.com/SkepticMystic/obsidian-base-plugin) for custom views. I tried a few other task plugins but found them either too complex or missing key features I needed. Many have 20,000+ lines of code with time tracking, Pomodoro timers, recurring tasks, dependency tracking, webhooks, and built-in custom views.

I just needed the essentials:
- Convert checkboxes to task files with natural language dates
- Import calendar meetings into daily notes
- Associate tasks with projects
- Keep it simple, fast, and ready for LLM integration via MCP

So I built this: a lightweight alternative focused on doing a few things really well. ~2,500 lines of code, loads in under 100ms, and plays nicely with the ecosystem of Obsidian plugins instead of reinventing the wheel.

## Features

### 📅 Calendar Integration
- Import meetings from Outlook calendar (ICS feed) directly into your daily notes
- Automatic meeting detection and wikilink creation
- Meetings appear under `#### 📆 Agenda` heading in your notes

### ✅ Quick Task Conversion
- Convert any checkbox into a task file with `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)
- Natural language date parsing: "friday", "tomorrow", "nov 15", "in 2 weeks"
- Preserves checkbox state (checked/unchecked)
- Automatic task file creation with proper frontmatter

### 🏷️ Task Properties
Tasks are stored as individual markdown files with YAML frontmatter:

```yaml
---
taskStatus: false
due: 2025-11-15
completed: null  # Auto-populated when task marked complete
projects: ["[[Client Alpha]]", "[[Marketing]]"]
tags: [task, urgent]
statusDescription: "Waiting for approval"
---
```

**Auto-Completion Date**: When you mark a task as complete in Obsidian's properties panel, the `completed` property automatically populates with today's date. Mark it incomplete, and the date clears automatically.

### 🚀 Performance Optimized
- **Instant load time**: < 100ms plugin startup (50x faster than before optimization)
- **Lazy loading**: Services only load when you actually use them
- **Small footprint**: 384KB bundle size (23% under budget)
- **Efficient data access**: No caching overhead, reads directly from Obsidian's metadata cache

## Current Status

**Core Features Complete** ✅

- ✅ Project Setup
- ✅ Core Infrastructure (TaskManager, TaskService, FieldMapper)
- ✅ Calendar Integration (ICS import, meeting wikilinks)
- ✅ Inline Task Conversion (checkbox-to-task with NLP dates)
- ✅ Optimization & Testing (lazy loading, 104 unit tests, documentation)

All the essential features are working and stable. I use this daily in my own vault.

## Installation

### Installation via BRAT (Recommended)

Since there are no official releases yet, the easiest way to install is via [BRAT (Beta Reviewers Auto-update Tool)](https://github.com/TfTHacker/obsidian42-brat):

1. Install the BRAT plugin from Obsidian's Community Plugins
2. Open Settings → BRAT → "Add Beta plugin"
3. Enter: `al-how/nimble-task-notes`
4. Click "Add Plugin"
5. Enable "Nimble Task Notes" in Settings → Community Plugins

BRAT will automatically keep the plugin updated from the main branch.

### Manual Installation (Build From Source)

If you want to install the latest development version in your live vault:

```bash
# Clone the repository
git clone https://github.com/al-how/nimble-task-notes.git
cd nimble-task-notes

# Install dependencies
npm install

# Build production version
npm run build:deploy
```

**Important**: By default, this copies to `~/testvault/test/.obsidian/plugins/nimble-task-notes`.

To deploy to your **live vault**, create a `.copy-files.local` file in the project root with your vault path:

```
C:\path\to\your\vault\.obsidian\plugins\nimble-task-notes
```

Or on Mac/Linux:
```
/Users/yourname/Documents/MyVault/.obsidian/plugins/nimble-task-notes
```

Then run:
```bash
npm run build:deploy
```

This will:
1. Run type checking
2. Build optimized production bundle (384KB, no source maps)
3. Copy `main.js` and `manifest.json` to your vault
4. Your vault will have only 2-3 files (~388KB total)

After deployment, reload Obsidian and enable "Nimble Task Notes" in Settings → Community Plugins.

### Development Installation (Test Vault)

For development with automatic reloading:

```bash
# Build and copy to test vault (includes source maps for debugging)
npm run dev

# Or watch for changes (rebuilds on file save)
npm run dev:watch
```

**Note**: Development builds include source maps and are larger (~3MB). Use `npm run build:deploy` for production deployments.

## Usage

### Converting Checkboxes to Tasks

1. Type a checkbox in any note:
   ```
   - [ ] Review pull request
   ```

2. Place your cursor on the checkbox line and press `Ctrl+Enter` (or `Cmd+Enter` on Mac)

3. A modal will appear asking for:
   - **Due date** (optional): Use natural language like "friday" or YYYY-MM-DD format
   - **Projects** (optional): Comma-separated list (auto-wrapped in wikilinks)

4. Press Enter to create the task. The checkbox becomes a wikilink:
   ```
   - [ ] [[Review pull request]]
   ```

5. A new task file is created in your tasks folder with all the metadata

### Importing Calendar Meetings

1. Configure your Outlook calendar ICS feed URL in plugin settings
2. Open your daily note
3. Run command: "Import today's meetings" (or use ribbon icon)
4. Meetings appear as wikilinks under the `#### 📆 Agenda` heading

### Natural Language Date Examples

The plugin understands many natural language date expressions:

- **Relative**: "tomorrow", "next week", "in 3 days"
- **Day names**: "monday", "friday", "next tuesday"
- **Dates**: "nov 15", "november 15th", "11/15"
- **Specific**: "2025-11-15" (YYYY-MM-DD format)

## Configuration

### Settings

Access plugin settings via Settings → Nimble Task Notes:

#### Calendar Settings
- **ICS Subscription URL**: Your Outlook calendar ICS feed URL
- **Refresh Interval**: How often to fetch calendar updates (default: 15 minutes)
- **Meeting Folder**: Where to store meeting note files

#### Task Settings
- **Task Folder**: Where to create task files (default: `Tasks/`)
- **Default Tags**: Tags to add to new tasks (default: `["task"]`)

#### Property Configuration
All task frontmatter property names are configurable:
- **Status Property**: Name for task completion status (default: `taskStatus`)
- **Due Date Property**: Name for due date (default: `due`)
- **Completion Date Property**: Name for auto-populated completion date (default: `completed`)
- **Projects Property**: Name for project wikilinks (default: `projects`)
- **Tags Property**: Name for tags array (default: `tags`)
- **Status Description Property**: Name for status notes (default: `statusDescription`)

This allows you to customize property names to match your existing vault structure or preferences.

### Finding Your Outlook ICS URL

1. Open Outlook Web App
2. Go to Calendar → Settings → Shared Calendars
3. Click "Publish a calendar"
4. Select "Can view all details" and copy the ICS URL
5. Paste into plugin settings

## Development

### Prerequisites

This project requires **Node.js 20.x (LTS)**. The version is specified in `.nvmrc` for consistency across environments.

**Install Node.js 20.x**:
- Using nvm (Windows/Mac/Linux): `nvm install` (reads from .nvmrc)
- Using fnm (alternative): `fnm install` (reads from .nvmrc)
- Manual download: [Node.js 20.x LTS](https://nodejs.org/)

### Dual-Environment Development (Windows + Linux)

This project is configured to work seamlessly in both Windows and Linux (Docker container) environments.

**Cross-Platform Features**:
- ✅ `.nvmrc` - Ensures consistent Node.js 20.x across environments
- ✅ `.gitattributes` - Normalizes line endings to LF (prevents CRLF/LF conflicts)
- ✅ `.editorconfig` - Standardizes editor behavior (tabs, line endings, charset)
- ✅ `.vscode/` - Shared VSCode settings for consistent formatting and linting

**Setting Up Each Environment**:

1. **Install Node.js 20.x** (see Prerequisites above)

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure test vault path** (environment-specific):

   Create a `.copy-files.local` file in the project root with your vault path:

   **Windows example**:
   ```
   C:\Users\YourName\Documents\Obsidian\TestVault\.obsidian\plugins\nimble-task-notes
   ```

   **Linux/Docker example**:
   ```
   /config/workspace/testvault/test/.obsidian/plugins/nimble-task-notes
   ```

   **Note**: `.copy-files.local` is gitignored, so each environment has its own configuration without conflicts.

4. **Verify the setup**:
   ```bash
   npm run build        # Should build successfully
   npm test             # Should pass all 104 tests
   npm run dev          # Should copy to your configured vault
   ```

**Switching Between Environments**:
- Git will handle line endings automatically (thanks to `.gitattributes`)
- Code formatting is consistent across environments (thanks to `.editorconfig` and `.vscode/settings.json`)
- Each environment uses its own `.copy-files.local` for vault paths
- All npm scripts work identically on Windows and Linux

**Clone the repository**:
```bash
git clone https://github.com/al-how/nimble-task-notes.git
cd nimble-task-notes
```

### Build Commands

```bash
# Development build (builds and copies to test vault)
npm run dev

# Development with watch mode
npm run dev:watch

# Production build (type checks, builds, minifies)
npm run build

# Type checking only
npm run typecheck

# Run tests
npm test

# Run tests with coverage
npm test:coverage

# Run tests in watch mode
npm test:watch

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:check
```

### Testing

The plugin includes comprehensive unit tests (104 tests total):

- **TaskManager**: 29 tests covering all query methods
- **FieldMapper**: 30 tests for property mapping and validation
- **ServiceContainer**: 25 tests for lazy loading and memory management
- **NaturalLanguageParser**: 20 tests for date parsing

Run tests with:

```bash
npm test
```

### Test Vault Configuration

By default, the plugin copies to `~/testvault/test/.obsidian/plugins/lightweight-tasks`.

To use a different vault, create a `.copy-files.local` file with your vault path:

```
/path/to/your/vault/.obsidian/plugins/nimble-task-notes
```

## Architecture

### Core Components

- **TaskManager**: Just-in-time data access from Obsidian's metadata cache
- **TaskService**: CRUD operations for task files
- **FieldMapper**: Converts between TaskInfo objects and frontmatter
- **ServiceContainer**: Lazy-loading dependency injection container
- **NaturalLanguageParser**: Parses natural language dates using chrono-node
- **TaskConversionService**: Orchestrates checkbox-to-task conversion
- **ICSSubscriptionService**: Fetches and caches calendar events
- **CalendarImportService**: Imports meetings into daily notes

### Performance Features

The plugin uses several optimization techniques:

1. **Lazy Service Container**: Services instantiated only when first used
2. **Lazy Library Loading**: Heavy libraries (ical.js, chrono-node) loaded on-demand
3. **JIT Data Access**: No internal caching, reads fresh from metadata cache
4. **Deferred Initialization**: Calendar fetching happens in background, doesn't block startup

### What Makes This Different

This plugin takes a minimalist approach compared to full-featured task management plugins:

| Feature | Full-Featured Plugins | Nimble Task Notes |
|---------|-----------|------------------|
| Lines of code | ~20,000+ | ~2,500 |
| Load time | 2-5 seconds | <100ms |
| Bundle size | ~600KB+ | 384KB |
| Task tracking | ✅ | ✅ |
| Calendar import | ✅ | ✅ |
| Natural language dates | ❌ | ✅ |
| Auto-completion dates | ❌ | ✅ |
| Configurable properties | ❌ | ✅ |
| Custom views | ✅ Built-in | Use Bases plugin |
| Time tracking | ✅ | ❌ |
| Pomodoro | ✅ | ❌ |
| Recurring tasks | ✅ | ❌ |
| Dependencies | ✅ | ❌ |
| Webhook integration | ✅ | ❌ |

**Philosophy**: Keep the plugin focused on core task management. Use the Obsidian Bases plugin for custom views instead of building them into the task plugin.

## Troubleshooting

### Calendar import not working

1. Verify your ICS URL is correct in settings
2. Check that the URL is publicly accessible
3. Look for errors in Developer Console (Ctrl+Shift+I)
4. Try refreshing manually with "Import today's meetings" command

### Tasks not appearing

1. Ensure task files have the `task` tag in frontmatter
2. Check that frontmatter is valid YAML
3. Verify file is in a markdown file (`.md` extension)
4. Reload Obsidian to refresh metadata cache

### Natural language dates not working

If natural language parsing fails, the plugin falls back to strict YYYY-MM-DD format. Check the console for any chrono-node loading errors.

## Contributing

Contributions are very welcome! This is a personal project but I'm happy to collaborate. Please:

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass (`npm test`)
5. Submit a pull request

Feel free to open an issue first if you want to discuss a feature or major change.

## License

MIT License - see LICENSE file for details

## Credits

- Uses [chrono-node](https://github.com/wanasit/chrono) for natural language date parsing
- Uses [ical.js](https://github.com/kewisch/ical.js) for calendar parsing
- Inspired by the Obsidian task management plugin ecosystem

## Support

- 🐛 [Report bugs](https://github.com/al-how/nimble-task-notes/issues)
- 💡 [Request features](https://github.com/al-how/nimble-task-notes/issues)
- 📖 [Documentation](https://github.com/al-how/nimble-task-notes)
