# Configurable Task Properties

This document describes the configurable property system for task frontmatter in Lightweight Tasks.

## Overview

Lightweight Tasks allows users to customize the property names used in task frontmatter. This provides flexibility for users who want to integrate with existing workflows or match their preferred naming conventions.

## Status

- **Phase 1**: ✅ **COMPLETE** (Status property configuration)
- **Phase 2**: 📋 **PLANNED** (Full property template configuration)

---

## Phase 1: Status Property Configuration

### Motivation

The original implementation used a `complete` property to track task status. However:
- Many users prefer more descriptive property names like `taskStatus`, `done`, or `finished`
- Existing vaults may have different naming conventions
- Flexibility improves plugin adoption

### Implementation

Phase 1 makes the status property name configurable while maintaining backward compatibility.

#### Default Configuration

```yaml
---
taskStatus: false       # Configurable property name (default: "taskStatus")
due: 2025-11-08         # YYYY-MM-DD or null
projects: ["[[Project Alpha]]"]  # Array of wikilinks
tags: [task]            # Always includes 'task'
statusDescription: ""   # Free text
---
```

#### Settings

Users can configure the status property name in Settings → Property Configuration:

- **Setting Name**: "Status property name"
- **Default Value**: `taskStatus`
- **Type**: String (text input)
- **Validation**: Must not be empty

#### Architecture

The implementation follows a clean separation of concerns:

```
Settings (defaults.ts)
    ↓
PropertyNames interface (types.ts)
    ↓
Service Layer (FieldMapper, TaskService, TaskManager)
    ↓
Frontmatter Generation/Parsing
```

**Key Components:**

1. **Type Definition** ([src/types.ts](../src/types.ts))
   ```typescript
   export interface PropertyNames {
     status: string;  // Property name for completion status
   }

   export interface LightweightTasksSettings {
     // ... other settings
     propertyNames: PropertyNames;
   }
   ```

2. **Default Configuration** ([src/settings/defaults.ts](../src/settings/defaults.ts))
   ```typescript
   export const DEFAULT_SETTINGS: LightweightTasksSettings = {
     // ... other defaults
     propertyNames: {
       status: "taskStatus",
     },
   };
   ```

3. **FieldMapper** ([src/services/FieldMapper.ts](../src/services/FieldMapper.ts))
   - Uses `plugin.settings.propertyNames.status` for property name
   - Supports backward compatibility with `complete` property
   - Validates both configured and legacy property names

4. **TaskService** ([src/services/TaskService.ts](../src/services/TaskService.ts))
   - Creates tasks with configured property name
   - Updates tasks using configured property name

5. **TaskManager** ([src/utils/TaskManager.ts](../src/utils/TaskManager.ts))
   - Reads from configured property name with fallback to `complete`
   - Filter methods (getIncompleteTasks, getCompleteTasks, getOverdueTasks) work seamlessly

6. **Settings UI** ([src/settings/SettingTab.ts](../src/settings/SettingTab.ts))
   - Text input for status property name
   - Placed in "Property Configuration" section
   - Live validation (must not be empty)

#### Backward Compatibility

The system maintains full backward compatibility:

- **Reading**: Checks configured property first, falls back to `complete`
  ```typescript
  const statusValue = frontmatter[statusProp] ?? frontmatter.complete;
  ```

- **Writing**: Always uses configured property name
  ```typescript
  return {
    [statusProp]: task.complete,
    // ... other properties
  };
  ```

- **Validation**: Accepts both configured and legacy property names
  ```typescript
  const statusValue = frontmatter[statusProp] ?? frontmatter.complete;
  if (statusValue !== undefined && typeof statusValue !== "boolean") {
    return false;
  }
  ```

**Migration Strategy:**
- Users can manually migrate existing tasks by changing property names in frontmatter
- Plugin will read both old and new property names during transition
- New tasks automatically use configured property name

#### Testing

Comprehensive test coverage ensures reliability:

- **FieldMapper Tests** ([src/__tests__/services/FieldMapper.test.ts](../src/__tests__/services/FieldMapper.test.ts))
  - ✅ Maps TaskInfo to frontmatter with configured property name
  - ✅ Parses frontmatter with configured property name
  - ✅ Validates configured property name
  - ✅ Creates default frontmatter with configured property name
  - ✅ Supports legacy "complete" property for backward compatibility

- **TaskManager Tests** ([src/__tests__/utils/TaskManager.test.ts](../src/__tests__/utils/TaskManager.test.ts))
  - ✅ Reads tasks with configured property name
  - ✅ Filters incomplete/complete tasks correctly
  - ✅ Handles overdue tasks with configured property
  - ✅ Supports legacy "complete" property for backward compatibility

**Test Results:** 107/107 tests passing ✅

#### Files Modified

| File | Lines Changed | Description |
|------|---------------|-------------|
| [src/types.ts](../src/types.ts) | +7 | Added PropertyNames interface |
| [src/settings/defaults.ts](../src/settings/defaults.ts) | +3 | Added default propertyNames config |
| [src/services/FieldMapper.ts](../src/services/FieldMapper.ts) | ~15 | Uses configurable property name |
| [src/services/TaskService.ts](../src/services/TaskService.ts) | ~5 | Uses configurable property name |
| [src/utils/TaskManager.ts](../src/utils/TaskManager.ts) | ~5 | Uses configurable property name |
| [src/settings/SettingTab.ts](../src/settings/SettingTab.ts) | +17 | Added Property Configuration section |
| [CLAUDE.md](../CLAUDE.md) | ~15 | Updated documentation |
| [src/__tests__/services/FieldMapper.test.ts](../src/__tests__/services/FieldMapper.test.ts) | ~40 | Updated tests + backward compat tests |
| [src/__tests__/utils/TaskManager.test.ts](../src/__tests__/utils/TaskManager.test.ts) | ~20 | Updated tests + backward compat tests |

**Total Impact:** ~125 lines changed/added across 9 files

---

## Phase 2: Full Property Template Configuration (PLANNED)

### Motivation

Phase 2 will extend configurability to all task properties, allowing users to:
- Customize property names for `due`, `projects`, `tags`, `statusDescription`
- Potentially add custom properties
- Define property types and validation rules
- Create property templates for different task types

### Planned Features

#### 1. Extended PropertyNames Interface

```typescript
export interface PropertyNames {
  status: string;           // Phase 1: Already implemented
  due: string;              // Phase 2: Date property name
  projects: string;         // Phase 2: Projects array property name
  tags: string;             // Phase 2: Tags array property name
  statusDescription: string; // Phase 2: Status description property name
}
```

#### 2. Property Type Definitions

```typescript
export interface PropertyDefinition {
  name: string;              // Property name in frontmatter
  type: 'boolean' | 'string' | 'date' | 'array' | 'wikilink-array';
  required: boolean;         // Is this property required?
  defaultValue?: any;        // Default value for new tasks
  validation?: (value: any) => boolean;  // Custom validation
}

export interface PropertyTemplate {
  status: PropertyDefinition;
  due: PropertyDefinition;
  projects: PropertyDefinition;
  tags: PropertyDefinition;
  statusDescription: PropertyDefinition;
  custom?: Record<string, PropertyDefinition>;  // User-defined properties
}
```

#### 3. Settings UI Enhancements

**Simple Mode** (Default):
- Text inputs for each property name
- Similar to Phase 1 status property configuration
- Easy for basic customization

**Advanced Mode** (Optional):
- Full property template editor
- JSON/YAML editor for power users
- Property type selection
- Validation rules
- Default values

#### 4. Migration Tools

Phase 2 should include migration utilities:

```typescript
interface MigrationOptions {
  fromTemplate: PropertyTemplate;
  toTemplate: PropertyTemplate;
  dryRun: boolean;
  backupFiles: boolean;
}

class PropertyMigrationService {
  // Migrate all tasks from one property schema to another
  async migrateProperties(options: MigrationOptions): Promise<MigrationReport>;

  // Preview migration changes
  async previewMigration(options: MigrationOptions): Promise<MigrationPreview>;

  // Rollback migration
  async rollbackMigration(report: MigrationReport): Promise<void>;
}
```

**Migration Command:**
- Accessible via Command Palette
- Shows preview of changes
- Requires confirmation
- Creates backup before migration
- Provides rollback capability

#### 5. Backward Compatibility Strategy

Phase 2 must maintain compatibility with:
- Phase 1 configurations (status property only)
- Legacy TaskNotes property names
- Default property names

**Approach:**
1. Property name resolution with fallback chain:
   ```typescript
   const value = frontmatter[configured]
              ?? frontmatter[legacy]
              ?? frontmatter[default];
   ```

2. Version detection in settings:
   ```typescript
   interface PropertyConfiguration {
     version: 1 | 2;  // Configuration schema version
     propertyNames: PropertyNames;
     propertyTemplate?: PropertyTemplate;  // Phase 2 only
   }
   ```

3. Automatic upgrade path:
   - Phase 1 config → Phase 2 config (preserves status property name)
   - Legacy config → Phase 2 config (uses default names)

#### 6. Implementation Plan

**Step 1: Extend Type System**
- Add full PropertyNames interface with all properties
- Add PropertyDefinition and PropertyTemplate interfaces
- Update LightweightTasksSettings

**Step 2: Update Core Services**
- Extend FieldMapper to use all configured property names
- Update TaskService for dynamic property mapping
- Update TaskManager for configurable property queries

**Step 3: Settings UI**
- Create PropertyConfigurationSection component
- Add simple mode (text inputs for each property)
- Add advanced mode (template editor)
- Add property validation

**Step 4: Migration Service**
- Implement PropertyMigrationService
- Add migration command
- Create migration preview UI
- Implement backup/rollback

**Step 5: Testing**
- Unit tests for all property configurations
- Integration tests for migration
- Backward compatibility tests
- Property validation tests

**Step 6: Documentation**
- Update user documentation
- Add migration guide
- Create property template examples
- Update API documentation

#### 7. Estimated Scope

| Component | Lines of Code | Complexity |
|-----------|---------------|------------|
| Type definitions | ~150 | Medium |
| FieldMapper updates | ~100 | Medium |
| TaskService updates | ~75 | Medium |
| TaskManager updates | ~50 | Low |
| Settings UI (simple) | ~200 | Medium |
| Settings UI (advanced) | ~400 | High |
| Migration service | ~500 | High |
| Migration UI | ~300 | High |
| Tests | ~800 | High |
| Documentation | ~500 words | Medium |

**Total Estimate:** ~2,575 lines of code

**Timeline Estimate:**
- Phase 2A (Simple Mode): 2-3 days
- Phase 2B (Advanced Mode): 3-4 days
- Phase 2C (Migration Tools): 4-5 days
- **Total: 9-12 days** of focused development

#### 8. Design Decisions

**Q: Should we support custom properties beyond the core set?**
- **Phase 2A**: No - only configure names of existing properties
- **Phase 2B+**: Maybe - evaluate user demand

**Q: Should property templates be shareable?**
- **Yes** - Export/import as JSON
- Community templates repository
- Template validation on import

**Q: How to handle property type changes?**
- **Strict validation** - Prevent breaking changes
- **Migration required** - Force explicit migration
- **Type coercion** - Only for safe conversions (string → boolean: "true" → true)

**Q: Should we allow removing required properties?**
- **No** - `tags` must always include "task"
- **Yes** - Other properties can be optional
- **Warning** - Show warning if removing commonly-used properties

#### 9. Example Configurations

**Minimal (Phase 1-style):**
```typescript
{
  propertyNames: {
    status: "taskStatus"
  }
}
```

**Full Rename:**
```typescript
{
  propertyNames: {
    status: "done",
    due: "dueDate",
    projects: "linkedProjects",
    tags: "labels",
    statusDescription: "notes"
  }
}
```

**TaskNotes Compatibility:**
```typescript
{
  propertyNames: {
    status: "complete",  // Legacy name
    due: "due",
    projects: "projects",
    tags: "tags",
    statusDescription: "statusDescription"
  }
}
```

**Bases Plugin Integration:**
```typescript
{
  propertyNames: {
    status: "status",
    due: "deadline",
    projects: "related",
    tags: "categories",
    statusDescription: "description"
  }
}
```

#### 10. User Experience Flow

**First-Time Setup (Phase 2A):**
1. User opens Settings → Property Configuration
2. Sees text inputs for each property name
3. Changes property names as desired
4. Saves settings
5. New tasks use new property names
6. Existing tasks remain readable (backward compatibility)

**Migration Flow (Phase 2C):**
1. User changes property names in settings
2. Plugin detects mismatch between settings and existing tasks
3. Shows notification: "Property names changed. Migrate existing tasks?"
4. User clicks "Preview Migration"
5. Modal shows preview of changes to all task files
6. User confirms migration
7. Plugin creates backup
8. Plugin migrates all task files
9. Shows success notification with rollback option

**Advanced Configuration (Phase 2B):**
1. User opens Settings → Property Configuration → Advanced
2. Sees full property template editor
3. Can define property types, defaults, validation
4. Can import/export templates
5. Can preview template changes
6. Saves template
7. Plugin validates template
8. New tasks use new template

---

## Technical Design Notes

### Property Resolution Algorithm

```typescript
class PropertyResolver {
  /**
   * Resolve property value with fallback chain
   * 1. Configured property name
   * 2. Legacy property name
   * 3. Default value
   */
  resolve(
    frontmatter: any,
    propertyName: keyof PropertyNames,
    legacyNames?: string[]
  ): any {
    const configuredName = this.settings.propertyNames[propertyName];

    // Check configured name
    if (frontmatter[configuredName] !== undefined) {
      return frontmatter[configuredName];
    }

    // Check legacy names
    if (legacyNames) {
      for (const legacyName of legacyNames) {
        if (frontmatter[legacyName] !== undefined) {
          return frontmatter[legacyName];
        }
      }
    }

    // Return undefined (caller handles default)
    return undefined;
  }
}
```

### Validation Strategy

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

class PropertyValidator {
  /**
   * Validate frontmatter against property template
   */
  validate(
    frontmatter: any,
    template: PropertyTemplate
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check required properties
    for (const [key, def] of Object.entries(template)) {
      if (def.required && frontmatter[def.name] === undefined) {
        errors.push({
          property: key,
          message: `Required property '${def.name}' is missing`
        });
      }
    }

    // Validate property types
    for (const [key, def] of Object.entries(template)) {
      const value = frontmatter[def.name];
      if (value !== undefined && !this.validateType(value, def.type)) {
        errors.push({
          property: key,
          message: `Property '${def.name}' has incorrect type (expected ${def.type})`
        });
      }
    }

    // Check for unknown properties
    const knownNames = Object.values(template).map(def => def.name);
    for (const key of Object.keys(frontmatter)) {
      if (!knownNames.includes(key)) {
        warnings.push({
          property: key,
          message: `Unknown property '${key}' in frontmatter`
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}
```

---

## Migration Guide

### For Users

**Migrating from "complete" to "taskStatus":**

1. Open Settings → Property Configuration
2. Verify "Status property name" is set to "taskStatus" (default)
3. New tasks will automatically use "taskStatus"
4. Existing tasks with "complete" will still work (backward compatibility)
5. Optional: Manually rename "complete" → "taskStatus" in existing tasks

**Example Manual Migration:**

Before:
```yaml
---
complete: false
due: 2025-11-08
tags: [task]
---
```

After:
```yaml
---
taskStatus: false
due: 2025-11-08
tags: [task]
---
```

### For Plugin Developers

**Accessing Task Status:**

```typescript
// ✅ Good - uses configured property name
const task = taskManager.getTaskInfo(path);
const isComplete = task.complete;  // Internal property always available

// ✅ Good - when directly reading frontmatter
const statusProp = plugin.settings.propertyNames.status;
const isComplete = frontmatter[statusProp] ?? frontmatter.complete;

// ❌ Bad - hardcoded property name
const isComplete = frontmatter.complete;  // May not exist in Phase 2
```

**Creating Tasks:**

```typescript
// ✅ Good - use TaskService
await taskService.createTask({
  title: "My Task",
  complete: false,  // Internal representation
  // ... other properties
});

// ❌ Bad - directly create frontmatter
const frontmatter = {
  complete: false,  // Wrong! Should use configured name
  // ... other properties
};
```

---

## FAQs

**Q: Can I use the same property name for multiple properties?**
A: No, each property must have a unique name to avoid conflicts.

**Q: What happens if I change the status property name after creating tasks?**
A: Existing tasks will still work (backward compatibility). New tasks will use the new property name. Consider using the migration tool (Phase 2C) to update existing tasks.

**Q: Can I revert to the original "complete" property name?**
A: Yes, simply change the "Status property name" setting back to "complete" in Settings.

**Q: Does this affect Bases plugin integration?**
A: Bases integration (Phase 5) will respect your configured property names. You can map Bases properties to your custom task properties.

**Q: What if I misspell a property name?**
A: Tasks will still be created, but the property won't be recognized by query methods. You can fix the property name in settings and optionally migrate existing tasks.

**Q: Can I have different property names for different task types?**
A: Not in Phase 1. Phase 2B may introduce task templates with different property configurations.

---

## References

- [PRD: Lightweight Task Plugin](./PRD-Lightweight-Task-Plugin.md)
- [CLAUDE.md](../CLAUDE.md)
- [TaskNotes Property Mapping](https://github.com/wenlzhang/obsidian-task-note) (original implementation)
- [Obsidian Property Documentation](https://help.obsidian.md/Editing+and+formatting/Properties)
