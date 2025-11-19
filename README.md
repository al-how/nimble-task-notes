# Lightweight Tasks

A focused task management plugin for Obsidian that integrates with your Outlook calendar and makes task creation effortless with natural language date parsing.

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

**Phases 1-4 & 7 (Optimization/Testing)**: ✅ **Complete**

- ✅ Phase 1: Project Setup
- ✅ Phase 2: Core Infrastructure (TaskManager, TaskService, FieldMapper)
- ✅ Phase 3: Calendar Integration (ICS import, meeting wikilinks)
- ✅ Phase 4: Inline Task Conversion (checkbox-to-task with NLP dates)
- ✅ Phase 7: Optimization & Testing (lazy loading, 104 unit tests, documentation)
- ⏳ Phase 5: Bases Integration (planned)
- ⏳ Phase 6: MCP Server (planned)

## Installation

### Manual Installation (From Release)

1. Download the latest release from the [Releases](https://github.com/yourusername/lightweight-tasks/releases) page
2. Extract the files to your Obsidian vault's `.obsidian/plugins/lightweight-tasks/` folder
3. Reload Obsidian
4. Enable "Lightweight Tasks" in Settings → Community Plugins

### Manual Installation (Build From Source)

If you want to install the latest development version in your live vault:

```bash
# Clone the repository
git clone https://github.com/yourusername/lightweight-tasks.git
cd lightweight-tasks

# Install dependencies
npm install

# Build production version
npm run build:deploy
```

**Important**: By default, this copies to `~/testvault/test/.obsidian/plugins/lightweight-tasks`.

To deploy to your **live vault**, create a `.copy-files.local` file in the project root with your vault path:

```
C:\path\to\your\vault\.obsidian\plugins\lightweight-tasks
```

Or on Mac/Linux:
```
/Users/yourname/Documents/MyVault/.obsidian/plugins/lightweight-tasks
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

After deployment, reload Obsidian and enable "Lightweight Tasks" in Settings → Community Plugins.

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

Access plugin settings via Settings → Lightweight Tasks:

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

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone https://github.com/yourusername/lightweight-tasks.git
   cd lightweight-tasks
   ```

2. **Install Node.js 20.x** (see Prerequisites above)

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Configure test vault path** (environment-specific):

   Create a `.copy-files.local` file in the project root with your vault path:

   **Windows example**:
   ```
   C:\Users\YourName\Documents\Obsidian\TestVault\.obsidian\plugins\lightweight-tasks
   ```

   **Linux/Docker example**:
   ```
   /config/workspace/testvault/test/.obsidian/plugins/lightweight-tasks
   ```

   **Note**: `.copy-files.local` is gitignored, so each environment has its own configuration without conflicts.

5. **Verify the setup**:
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
/path/to/your/vault/.obsidian/plugins/lightweight-tasks
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

### Comparison with TaskNotes

This plugin is inspired by TaskNotes but significantly simplified:

| Feature | TaskNotes | Lightweight Tasks |
|---------|-----------|------------------|
| Lines of code | ~20,000 | ~2,500 |
| Load time | 2-5 seconds | <100ms |
| Bundle size | ~600KB | 384KB |
| Task tracking | ✅ | ✅ |
| Calendar import | ✅ | ✅ |
| Custom views | ✅ | ❌ (Use Bases plugin) |
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

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass (`npm test`)
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Credits

- Inspired by [TaskNotes](https://github.com/jasonmotylinski/tasknotes)
- Uses [chrono-node](https://github.com/wanasit/chrono) for natural language date parsing
- Uses [ical.js](https://github.com/kewisch/ical.js) for calendar parsing

## Support

- 🐛 [Report bugs](https://github.com/yourusername/lightweight-tasks/issues)
- 💡 [Request features](https://github.com/yourusername/lightweight-tasks/issues)
- 📖 [Read documentation](https://github.com/yourusername/lightweight-tasks/wiki)
