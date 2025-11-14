# Auto-Suggest Projects Feature Plan

## Overview

This document describes the planned implementation of an auto-suggest/multi-select project picker for the TaskCreationModal. When converting inline checkboxes to tasks, users will be able to select from a filtered list of project files based on configurable criteria.

**Status**: Planning phase
**Target Phase**: Future enhancement
**Estimated Code Size**: ~410 lines

---

## Feature Description

### User Story

As a user converting checkboxes to tasks, I want to:
1. Click an "Add Project" button in the task creation modal
2. See a fuzzy-searchable list of relevant project files from my vault
3. Select one or multiple projects to associate with the task
4. See selected projects as removable chips in the modal
5. Have the project list automatically filtered based on configurable settings (folder path, tags, status values)

### Configuration Requirements

Users should be able to configure:
- **Source Folder**: Path to folder containing project files (e.g., `Work/01-Projects`)
- **Required Tag**: Tag that identifies a file as a project (e.g., `#project`)
- **Status Property**: Frontmatter property name that contains status (e.g., `status`)
- **Excluded Statuses**: Status values to exclude from suggestions (e.g., `deprioritized`, `completed`)

---

## User Flow Example

1. User types `- [ ] Review proposal` in a note
2. User presses Ctrl+Enter (Cmd+Enter on Mac)
3. TaskCreationModal opens with two fields: Due Date and Projects
4. User clicks "Add Project" button
5. ProjectSuggestModal opens showing filtered projects:
   - "Client Alpha"
   - "Website Redesign"
   - "Q4 Planning"
6. User types "alpha" → fuzzy match highlights "Client Alpha"
7. User presses Enter → chip appears: `[Client Alpha] ×`
8. User clicks "Add Project" again → selects "Website Redesign"
9. Two chips now visible: `[Client Alpha] ×` `[Website Redesign] ×`
10. User clicks × on "Client Alpha" chip → removed
11. User fills due date, clicks "Create Task"
12. Task file created with `projects: ["[[Website Redesign]]"]`

---

## Technical Design

### Architecture Overview

**Component Structure**:
```
TaskCreationModal (enhanced)
  ├─ "Add Project" button
  ├─ Chip container div
  └─ Opens ProjectSuggestModal
       ├─ Uses FuzzySuggestModal from Obsidian API
       └─ Gets project list from ProjectDiscoveryService

ProjectDiscoveryService (new)
  ├─ Reads vault files
  ├─ Filters by folder, tag, status
  ├─ Sorts by modification time (most recent first)
  └─ Returns array of eligible project names
```

### New Settings Schema

```typescript
export interface LightweightTasksSettings {
  // ... existing settings ...

  // Auto-suggest projects settings
  enableProjectSuggestions: boolean;          // Master toggle
  projectsSourceFolder: string;               // Folder path (e.g., 'Work/01-Projects')
  projectsRequiredTag: string;                // Tag to identify project files
  projectsStatusProperty: string;             // Status property name in frontmatter
  projectsExcludedStatuses: string[];         // Status values to exclude
}
```

**Default Values**:
```typescript
enableProjectSuggestions: false,              // Disabled by default
projectsSourceFolder: '',                     // Empty = vault root
projectsRequiredTag: 'project',               // Default tag
projectsStatusProperty: 'status',             // Default property name
projectsExcludedStatuses: ['deprioritized', 'completed']
```

---

## Implementation Plan

### Files to Create

#### 1. `src/services/ProjectDiscoveryService.ts` (~120 lines)

**Purpose**: Discover eligible project files based on configured filters

**Key Methods**:
```typescript
class ProjectDiscoveryService {
  constructor(app: App, settings: LightweightTasksSettings)

  /**
   * Get list of available projects based on settings
   * @returns Array of project names (sorted by modification time, most recent first)
   */
  getAvailableProjects(): string[]

  /**
   * Check if file matches project criteria
   * @param file - File to check
   * @returns true if file is a valid project suggestion
   */
  private isEligibleProject(file: TFile): boolean

  /**
   * Check if file is in configured source folder
   * @param file - File to check
   * @returns true if in source folder (or no folder restriction)
   */
  private isInSourceFolder(file: TFile): boolean

  /**
   * Check if file has required tag
   * @param file - File to check
   * @returns true if has required tag
   */
  private hasRequiredTag(file: TFile): boolean

  /**
   * Check if file's status is not in excluded list
   * @param file - File to check
   * @returns true if status is allowed
   */
  private hasAllowedStatus(file: TFile): boolean
}
```

**Algorithm**:
1. Get all markdown files: `app.vault.getMarkdownFiles()`
2. For each file:
   - Check if in source folder (if configured)
   - Check if has required tag in frontmatter
   - Read status property from frontmatter
   - Exclude if status in excluded list
3. Sort remaining files by `file.stat.mtime` (descending)
4. Return array of basenames (without `.md`)

**Edge Cases**:
- No frontmatter → exclude file
- Missing tag property → exclude file
- Missing status property → include file (no status = not excluded)
- Empty source folder setting → search entire vault
- Invalid folder path → search entire vault, log warning

#### 2. `src/modals/ProjectSuggestModal.ts` (~60 lines)

**Purpose**: Fuzzy-searchable modal for project selection

**Implementation**:
```typescript
import { App, FuzzySuggestModal } from 'obsidian';

export class ProjectSuggestModal extends FuzzySuggestModal<string> {
  constructor(
    app: App,
    private availableProjects: string[],
    private onSelectProject: (project: string) => void
  ) {
    super(app);
    this.setPlaceholder('Search for a project...');
  }

  getItems(): string[] {
    return this.availableProjects;
  }

  getItemText(item: string): string {
    return item;
  }

  onChooseItem(item: string): void {
    this.onSelectProject(item);
  }
}
```

**Features**:
- Built-in fuzzy matching (no manual filtering needed)
- Keyboard navigation (↑↓ to navigate, Enter to select, Esc to cancel)
- Search highlighting
- Placeholder text

### Files to Modify

#### 3. `src/modals/TaskCreationModal.ts` (~100 lines added)

**Changes**:

**Add Properties**:
```typescript
private selectedProjects: string[] = [];
private chipContainer: HTMLElement;
```

**Replace `setupProjectField()` method**:
```typescript
private setupProjectField(container: HTMLElement): void {
  const setting = new Setting(container)
    .setName('Projects')
    .setDesc('Click "Add Project" to select from your vault');

  // Add "Add Project" button
  setting.addButton((button) => {
    button
      .setButtonText('Add Project')
      .setCta()
      .onClick(() => {
        this.openProjectSuggestModal();
      });
  });

  // Create chip container
  this.chipContainer = container.createDiv('project-chips');
}
```

**Add New Methods**:
```typescript
/**
 * Open fuzzy suggest modal for project selection
 */
private openProjectSuggestModal(): void {
  if (!this.plugin.settings.enableProjectSuggestions) {
    // Fallback: show notice if feature disabled
    new Notice('Project suggestions are disabled in settings');
    return;
  }

  const projectDiscovery = this.plugin.getService<ProjectDiscoveryService>('projectDiscovery');
  const availableProjects = projectDiscovery.getAvailableProjects();

  if (availableProjects.length === 0) {
    new Notice('No eligible projects found. Check your project suggestion settings.');
    return;
  }

  const modal = new ProjectSuggestModal(
    this.app,
    availableProjects,
    (project) => this.addProject(project)
  );
  modal.open();
}

/**
 * Add project chip to UI and selected list
 */
private addProject(projectName: string): void {
  const wikilink = `[[${projectName}]]`;

  // Prevent duplicates
  if (this.selectedProjects.includes(wikilink)) {
    new Notice(`${projectName} is already added`);
    return;
  }

  this.selectedProjects.push(wikilink);
  this.renderChip(projectName, wikilink);
}

/**
 * Render a chip element for a selected project
 */
private renderChip(displayName: string, wikilink: string): void {
  const chip = this.chipContainer.createDiv('project-chip');

  chip.createSpan({
    text: displayName,
    cls: 'project-chip-text'
  });

  const removeBtn = chip.createSpan({
    text: '×',
    cls: 'project-chip-remove'
  });

  removeBtn.addEventListener('click', () => {
    this.removeProject(wikilink);
    chip.remove();
  });
}

/**
 * Remove project from selected list
 */
private removeProject(wikilink: string): void {
  const index = this.selectedProjects.indexOf(wikilink);
  if (index > -1) {
    this.selectedProjects.splice(index, 1);
  }
}
```

**Update `extractProjects()` method**:
```typescript
private extractProjects(): string[] {
  // Simply return the selected projects array
  // (already formatted as wikilinks)
  return this.selectedProjects;
}
```

#### 4. `src/settings/SettingTab.ts` (~70 lines added)

**Add New Section**:
```typescript
// Add after existing settings sections

containerEl.createEl("h3", { text: "Project Suggestions" });

// Master toggle
new Setting(containerEl)
  .setName("Enable project suggestions")
  .setDesc("Show project picker when creating tasks from checkboxes")
  .addToggle((toggle) => {
    toggle
      .setValue(this.plugin.settings.enableProjectSuggestions)
      .onChange(async (value) => {
        this.plugin.settings.enableProjectSuggestions = value;
        await this.plugin.saveSettings();
        // Refresh display to show/hide other settings
        this.display();
      });
  });

// Only show these settings if feature is enabled
if (this.plugin.settings.enableProjectSuggestions) {

  new Setting(containerEl)
    .setName("Projects source folder")
    .setDesc("Folder containing project files (leave empty for vault root)")
    .addText((text) => {
      text
        .setPlaceholder("e.g., Work/01-Projects")
        .setValue(this.plugin.settings.projectsSourceFolder)
        .onChange(async (value) => {
          this.plugin.settings.projectsSourceFolder = value;
          await this.plugin.saveSettings();
        });
    });

  new Setting(containerEl)
    .setName("Projects tag")
    .setDesc("Tag that identifies project files (without #)")
    .addText((text) => {
      text
        .setPlaceholder("e.g., project")
        .setValue(this.plugin.settings.projectsRequiredTag)
        .onChange(async (value) => {
          this.plugin.settings.projectsRequiredTag = value;
          await this.plugin.saveSettings();
        });
    });

  new Setting(containerEl)
    .setName("Status property name")
    .setDesc("Frontmatter property containing status value")
    .addText((text) => {
      text
        .setPlaceholder("e.g., status")
        .setValue(this.plugin.settings.projectsStatusProperty)
        .onChange(async (value) => {
          this.plugin.settings.projectsStatusProperty = value;
          await this.plugin.saveSettings();
        });
    });

  new Setting(containerEl)
    .setName("Excluded status values")
    .setDesc("Comma-separated status values to exclude from suggestions")
    .addText((text) => {
      text
        .setPlaceholder("e.g., deprioritized, completed")
        .setValue(this.plugin.settings.projectsExcludedStatuses.join(', '))
        .onChange(async (value) => {
          this.plugin.settings.projectsExcludedStatuses =
            value.split(',').map(s => s.trim()).filter(s => s.length > 0);
          await this.plugin.saveSettings();
        });
    });
}
```

#### 5. `src/types.ts` (~15 lines added)

Add to `LightweightTasksSettings` interface:
```typescript
export interface LightweightTasksSettings {
  // ... existing settings ...

  // Auto-suggest projects settings
  enableProjectSuggestions: boolean;
  projectsSourceFolder: string;
  projectsRequiredTag: string;
  projectsStatusProperty: string;
  projectsExcludedStatuses: string[];
}
```

#### 6. `src/settings/defaults.ts` (~7 lines added)

Add default values:
```typescript
export const DEFAULT_SETTINGS: LightweightTasksSettings = {
  // ... existing defaults ...

  enableProjectSuggestions: false,
  projectsSourceFolder: '',
  projectsRequiredTag: 'project',
  projectsStatusProperty: 'status',
  projectsExcludedStatuses: ['deprioritized', 'completed'],
};
```

#### 7. `src/main.ts` (~3 lines added)

Register ProjectDiscoveryService in ServiceContainer:
```typescript
// In onload() method, add:
this.container.register('projectDiscovery', () =>
  new ProjectDiscoveryService(this.app, this.settings)
);
```

#### 8. `styles.css` (~35 lines added or new file)

Add chip styling:
```css
/* Project chip container */
.project-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  margin-left: 160px; /* Align with other form fields */
  min-height: 20px;
}

/* Individual project chip */
.project-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background-color: var(--background-modifier-border);
  border-radius: 12px;
  font-size: 0.9em;
  cursor: default;
  transition: background-color 0.2s ease;
}

.project-chip:hover {
  background-color: var(--background-modifier-border-hover);
}

/* Chip text */
.project-chip-text {
  color: var(--text-normal);
  user-select: none;
}

/* Chip remove button */
.project-chip-remove {
  cursor: pointer;
  font-size: 1.2em;
  font-weight: bold;
  color: var(--text-muted);
  line-height: 1;
  padding: 0 2px;
  user-select: none;
}

.project-chip-remove:hover {
  color: var(--text-error);
}
```

---

## Code Size Breakdown

| File | Type | Estimated Lines |
|------|------|-----------------|
| `ProjectDiscoveryService.ts` | New | ~120 |
| `ProjectSuggestModal.ts` | New | ~60 |
| `TaskCreationModal.ts` | Modified | +100 |
| `SettingTab.ts` | Modified | +70 |
| `types.ts` | Modified | +15 |
| `defaults.ts` | Modified | +7 |
| `main.ts` | Modified | +3 |
| `styles.css` | New/Modified | +35 |
| **Total** | | **~410 lines** |

**Budget Check**:
- Current codebase: ~2,660 lines
- Remaining budget: ~1,840 lines
- This feature: ~410 lines
- After implementation: ~1,430 lines remaining ✅

---

## Testing Checklist

### Unit Testing Focus

1. **ProjectDiscoveryService**:
   - ✅ Returns empty array when no files match criteria
   - ✅ Filters by folder path correctly
   - ✅ Filters by required tag correctly
   - ✅ Excludes files with excluded status values
   - ✅ Includes files with no status property
   - ✅ Sorts by modification time (most recent first)
   - ✅ Handles missing frontmatter gracefully
   - ✅ Handles invalid folder paths
   - ✅ Works with vault root (empty folder setting)

2. **TaskCreationModal (Chip UI)**:
   - ✅ "Add Project" button opens suggest modal
   - ✅ Adding project creates chip in UI
   - ✅ Chip displays correct project name
   - ✅ × button removes chip from UI and array
   - ✅ Prevents duplicate project additions
   - ✅ Multiple chips can be added
   - ✅ extractProjects() returns correct wikilink array
   - ✅ Shows notice when no projects found
   - ✅ Shows notice when feature disabled

3. **ProjectSuggestModal**:
   - ✅ Displays all available projects
   - ✅ Fuzzy search works correctly
   - ✅ Selecting project calls callback
   - ✅ Esc closes modal without selection
   - ✅ Enter key selects highlighted item

### Integration Testing

1. **End-to-End Workflow**:
   - ✅ Create vault with project files matching criteria
   - ✅ Enable project suggestions in settings
   - ✅ Configure folder, tag, status filters
   - ✅ Convert checkbox to task (Ctrl+Enter)
   - ✅ Click "Add Project" button
   - ✅ Select multiple projects from suggest modal
   - ✅ Remove one project chip
   - ✅ Complete task creation
   - ✅ Verify task file has correct projects in frontmatter

2. **Settings Interaction**:
   - ✅ Master toggle shows/hides other settings
   - ✅ Changing folder path updates suggestions
   - ✅ Changing tag updates suggestions
   - ✅ Adding excluded status updates suggestions
   - ✅ Settings persist after plugin reload

3. **Edge Cases**:
   - ✅ Feature disabled → "Add Project" shows notice
   - ✅ No matching projects → modal shows notice
   - ✅ Invalid folder path → searches entire vault
   - ✅ Project file deleted → removed from suggestions on next open
   - ✅ Creating task with no projects selected → works normally

---

## UI/UX Considerations

### Visual Design

**Chip Appearance**:
- Uses Obsidian's native color variables for theme compatibility
- Rounded corners (border-radius: 12px) for modern look
- Hover states for better interactivity
- × symbol instead of icon (no dependencies)

**Layout**:
- Chips align with form fields (margin-left: 160px)
- Wraps to multiple rows if many projects
- Consistent spacing (gap: 6px)

### Accessibility

- Keyboard navigation in suggest modal (↑↓ Enter Esc)
- Click or Enter to add project
- Click × or keyboard to remove chip
- Clear visual feedback (hover states)
- Screen reader friendly (semantic HTML)

### Performance

**Lazy Loading**:
- ProjectDiscoveryService registered in ServiceContainer
- Only instantiated when modal opens AND feature enabled
- No impact on plugin startup time

**Caching Strategy**:
- Projects discovered fresh each time modal opens
- No stale data issues
- Could add caching later if performance issues (unlikely with <1000 projects)

**Optimization Notes**:
- `getMarkdownFiles()` is fast (Obsidian's native method)
- Frontmatter reads from MetadataCache (already in memory)
- Filtering is O(n) where n = files in vault
- Sorting is O(n log n) but n should be small (<100 typical)

---

## Future Enhancements

### Potential Additions (Post-MVP)

1. **Smart Suggestions**:
   - Use current note's folder to prioritize related projects
   - Learn from user's past project selections
   - Show recently used projects first

2. **Project Metadata Display**:
   - Show project status in suggest modal
   - Display due dates or progress indicators
   - Add icons based on project type

3. **Quick Add**:
   - Allow typing project name directly (no modal)
   - Auto-suggest as user types (inline dropdown)
   - Tab to accept suggestion

4. **Bulk Operations**:
   - "Add All" button to include all suggestions
   - "Clear All" button to remove all chips
   - Save/load project sets (e.g., "Client Alpha Bundle")

5. **Advanced Filtering**:
   - Multiple required tags (AND/OR logic)
   - Date-based filters (created/modified recently)
   - Property-based filters (priority, phase, etc.)

### Considerations for v2

- Keep chip UI pattern (works well)
- Consider caching if performance becomes issue
- Gather user feedback on filter criteria
- Monitor code size vs. benefit tradeoff

---

## Dependencies

### Obsidian API

**Required Classes**:
- `FuzzySuggestModal<T>` - For project picker
- `Modal` - Base class (already used)
- `Setting` - Form fields (already used)
- `Notice` - User notifications (already used)
- `App` - Vault access (already used)
- `TFile` - File references (already used)

**MetadataCache Methods**:
- `app.metadataCache.getFileCache(file)` - Read frontmatter
- `app.vault.getMarkdownFiles()` - List files

### No External Dependencies

- ✅ No npm packages needed
- ✅ No additional libraries
- ✅ Pure Obsidian API implementation
- ✅ Maintains "lightweight" philosophy

---

## Rollout Strategy

### Development Phases

**Phase 1: Core Implementation** (~2-3 hours)
1. Create ProjectDiscoveryService
2. Create ProjectSuggestModal
3. Add settings schema and defaults
4. Register service in main.ts

**Phase 2: UI Enhancement** (~2-3 hours)
1. Modify TaskCreationModal for chip UI
2. Add CSS styling
3. Wire up suggest modal integration
4. Test basic functionality

**Phase 3: Settings UI** (~1-2 hours)
1. Add settings section in SettingTab
2. Implement conditional display
3. Test settings persistence
4. Validate user inputs

**Phase 4: Testing & Polish** (~2-3 hours)
1. Manual testing of all workflows
2. Edge case handling
3. Error message refinement
4. Documentation updates

**Total Estimated Time**: 7-11 hours

### Feature Flag

Feature is **disabled by default** (`enableProjectSuggestions: false`)

**Reasoning**:
- Requires user configuration to be useful
- Vault-specific (different users have different structures)
- Optional enhancement (doesn't break existing workflow)
- Allows gradual rollout and testing

### User Communication

**Settings Description Text**:
Clear explanations of each setting:
- What the feature does
- Example values
- How filters work together

**First-Time Experience**:
- User enables feature in settings
- Configures folder/tag/status filters
- Opens task creation modal
- Sees "Add Project" button with clear label

---

## Risks & Mitigations

### Risk 1: Performance with Large Vaults

**Risk**: Filtering thousands of files could be slow

**Mitigation**:
- Filtering is O(n) but uses fast MetadataCache reads
- Most vaults have <100 project files
- Add caching in future if needed
- Consider limiting to first 100 results

### Risk 2: Complex Configuration

**Risk**: Users confused by multiple filter settings

**Mitigation**:
- Clear descriptions in settings UI
- Sensible defaults (project tag, common status values)
- Master toggle hides complexity when disabled
- Document examples in CLAUDE.md

### Risk 3: Code Size Budget

**Risk**: Feature adds 410 lines, consuming 22% of remaining budget

**Mitigation**:
- Still well within budget (1,430 lines remain)
- High-value feature for task management
- No bloat (every line serves purpose)
- Future phases (5-6) can be adjusted if needed

### Risk 4: Breaking Changes

**Risk**: Modifying TaskCreationModal could break existing workflows

**Mitigation**:
- Feature is opt-in (disabled by default)
- Modal still works without project selection
- Existing `extractProjects()` interface unchanged
- Backward compatible with manual text entry

---

## Success Metrics

### Quantitative Metrics

- ✅ Code size: <500 lines (target: ~410)
- ✅ Load time: No impact (lazy loaded)
- ✅ Modal open time: <200ms (even with 100 projects)
- ✅ Memory usage: <1MB additional (service + cached data)

### Qualitative Metrics

- ✅ User can discover projects without remembering exact names
- ✅ Fuzzy search makes selection fast
- ✅ Chip UI clearly shows selected projects
- ✅ Settings are understandable and useful
- ✅ Feature feels integrated (not bolted on)

### User Feedback Questions

1. Is the "Add Project" button discoverable?
2. Are the filter settings clear?
3. Does fuzzy search work as expected?
4. Is chip UI intuitive (add/remove projects)?
5. Does feature improve task creation workflow?

---

## Related Documentation

- [PRD-Lightweight-Task-Plugin.md](./PRD-Lightweight-Task-Plugin.md) - Overall plugin requirements
- [PHASE2_COMPLETE.md](./PHASE2_COMPLETE.md) - TaskService and TaskManager implementation
- [PHASE-4-TESTING.md](./PHASE-4-TESTING.md) - TaskCreationModal testing
- [CONFIGURABLE_PROPERTIES.md](./CONFIGURABLE_PROPERTIES.md) - Property configuration pattern

---

## Conclusion

This feature enhances the task creation workflow with minimal complexity:

**Key Benefits**:
✅ **Better UX**: Visual project selection vs. manual typing
✅ **Flexible**: Fully configurable filters for any vault structure
✅ **Lightweight**: Lazy loaded, no external dependencies
✅ **Safe**: Opt-in feature, backward compatible
✅ **Maintainable**: Clean separation of concerns, well-documented

**Implementation is ready to proceed when prioritized.**
