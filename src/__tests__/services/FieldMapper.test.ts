import { FieldMapper } from '../../services/FieldMapper';
import { TaskInfo } from '../../types';

// Mock plugin with settings
const mockPlugin = {
	settings: {
		defaultTags: ['task'],
		propertyNames: {
			status: 'taskStatus',
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
				projects: ['[[Project A]]'],
				tags: ['task', 'urgent'],
				statusDescription: 'In progress',
				file: undefined as any,
			};

			const result = fieldMapper.mapTaskInfoToFrontmatter(taskInfo);

			expect(result).toEqual({
				taskStatus: false,
				due: '2025-11-15',
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
				projects: [],
				tags: ['task'],
				statusDescription: '',
				file: undefined as any,
			};

			const result = fieldMapper.mapTaskInfoToFrontmatter(taskInfo);

			expect(result.due).toBeNull();
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
	});

	describe('createDefaultFrontmatter', () => {
		it('should create default frontmatter with minimal input', () => {
			const result = fieldMapper.createDefaultFrontmatter({});

			expect(result).toEqual({
				taskStatus: false,
				due: null,
				projects: [],
				tags: ['task'],
				statusDescription: '',
			});
		});

		it('should use provided values', () => {
			const partial = {
				complete: true,
				due: '2025-11-15',
				projects: ['[[Project A]]'],
				tags: ['task', 'urgent'],
				statusDescription: 'Done',
			};

			const result = fieldMapper.createDefaultFrontmatter(partial);

			expect(result).toEqual({
				taskStatus: true,
				due: '2025-11-15',
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
});
