# Phase 4: Inline Task Conversion - Testing Guide

## Overview

This document provides comprehensive testing procedures for Phase 4 features: checkbox-to-task conversion with natural language date parsing.

## Prerequisites

1. Plugin installed and enabled in Obsidian
2. Test vault with a daily note or any markdown file
3. Plugin settings configured (taskFolder should exist)

## Test Suite

### Test 1: Basic Conversion Flow

**Objective**: Verify basic checkbox-to-task conversion

**Steps**:
1. Open any note in Obsidian
2. Type: `- [ ] Test task`
3. Place cursor on that line
4. Press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)

**Expected Result**:
- Modal opens with title "Create Task"
- Shows "Converting: Test task"
- Due date field is auto-focused
- Project field is visible
- Create Task and Cancel buttons visible

### Test 2: Natural Language Date Parsing

**Objective**: Verify natural language date parsing works

**Test Cases**:

| Input | Expected Preview |
|-------|------------------|
| `tomorrow` | 📅 [Tomorrow's day], [Month] [Date], [Year] |
| `friday` | 📅 Fri, [Next Friday date] |
| `next monday` | 📅 Mon, [Next Monday date] |
| `nov 15` | 📅 Fri, Nov 15, 2025 |
| `in 2 weeks` | 📅 [Day], [Date 2 weeks from now] |
| `2025-11-15` | 📅 Fri, Nov 15, 2025 |

**Steps for Each**:
1. Start conversion on `- [ ] Test task`
2. Type the input in due date field
3. Observe preview appears below field

**Expected Result**:
- Preview updates as you type
- Preview shows correct date in format: "📅 DDD, MMM D, YYYY"

### Test 3: Invalid Date Handling

**Objective**: Verify error handling for invalid dates

**Steps**:
1. Start conversion on `- [ ] Test task`
2. Enter "asdfasdf" in due date field
3. Press Enter or click Create Task

**Expected Result**:
- Error message appears: "Invalid date format. Use natural language (e.g., "tomorrow") or YYYY-MM-DD format."
- Modal stays open
- Due date field remains focused
- No task created

### Test 4: Project Input Parsing

**Objective**: Verify project input handles multiple formats

**Test Cases**:

| Input | Expected Projects Array |
|-------|------------------------|
| `Project A` | `["[[Project A]]"]` |
| `Project A, Project B` | `["[[Project A]]", "[[Project B]]"]` |
| `[[Project A]]` | `["[[Project A]]"]` |
| `[[Project A]], [[Project B]]` | `["[[Project A]]", "[[Project B]]"]` |
| *(empty)* | `[]` |

**Steps for Each**:
1. Start conversion on `- [ ] Test task`
2. Tab to project field
3. Enter the input
4. Press Enter to create task
5. Open created task file
6. Check frontmatter projects field

**Expected Result**:
- Projects correctly parsed and wrapped in [[ ]]
- Frontmatter contains correct array

### Test 5: Task Creation and Line Replacement

**Objective**: Verify task file created with correct frontmatter

**Steps**:
1. Start conversion on `- [ ] My important task`
2. Enter "friday" for due date
3. Enter "Project Alpha, Project Beta" for projects
4. Press Enter

**Expected Result**:
- Notice appears: "Task created: My important task"
- Line becomes: `- [ ] [[My important task]]`
- Task file created in taskFolder
- Task file frontmatter contains:
  ```yaml
  ---
  complete: false
  due: 2025-11-14  # or next Friday's date
  projects: ["[[Project Alpha]]", "[[Project Beta]]"]
  tags: [task]
  statusDescription: ""
  ---
  ```

### Test 6: Checkbox Status Preservation

**Objective**: Verify checked/unchecked status is preserved

**Test Cases**:

| Original Line | Final Line | Task complete value |
|--------------|-----------|---------------------|
| `- [ ] Task` | `- [ ] [[Task]]` | `false` |
| `- [x] Task` | `- [x] [[Task]]` | `true` |
| `- [X] Task` | `- [X] [[Task]]` | `true` |

**Steps for Each**:
1. Type the original line
2. Convert with Ctrl+Enter
3. Press Enter in modal (no date/project needed)
4. Verify final line matches expected
5. Open task file and check `complete` field

**Expected Result**:
- Checkbox status preserved in editor
- Task frontmatter `complete` field matches checkbox

### Test 7: Empty Title Handling

**Objective**: Verify empty title uses "Untitled Task"

**Steps**:
1. Type: `- [ ] `
2. Press Ctrl+Enter
3. Press Enter in modal

**Expected Result**:
- Line becomes: `- [ ] [[Untitled Task]]`
- File created named "Untitled Task.md"

### Test 8: Modal Cancellation

**Objective**: Verify cancel preserves original checkbox

**Steps**:
1. Type: `- [ ] Test task`
2. Press Ctrl+Enter
3. Press Esc (or click Cancel button)

**Expected Result**:
- Modal closes
- Line remains: `- [ ] Test task` (unchanged)
- No task file created
- No notice shown

### Test 9: Undo/Redo Support

**Objective**: Verify editor transaction enables undo

**Steps**:
1. Type: `- [ ] Test task`
2. Press Ctrl+Enter, then Enter to create
3. Line becomes: `- [ ] [[Test task]]`
4. Press Ctrl+Z (undo)

**Expected Result**:
- Line reverts to: `- [ ] Test task`
- Task file still exists (expected - only line is undone)

**Additional Test**:
5. Press Ctrl+Shift+Z (redo)

**Expected Result**:
- Line becomes: `- [ ] [[Test task]]` again

### Test 10: Already Converted Detection

**Objective**: Verify prevents double conversion

**Steps**:
1. Type: `- [ ] [[Existing Task]]`
2. Press Ctrl+Enter

**Expected Result**:
- Notice appears: "This checkbox is already linked to a task"
- Modal does not open
- Line unchanged

### Test 11: Special Characters in Title

**Objective**: Verify filename sanitization works

**Test Cases**:

| Title | Expected Filename |
|-------|------------------|
| `Task: with colon` | `Task- with colon.md` |
| `Task #hashtag` | `Task -hashtag.md` |
| `Task with <brackets>` | `Task with -brackets-.md` |
| `Task & symbols` | `Task & symbols.md` |
| `Task\|pipe` | `Task-pipe.md` |

**Steps for Each**:
1. Type: `- [ ] [Title from table]`
2. Convert with Ctrl+Enter, press Enter
3. Check filename in file explorer

**Expected Result**:
- Task created successfully
- Filename sanitized per TaskService rules
- Line contains wikilink to sanitized filename

### Test 12: Windows Reserved Names

**Objective**: Verify Windows reserved names are handled

**Test Cases**:
- `CON`, `PRN`, `AUX`, `NUL`, `COM1`, `LPT1`

**Steps**:
1. Type: `- [ ] CON` (or other reserved name)
2. Convert with Ctrl+Enter, press Enter
3. Check filename

**Expected Result**:
- Filename sanitized to avoid reserved name
- Task created successfully (exact handling depends on TaskService implementation)

### Test 13: Keyboard Navigation in Modal

**Objective**: Verify keyboard navigation works properly

**Steps**:
1. Start conversion on `- [ ] Test`
2. Due date field should be focused (type to verify)
3. Press Tab → project field focused (type to verify)
4. Press Shift+Tab → due date field focused again
5. Press Enter → form submits

**Expected Result**:
- Tab cycles forward through fields
- Shift+Tab cycles backward
- Enter submits from any field
- Esc closes modal

### Test 14: Empty Date Handling

**Objective**: Verify empty date creates task without due date

**Steps**:
1. Start conversion on `- [ ] Test`
2. Leave due date field empty
3. Press Enter

**Expected Result**:
- Task created successfully
- Frontmatter has `due: null` or no due field
- No error shown

### Test 15: Multiple Projects

**Objective**: Verify multiple projects are parsed correctly

**Steps**:
1. Start conversion on `- [ ] Complex task`
2. Enter "tomorrow" for due date
3. Enter "Project A, Project B, Project C" for projects
4. Press Enter
5. Open task file

**Expected Result**:
- Frontmatter contains:
  ```yaml
  projects: ["[[Project A]]", "[[Project B]]", "[[Project C]]"]
  ```

### Test 16: Command Palette Access

**Objective**: Verify command works from command palette

**Steps**:
1. Type: `- [ ] Test`
2. Place cursor on line
3. Press Ctrl+P (Cmd+P on Mac) to open command palette
4. Type "convert checkbox"
5. Select "Convert checkbox to task" command

**Expected Result**:
- Modal opens
- Same behavior as keyboard shortcut

### Test 17: Indented Checkboxes

**Objective**: Verify indentation is preserved

**Test Cases**:

| Original | Final |
|----------|-------|
| `- [ ] Task` | `- [ ] [[Task]]` |
| `  - [ ] Indented` | `  - [ ] [[Indented]]` |
| `    - [ ] Double indent` | `    - [ ] [[Double indent]]` |
| `\t- [ ] Tab indent` | `\t- [ ] [[Tab indent]]` |

**Steps for Each**:
1. Type original line with indentation
2. Convert with Ctrl+Enter, press Enter
3. Verify indentation preserved

**Expected Result**:
- Indentation (spaces or tabs) preserved exactly

### Test 18: Non-Checkbox Line

**Objective**: Verify proper handling of non-checkbox lines

**Steps**:
1. Type: `This is just text`
2. Press Ctrl+Enter

**Expected Result**:
- Notice appears: "No checkbox found on this line"
- No modal opens

### Test 19: Date Preview Live Update

**Objective**: Verify date preview updates as you type

**Steps**:
1. Start conversion on `- [ ] Test`
2. Type "t" → no preview
3. Type "o" → no preview (or "to" preview)
4. Type "m" → no preview (or "tom" preview)
5. Type "o" → "tomorrow" → preview appears
6. Type "r" → "tomorr" → preview updates
7. Type "row" → "tomorrow" → preview finalized

**Expected Result**:
- Preview appears/updates smoothly as typing
- No lag or flickering
- Preview clears if input becomes invalid

### Test 20: Stress Test - Long Title

**Objective**: Verify handling of very long titles

**Steps**:
1. Type: `- [ ] This is a very long task title that exceeds 200 characters and should be truncated or handled appropriately according to the filename sanitization rules that are in place to ensure that filesystem limitations are respected across different operating systems`
2. Convert with Ctrl+Enter, press Enter
3. Check filename

**Expected Result**:
- Task created successfully
- Filename truncated to max length (200 chars per TaskService)
- Line contains wikilink to task

## Edge Cases Summary

| Edge Case | Expected Behavior |
|-----------|------------------|
| Empty title | Uses "Untitled Task" |
| Invalid date | Shows error, keeps modal open |
| Cancel modal | No changes, no task created |
| Already wikilink | Shows notice, no conversion |
| Non-checkbox line | Shows notice, no modal |
| Empty date | Task created with no due date |
| Special chars | Sanitized per TaskService rules |
| Windows reserved | Sanitized to safe filename |
| Very long title | Truncated to 200 chars |

## Known Limitations

1. **No checkbox sync**: Checkboxes don't bidirectionally sync with task completion (by design per PRD 2.5)
2. **Single task per line**: Cannot convert multiple checkboxes in one operation
3. **No context menu**: Right-click context menu not implemented in Phase 4 (deferred)
4. **No convert button widget**: Inline convert button not implemented (deferred to Phase 4.5+)

## Success Criteria

Phase 4 is considered successful if:

- ✅ All 20 test cases pass
- ✅ No console errors during normal operation
- ✅ Modal opens in <100ms perceived latency
- ✅ Date preview updates smoothly without lag
- ✅ Undo/redo works correctly
- ✅ All edge cases handled gracefully with user-friendly notices
- ✅ Task files have correct frontmatter structure
- ✅ Filename sanitization prevents invalid filenames

## Reporting Issues

When reporting issues, please include:

1. Test case number and name
2. Steps to reproduce
3. Expected result
4. Actual result
5. Console errors (if any)
6. Obsidian version
7. Plugin version
8. Operating system

## Next Steps

After Phase 4 testing is complete:
- Proceed to Phase 5: Bases Integration
- Consider implementing deferred features (convert button widget, context menu)
- Gather user feedback on natural language date parsing
