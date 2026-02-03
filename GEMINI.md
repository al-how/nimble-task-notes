# nimble-task-notes

## Project Overview

**Nimble Task Notes** is an Obsidian plugin designed to provide focused task note management features. It integrates with Outlook calendars via ICS feeds and offers natural language date parsing for effortless task creation. The plugin aims for high performance with lazy loading and direct metadata cache access.

### Key Features
*   **Calendar Integration:** Imports meetings from ICS feeds into daily notes.
*   **Task Conversion:** Converts markdown checkboxes into task files with metadata (frontmatter) using `Ctrl+Enter`.
*   **Natural Language Processing:** Parses dates (e.g., "tomorrow", "next friday") for task due dates.
*   **Performance:** Optimized with lazy service loading and minimal startup time.

### Architecture
The project follows a service-oriented architecture managed by a `ServiceContainer` for dependency injection and lazy loading.

*   **Entry Point:** `src/main.ts` (Plugin class, initializes `ServiceContainer`).
*   **Core Services:**
    *   `TaskManager`: Handles data access from Obsidian's metadata cache.
    *   `TaskService`: Manages CRUD operations for task files.
    *   `FieldMapper`: Maps between internal `TaskInfo` objects and file frontmatter.
    *   `ICSSubscriptionService`: Fetches and caches calendar events.
    *   `NaturalLanguageParser`: Parses date strings using `chrono-node`.
*   **Utils:** `ServiceContainer` (DI), `EventEmitter`.

## Building and Running

### Prerequisites
*   Node.js 20.x (LTS)
*   Obsidian (for testing the plugin)

### Key Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Builds the plugin in development mode (with source maps) and copies it to the test vault. |
| `npm run dev:watch` | Watches for changes and rebuilds/copies automatically. |
| `npm run build` | Builds the production version (minified, no source maps). |
| `npm run build:deploy` | Builds production version and copies to the configured vault. |
| `npm run typecheck` | Runs TypeScript type checking. |
| `npm test` | Runs the test suite using Jest. |
| `npm run lint` | Runs ESLint to check for code style issues. |
| `npm run format` | Formats code using Prettier. |

### Configuration
*   **Vault Path:** Create a `.copy-files.local` file in the root directory containing the absolute path to your Obsidian vault's plugin folder to override the default test path.
    *   Example: `C:\Users\Name\Documents\MyVault\.obsidian\plugins\nimble-task-notes`

## Development Conventions

*   **Language:** TypeScript (Strict mode enabled).
*   **Formatting:** Prettier is used for code formatting.
*   **Linting:** ESLint is used for static analysis.
*   **Testing:** Jest is the testing framework. Unit tests are located in `src/__tests__`.
*   **Conventions:**
    *   Use `ServiceContainer` for accessing services.
    *   Prefer lazy loading for heavy dependencies or rarely used features.
    *   Keep the main plugin class (`src/main.ts`) lightweight; delegate logic to services.
    *   Use `TaskInfo` interface for passing task data internally.

## Key Files

*   `src/main.ts`: Plugin entry point, service registration, and event handling.
*   `src/types.ts`: TypeScript interfaces for core data structures (`TaskInfo`, `NimbleTaskNotesSettings`).
*   `src/utils/ServiceContainer.ts`: Dependency injection container.
*   `src/services/`: Directory containing all business logic services.
*   `package.json`: Project dependencies and scripts.
*   `esbuild.config.mjs`: Build configuration for esbuild.
