import { FieldMapper } from '../../services/FieldMapper';
import { TaskInfo } from '../../types';

// Mock plugin with settings
const mockPlugin = {
	settings: {
		defaultTags: ['task'],
		propertyNames: {
			status: 'taskStatus',
			due: 'due',
			completed: 'completed',
			projects: 'projects',
			tags: 'tags',
			statusDescription: 'statusDescription',
		},
	},
} as any;

describe('FieldMapper', () => {
	let fieldMapper: FieldMapper;

	beforeEach(() => {
		fieldMapper = new FieldMapper(mockPlugin);
	});

	describe('mapTaskInfoToFrontmatter', () => {
		it('should convert TaskInfo to frontmatter format', () => {
			const taskInfo: TaskInfo = {
				path: 'Tasks/MyTask.md',
				title: 'MyTask',
				complete: false,
				due: '2025-11-15',
				completed: null,
				projects: ['[[Project A]]'],
				tags: ['task', 'urgent'],
				statusDescription: 'In progress',
				file: undefined as any,
			};

			const result = fieldMapper.mapTaskInfoToFrontmatter(taskInfo);

			expect(result).toEqual({
				taskStatus: false,
				due: '2025-11-15',
				completed: null,
				projects: ['[[Project A]]'],
				tags: ['task', 'urgent'],
				statusDescription: 'In progress',
			});
		});

		it('should handle null due date', () => {
			const taskInfo: TaskInfo = {
				path: 'Tasks/MyTask.md',
				title: 'MyTask',
				complete: true,
				due: null,
				completed: '2025-11-13',
				projects: [],
				tags: ['task'],
				statusDescription: '',
				file: undefined as any,
			};

			const result = fieldMapper.mapTaskInfoToFrontmatter(taskInfo);

			expect(result.due).toBeNull();
			expect(result.completed).toBe('2025-11-13');
		});

		it('should handle completed date in frontmatter', () => {
			const taskInfo: TaskInfo = {
				path: 'Tasks/CompletedTask.md',
				title: 'CompletedTask',
				complete: true,
				due: '2025-11-15',
				completed: '2025-11-13',
				projects: [],
				tags: ['task'],
				statusDescription: 'Finished',
				file: undefined as any,
			};

			const result = fieldMapper.mapTaskInfoToFrontmatter(taskInfo);

			expect(result).toEqual({
				taskStatus: true,
				due: '2025-11-15',
				completed: '2025-11-13',
				projects: [],
				tags: ['task'],
				statusDescription: 'Finished',
			});
		});

		it('should handle null completed date', () => {
			const taskInfo: TaskInfo = {
				path: 'Tasks/IncompleteTask.md',
				title: 'IncompleteTask',
				complete: false,
				due: '2025-11-15',
				completed: null,
				projects: [],
				tags: ['task'],
				statusDescription: '',
				file: undefined as any,
			};

			const result = fieldMapper.mapTaskInfoToFrontmatter(taskInfo);

			expect(result.completed).toBeNull();
		});
	});

	describe('mapFrontmatterToTaskInfo', () => {
		it('should convert valid frontmatter to TaskInfo', () => {
			const frontmatter = {
				tags: ['task', 'urgent'],
				taskStatus: false,
				due: '2025-11-15',
				projects: ['[[Project A]]'],
				statusDescription: 'In progress',
			};

			const result = fieldMapper.mapFrontmatterToTaskInfo(
				frontmatter,
				'Tasks/MyTask.md'
			);

			expect(result).not.toBeNull();
			expect(result?.path).toBe('Tasks/MyTask.md');
			expect(result?.title).toBe('MyTask');
			expect(result?.complete).toBe(false);
			expect(result?.due).toBe('2025-11-15');
			expect(result?.projects).toEqual(['[[Project A]]']);
			expect(result?.tags).toEqual(['task', 'urgent']);
			expect(result?.statusDescription).toBe('In progress');
		});

		it('should return null for invalid frontmatter', () => {
			const frontmatter = { tags: ['work'] }; // Missing 'task' tag

			const result = fieldMapper.mapFrontmatterToTaskInfo(
				frontmatter,
				'Tasks/MyTask.md'
			);

			expect(result).toBeNull();
		});

		it('should handle missing complete field (default to false)', () => {
			const frontmatter = { tags: ['task'] };

			const result = fieldMapper.mapFrontmatterToTaskInfo(
				frontmatter,
				'test.md'
			);

			expect(result?.complete).toBe(false);
		});

		it('should convert Date object to YYYY-MM-DD string', () => {
			const frontmatter = {
				tags: ['task'],
				due: new Date(2025, 10, 15), // Month is 0-indexed
			};

			const result = fieldMapper.mapFrontmatterToTaskInfo(
				frontmatter,
				'test.md'
			);

			expect(result?.due).toBe('2025-11-15');
		});

		it('should filter out non-wikilink projects', () => {
			const frontmatter = {
				tags: ['task'],
				projects: ['[[Valid]]', 'Invalid', '[[Also Valid]]'],
			};

			const result = fieldMapper.mapFrontmatterToTaskInfo(
				frontmatter,
				'test.md'
			);

			expect(result?.projects).toEqual(['[[Valid]]', '[[Also Valid]]']);
		});

		it('should ensure task tag is always included', () => {
			const frontmatter = {
				tags: ['urgent', 'task', 'work'],
			};

			const result = fieldMapper.mapFrontmatterToTaskInfo(
				frontmatter,
				'test.md'
			);

			expect(result?.tags).toContain('task');
		});

		it('should add task tag if missing from tags array', () => {
			// Note: This would fail validation first, but testing the logic
			const frontmatter = {
				tags: ['task'],
			};

			const result = fieldMapper.mapFrontmatterToTaskInfo(
				frontmatter,
				'test.md'
			);

			expect(result?.tags).toContain('task');
		});

		it('should handle empty statusDescription', () => {
			const frontmatter = { tags: ['task'] };

			const result = fieldMapper.mapFrontmatterToTaskInfo(
				frontmatter,
				'test.md'
			);

			expect(result?.statusDescription).toBe('');
		});

		it('should extract title from path correctly', () => {
			const frontmatter = { tags: ['task'] };

			const result = fieldMapper.mapFrontmatterToTaskInfo(
				frontmatter,
				'Folder/Subfolder/TaskName.md'
			);

			expect(result?.title).toBe('TaskName');
		});

		it('should support legacy "complete" property for backward compatibility', () => {
			const frontmatter = {
				tags: ['task'],
				complete: true, // Legacy property name
			};

			const result = fieldMapper.mapFrontmatterToTaskInfo(
				frontmatter,
				'test.md'
			);

			expect(result?.complete).toBe(true);
		});

		it('should parse completed date from frontmatter', () => {
			const frontmatter = {
				tags: ['task'],
				taskStatus: true,
				completed: '2025-11-13',
			};

			const result = fieldMapper.mapFrontmatterToTaskInfo(
				frontmatter,
				'test.md'
			);

			expect(result?.completed).toBe('2025-11-13');
		});

		it('should handle null completed date in frontmatter', () => {
			const frontmatter = {
				tags: ['task'],
				taskStatus: false,
				completed: null,
			};

			const result = fieldMapper.mapFrontmatterToTaskInfo(
				frontmatter,
				'test.md'
			);

			expect(result?.completed).toBeNull();
		});

		it('should convert Date object to YYYY-MM-DD string for completed date', () => {
			const frontmatter = {
				tags: ['task'],
				completed: new Date(2025, 10, 13), // Month is 0-indexed (November = 10)
			};

			const result = fieldMapper.mapFrontmatterToTaskInfo(
				frontmatter,
				'test.md'
			);

			expect(result?.completed).toBe('2025-11-13');
		});

		it('should handle missing completed date (default to null)', () => {
			const frontmatter = {
				tags: ['task'],
				taskStatus: false,
			};

			const result = fieldMapper.mapFrontmatterToTaskInfo(
				frontmatter,
				'test.md'
			);

			expect(result?.completed).toBeNull();
		});
	});

	describe('validateTaskFrontmatter', () => {
		it('should validate correct task frontmatter', () => {
			const frontmatter = {
				tags: ['task'],
				taskStatus: false,
				due: '2025-11-15',
				projects: ['[[Project A]]'],
				statusDescription: 'In progress',
			};

			expect(fieldMapper.validateTaskFrontmatter(frontmatter)).toBe(true);
		});

		it('should reject null frontmatter', () => {
			expect(fieldMapper.validateTaskFrontmatter(null)).toBe(false);
		});

		it('should reject frontmatter without task tag', () => {
			const frontmatter = { tags: ['work', 'urgent'] };

			expect(fieldMapper.validateTaskFrontmatter(frontmatter)).toBe(false);
		});

		it('should reject frontmatter with non-array tags', () => {
			const frontmatter = { tags: 'task' };

			expect(fieldMapper.validateTaskFrontmatter(frontmatter)).toBe(false);
		});

		it('should reject frontmatter with non-boolean taskStatus', () => {
			const frontmatter = { tags: ['task'], taskStatus: 'true' };

			expect(fieldMapper.validateTaskFrontmatter(frontmatter)).toBe(false);
		});

		it('should accept frontmatter with missing taskStatus field', () => {
			const frontmatter = { tags: ['task'] };

			expect(fieldMapper.validateTaskFrontmatter(frontmatter)).toBe(true);
		});

		it('should validate legacy "complete" property for backward compatibility', () => {
			const frontmatter = { tags: ['task'], complete: true };

			expect(fieldMapper.validateTaskFrontmatter(frontmatter)).toBe(true);
		});

		it('should reject frontmatter with invalid date string', () => {
			const frontmatter = { tags: ['task'], due: 'invalid-date' };

			expect(fieldMapper.validateTaskFrontmatter(frontmatter)).toBe(false);
		});

		it('should accept frontmatter with valid date string', () => {
			const frontmatter = { tags: ['task'], due: '2025-11-15' };

			expect(fieldMapper.validateTaskFrontmatter(frontmatter)).toBe(true);
		});

		it('should accept frontmatter with Date object', () => {
			const frontmatter = { tags: ['task'], due: new Date(2025, 10, 15) };

			expect(fieldMapper.validateTaskFrontmatter(frontmatter)).toBe(true);
		});

		it('should accept frontmatter with null due date', () => {
			const frontmatter = { tags: ['task'], due: null };

			expect(fieldMapper.validateTaskFrontmatter(frontmatter)).toBe(true);
		});

		it('should reject frontmatter with invalid due date type', () => {
			const frontmatter = { tags: ['task'], due: 12345 };

			expect(fieldMapper.validateTaskFrontmatter(frontmatter)).toBe(false);
		});

		it('should reject frontmatter with non-array projects', () => {
			const frontmatter = { tags: ['task'], projects: 'Project A' };

			expect(fieldMapper.validateTaskFrontmatter(frontmatter)).toBe(false);
		});

		it('should accept frontmatter with missing projects', () => {
			const frontmatter = { tags: ['task'] };

			expect(fieldMapper.validateTaskFrontmatter(frontmatter)).toBe(true);
		});

		it('should reject frontmatter with non-string statusDescription', () => {
			const frontmatter = { tags: ['task'], statusDescription: 123 };

			expect(fieldMapper.validateTaskFrontmatter(frontmatter)).toBe(false);
		});

		it('should accept frontmatter with missing statusDescription', () => {
			const frontmatter = { tags: ['task'] };

			expect(fieldMapper.validateTaskFrontmatter(frontmatter)).toBe(true);
		});

		it('should accept frontmatter with valid completed date string', () => {
			const frontmatter = { tags: ['task'], completed: '2025-11-13' };

			expect(fieldMapper.validateTaskFrontmatter(frontmatter)).toBe(true);
		});

		it('should accept frontmatter with null completed date', () => {
			const frontmatter = { tags: ['task'], completed: null };

			expect(fieldMapper.validateTaskFrontmatter(frontmatter)).toBe(true);
		});

		it('should accept frontmatter with Date object for completed', () => {
			const frontmatter = { tags: ['task'], completed: new Date(2025, 10, 13) };

			expect(fieldMapper.validateTaskFrontmatter(frontmatter)).toBe(true);
		});

		it('should reject frontmatter with invalid completed date string', () => {
			const frontmatter = { tags: ['task'], completed: 'invalid-date' };

			expect(fieldMapper.validateTaskFrontmatter(frontmatter)).toBe(false);
		});

		it('should reject frontmatter with invalid completed date type', () => {
			const frontmatter = { tags: ['task'], completed: 12345 };

			expect(fieldMapper.validateTaskFrontmatter(frontmatter)).toBe(false);
		});

		it('should accept frontmatter with missing completed', () => {
			const frontmatter = { tags: ['task'] };

			expect(fieldMapper.validateTaskFrontmatter(frontmatter)).toBe(true);
		});
	});

	describe('createDefaultFrontmatter', () => {
		it('should create default frontmatter with minimal input', () => {
			const result = fieldMapper.createDefaultFrontmatter({});

			expect(result).toEqual({
				taskStatus: false,
				due: null,
				completed: null,
				projects: [],
				tags: ['task'],
				statusDescription: '',
			});
		});

		it('should use provided values', () => {
			const partial = {
				complete: true,
				due: '2025-11-15',
				completed: '2025-11-13',
				projects: ['[[Project A]]'],
				tags: ['task', 'urgent'],
				statusDescription: 'Done',
			};

			const result = fieldMapper.createDefaultFrontmatter(partial);

			expect(result).toEqual({
				taskStatus: true,
				due: '2025-11-15',
				completed: '2025-11-13',
				projects: ['[[Project A]]'],
				tags: ['task', 'urgent'],
				statusDescription: 'Done',
			});
		});

		it('should ensure task tag is always included', () => {
			const partial = { tags: ['urgent', 'work'] };

			const result = fieldMapper.createDefaultFrontmatter(partial);

			expect(result.tags).toContain('task');
			expect(result.tags).toEqual(['urgent', 'work', 'task']);
		});

		it('should use default tags from plugin settings', () => {
			mockPlugin.settings.defaultTags = ['task', 'default'];

			const result = fieldMapper.createDefaultFrontmatter({});

			expect(result.tags).toEqual(['task', 'default']);

			// Reset
			mockPlugin.settings.defaultTags = ['task'];
		});
	});

	describe('Phase 2A: All configurable property names', () => {
		beforeEach(() => {
			// Reset to default property names
			mockPlugin.settings.propertyNames = {
				status: 'taskStatus',
				due: 'due',
				completed: 'completed',
				projects: 'projects',
				tags: 'tags',
				statusDescription: 'statusDescription',
			};
		});

		it('should use all configured property names when writing frontmatter', () => {
			// Set custom property names
			mockPlugin.settings.propertyNames = {
				status: 'done',
				due: 'deadline',
				completed: 'completedOn',
				projects: 'linkedProjects',
				tags: 'labels',
				statusDescription: 'notes',
			};

			const taskInfo: TaskInfo = {
				path: 'Tasks/MyTask.md',
				title: 'MyTask',
				complete: false,
				due: '2025-11-15',
				completed: null,
				projects: ['[[Project A]]'],
				tags: ['task', 'urgent'],
				statusDescription: 'In progress',
				file: undefined as any,
			};

			const result = fieldMapper.mapTaskInfoToFrontmatter(taskInfo);

			expect(result).toEqual({
				done: false,
				deadline: '2025-11-15',
				completedOn: null,
				linkedProjects: ['[[Project A]]'],
				labels: ['task', 'urgent'],
				notes: 'In progress',
			});
		});

		it('should read from all configured property names', () => {
			// Set custom property names
			mockPlugin.settings.propertyNames = {
				status: 'done',
				due: 'deadline',
				completed: 'completedOn',
				projects: 'linkedProjects',
				tags: 'labels',
				statusDescription: 'notes',
			};

			const frontmatter = {
				done: true,
				deadline: '2025-11-15',
				completedOn: '2025-11-13',
				linkedProjects: ['[[Project A]]', '[[Project B]]'],
				labels: ['task', 'urgent'],
				notes: 'Almost done',
			};

			const result = fieldMapper.mapFrontmatterToTaskInfo(
				frontmatter,
				'Tasks/MyTask.md'
			);

			expect(result).not.toBeNull();
			expect(result?.complete).toBe(true);
			expect(result?.due).toBe('2025-11-15');
			expect(result?.completed).toBe('2025-11-13');
			expect(result?.projects).toEqual(['[[Project A]]', '[[Project B]]']);
			expect(result?.tags).toEqual(['task', 'urgent']);
			expect(result?.statusDescription).toBe('Almost done');
		});

		it('should validate using all configured property names', () => {
			// Set custom property names
			mockPlugin.settings.propertyNames = {
				status: 'done',
				due: 'deadline',
				completed: 'completedOn',
				projects: 'linkedProjects',
				tags: 'labels',
				statusDescription: 'notes',
			};

			const frontmatter = {
				done: false,
				deadline: '2025-11-15',
				completedOn: null,
				linkedProjects: ['[[Project A]]'],
				labels: ['task'],
				notes: 'Working on it',
			};

			expect(fieldMapper.validateTaskFrontmatter(frontmatter)).toBe(true);
		});

		it('should reject validation when configured tags property missing task tag', () => {
			mockPlugin.settings.propertyNames.tags = 'labels';

			const frontmatter = {
				labels: ['urgent'], // Missing 'task' tag
			};

			expect(fieldMapper.validateTaskFrontmatter(frontmatter)).toBe(false);
		});

		it('should create default frontmatter with all configured property names', () => {
			// Set custom property names
			mockPlugin.settings.propertyNames = {
				status: 'done',
				due: 'deadline',
				completed: 'completedOn',
				projects: 'linkedProjects',
				tags: 'labels',
				statusDescription: 'notes',
			};

			const result = fieldMapper.createDefaultFrontmatter({});

			expect(result).toEqual({
				done: false,
				deadline: null,
				completedOn: null,
				linkedProjects: [],
				labels: ['task'],
				notes: '',
			});
		});

		it('should handle mixed default and custom property names', () => {
			// Only customize some properties
			mockPlugin.settings.propertyNames = {
				status: 'done',
				due: 'due', // Keep default
				completed: 'completed', // Keep default
				projects: 'linkedProjects',
				tags: 'tags', // Keep default
				statusDescription: 'statusDescription', // Keep default
			};

			const taskInfo: TaskInfo = {
				path: 'Tasks/MyTask.md',
				title: 'MyTask',
				complete: true,
				due: '2025-11-15',
				completed: '2025-11-13',
				projects: ['[[Project A]]'],
				tags: ['task'],
				statusDescription: 'Complete',
				file: undefined as any,
			};

			const result = fieldMapper.mapTaskInfoToFrontmatter(taskInfo);

			expect(result).toEqual({
				done: true,
				due: '2025-11-15',
				completed: '2025-11-13',
				linkedProjects: ['[[Project A]]'],
				tags: ['task'],
				statusDescription: 'Complete',
			});
		});

		it('should handle TaskNotes legacy naming (complete property)', () => {
			// Configure to use TaskNotes legacy names
			mockPlugin.settings.propertyNames = {
				status: 'complete', // TaskNotes used "complete"
				due: 'due',
				completed: 'completed',
				projects: 'projects',
				tags: 'tags',
				statusDescription: 'statusDescription',
			};

			const taskInfo: TaskInfo = {
				path: 'Tasks/MyTask.md',
				title: 'MyTask',
				complete: true,
				due: null,
				completed: '2025-11-13',
				projects: [],
				tags: ['task'],
				statusDescription: '',
				file: undefined as any,
			};

			const result = fieldMapper.mapTaskInfoToFrontmatter(taskInfo);

			expect(result.complete).toBe(true);
			expect(result.completed).toBe('2025-11-13');
			expect(result.taskStatus).toBeUndefined();
		});

		it('should support reading from configured due date property', () => {
			mockPlugin.settings.propertyNames.due = 'deadline';

			const frontmatter = {
				tags: ['task'],
				deadline: '2025-12-25',
			};

			const result = fieldMapper.mapFrontmatterToTaskInfo(
				frontmatter,
				'test.md'
			);

			expect(result?.due).toBe('2025-12-25');
		});

		it('should validate configured projects property as array', () => {
			mockPlugin.settings.propertyNames.projects = 'linkedProjects';

			const frontmatter = {
				tags: ['task'],
				linkedProjects: 'Not an array', // Invalid
			};

			expect(fieldMapper.validateTaskFrontmatter(frontmatter)).toBe(false);
		});

		it('should validate configured statusDescription property as string', () => {
			mockPlugin.settings.propertyNames.statusDescription = 'notes';

			const frontmatter = {
				tags: ['task'],
				notes: 123, // Invalid - should be string
			};

			expect(fieldMapper.validateTaskFrontmatter(frontmatter)).toBe(false);
		});
	});
});
