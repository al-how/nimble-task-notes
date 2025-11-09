import { TaskManager } from '../../utils/TaskManager';
import { App, TFile } from 'obsidian';

// Mock plugin
const mockPlugin = {
	settings: {},
} as any;

describe('TaskManager', () => {
	let app: App;
	let taskManager: TaskManager;

	beforeEach(() => {
		app = new App();
		taskManager = new TaskManager(app, mockPlugin);
	});

	describe('isTaskFile', () => {
		it('should return true for frontmatter with task tag', () => {
			const frontmatter = { tags: ['task'] };
			expect(taskManager.isTaskFile(frontmatter)).toBe(true);
		});

		it('should return true for frontmatter with task tag among others', () => {
			const frontmatter = { tags: ['urgent', 'task', 'work'] };
			expect(taskManager.isTaskFile(frontmatter)).toBe(true);
		});

		it('should return false for frontmatter without task tag', () => {
			const frontmatter = { tags: ['urgent', 'work'] };
			expect(taskManager.isTaskFile(frontmatter)).toBe(false);
		});

		it('should return false for null frontmatter', () => {
			expect(taskManager.isTaskFile(null)).toBe(false);
		});

		it('should return false for frontmatter with non-array tags', () => {
			const frontmatter = { tags: 'task' };
			expect(taskManager.isTaskFile(frontmatter)).toBe(false);
		});

		it('should return false for frontmatter without tags field', () => {
			const frontmatter = { title: 'Test' };
			expect(taskManager.isTaskFile(frontmatter)).toBe(false);
		});
	});

	describe('getTaskInfo', () => {
		it('should return null for non-existent file', () => {
			const result = taskManager.getTaskInfo('non-existent.md');
			expect(result).toBeNull();
		});

		it('should return null for file without frontmatter', () => {
			const file = new TFile('test.md');
			app.vault.files.set('test.md', file);
			// No cache set, so no frontmatter
			const result = taskManager.getTaskInfo('test.md');
			expect(result).toBeNull();
		});

		it('should return null for file without task tag', () => {
			const file = new TFile('test.md');
			app.vault.files.set('test.md', file);
			app.metadataCache.setFileCache(file, {
				frontmatter: { tags: ['work'] },
			});
			const result = taskManager.getTaskInfo('test.md');
			expect(result).toBeNull();
		});

		it('should return TaskInfo for valid task file', () => {
			const file = new TFile('Tasks/MyTask.md');
			app.vault.files.set('Tasks/MyTask.md', file);
			app.metadataCache.setFileCache(file, {
				frontmatter: {
					tags: ['task'],
					complete: false,
					due: '2025-11-15',
					projects: ['[[Project A]]'],
					statusDescription: 'In progress',
				},
			});

			const result = taskManager.getTaskInfo('Tasks/MyTask.md');
			expect(result).not.toBeNull();
			expect(result?.title).toBe('MyTask');
			expect(result?.path).toBe('Tasks/MyTask.md');
			expect(result?.complete).toBe(false);
			expect(result?.due).toBe('2025-11-15');
			expect(result?.projects).toEqual(['[[Project A]]']);
			expect(result?.tags).toEqual(['task']);
			expect(result?.statusDescription).toBe('In progress');
			expect(result?.file).toBe(file);
		});

		it('should handle missing complete field (default to false)', () => {
			const file = new TFile('test.md');
			app.vault.files.set('test.md', file);
			app.metadataCache.setFileCache(file, {
				frontmatter: { tags: ['task'] },
			});

			const result = taskManager.getTaskInfo('test.md');
			expect(result?.complete).toBe(false);
		});

		it('should handle invalid due date (set to null)', () => {
			const file = new TFile('test.md');
			app.vault.files.set('test.md', file);
			app.metadataCache.setFileCache(file, {
				frontmatter: { tags: ['task'], due: 'invalid-date' },
			});

			const result = taskManager.getTaskInfo('test.md');
			expect(result?.due).toBeNull();
		});

		it('should convert Date object to YYYY-MM-DD string', () => {
			const file = new TFile('test.md');
			app.vault.files.set('test.md', file);
			// Use a Date object without timezone issues
			const testDate = new Date(2025, 10, 15); // Month is 0-indexed
			app.metadataCache.setFileCache(file, {
				frontmatter: { tags: ['task'], due: testDate },
			});

			const result = taskManager.getTaskInfo('test.md');
			expect(result?.due).toBe('2025-11-15');
		});

		it('should filter out non-wikilink projects', () => {
			const file = new TFile('test.md');
			app.vault.files.set('test.md', file);
			app.metadataCache.setFileCache(file, {
				frontmatter: {
					tags: ['task'],
					projects: ['[[Valid]]', 'Invalid', '[[Also Valid]]'],
				},
			});

			const result = taskManager.getTaskInfo('test.md');
			expect(result?.projects).toEqual(['[[Valid]]', '[[Also Valid]]']);
		});

		it('should filter out non-string tags', () => {
			const file = new TFile('test.md');
			app.vault.files.set('test.md', file);
			app.metadataCache.setFileCache(file, {
				frontmatter: { tags: ['task', 'valid', 123, null] },
			});

			const result = taskManager.getTaskInfo('test.md');
			expect(result?.tags).toEqual(['task', 'valid']);
		});

		it('should handle empty statusDescription', () => {
			const file = new TFile('test.md');
			app.vault.files.set('test.md', file);
			app.metadataCache.setFileCache(file, {
				frontmatter: { tags: ['task'] },
			});

			const result = taskManager.getTaskInfo('test.md');
			expect(result?.statusDescription).toBe('');
		});
	});

	describe('getAllTasks', () => {
		it('should return empty array when no tasks exist', () => {
			const result = taskManager.getAllTasks();
			expect(result).toEqual([]);
		});

		it('should return all task files', () => {
			const task1 = new TFile('task1.md');
			const task2 = new TFile('task2.md');
			const nonTask = new TFile('nontask.md');

			app.vault.files.set('task1.md', task1);
			app.vault.files.set('task2.md', task2);
			app.vault.files.set('nontask.md', nonTask);

			app.metadataCache.setFileCache(task1, {
				frontmatter: { tags: ['task'] },
			});
			app.metadataCache.setFileCache(task2, {
				frontmatter: { tags: ['task'] },
			});
			app.metadataCache.setFileCache(nonTask, {
				frontmatter: { tags: ['note'] },
			});

			const result = taskManager.getAllTasks();
			expect(result).toHaveLength(2);
			expect(result[0].path).toBe('task1.md');
			expect(result[1].path).toBe('task2.md');
		});
	});

	describe('getTasksForDate', () => {
		beforeEach(() => {
			const task1 = new TFile('task1.md');
			const task2 = new TFile('task2.md');
			const task3 = new TFile('task3.md');

			app.vault.files.set('task1.md', task1);
			app.vault.files.set('task2.md', task2);
			app.vault.files.set('task3.md', task3);

			app.metadataCache.setFileCache(task1, {
				frontmatter: { tags: ['task'], due: '2025-11-15' },
			});
			app.metadataCache.setFileCache(task2, {
				frontmatter: { tags: ['task'], due: '2025-11-15' },
			});
			app.metadataCache.setFileCache(task3, {
				frontmatter: { tags: ['task'], due: '2025-11-16' },
			});
		});

		it('should return tasks for specific date', () => {
			const result = taskManager.getTasksForDate('2025-11-15');
			expect(result).toHaveLength(2);
			expect(result).toContain('task1.md');
			expect(result).toContain('task2.md');
		});

		it('should return empty array for date with no tasks', () => {
			const result = taskManager.getTasksForDate('2025-12-01');
			expect(result).toEqual([]);
		});
	});

	describe('getTasksDueInRange', () => {
		beforeEach(() => {
			const task1 = new TFile('task1.md');
			const task2 = new TFile('task2.md');
			const task3 = new TFile('task3.md');

			app.vault.files.set('task1.md', task1);
			app.vault.files.set('task2.md', task2);
			app.vault.files.set('task3.md', task3);

			app.metadataCache.setFileCache(task1, {
				frontmatter: { tags: ['task'], due: '2025-11-10' },
			});
			app.metadataCache.setFileCache(task2, {
				frontmatter: { tags: ['task'], due: '2025-11-15' },
			});
			app.metadataCache.setFileCache(task3, {
				frontmatter: { tags: ['task'], due: '2025-11-20' },
			});
		});

		it('should return tasks within date range', () => {
			const result = taskManager.getTasksDueInRange('2025-11-10', '2025-11-15');
			expect(result).toHaveLength(2);
			expect(result[0].path).toBe('task1.md');
			expect(result[1].path).toBe('task2.md');
		});

		it('should include boundary dates', () => {
			const result = taskManager.getTasksDueInRange('2025-11-15', '2025-11-20');
			expect(result).toHaveLength(2);
			expect(result[0].path).toBe('task2.md');
			expect(result[1].path).toBe('task3.md');
		});

		it('should return empty array for range with no tasks', () => {
			const result = taskManager.getTasksDueInRange('2025-12-01', '2025-12-31');
			expect(result).toEqual([]);
		});
	});

	describe('getIncompleteTasks', () => {
		it('should return only incomplete tasks', () => {
			const task1 = new TFile('task1.md');
			const task2 = new TFile('task2.md');

			app.vault.files.set('task1.md', task1);
			app.vault.files.set('task2.md', task2);

			app.metadataCache.setFileCache(task1, {
				frontmatter: { tags: ['task'], complete: false },
			});
			app.metadataCache.setFileCache(task2, {
				frontmatter: { tags: ['task'], complete: true },
			});

			const result = taskManager.getIncompleteTasks();
			expect(result).toHaveLength(1);
			expect(result[0].path).toBe('task1.md');
			expect(result[0].complete).toBe(false);
		});
	});

	describe('getCompleteTasks', () => {
		it('should return only complete tasks', () => {
			const task1 = new TFile('task1.md');
			const task2 = new TFile('task2.md');

			app.vault.files.set('task1.md', task1);
			app.vault.files.set('task2.md', task2);

			app.metadataCache.setFileCache(task1, {
				frontmatter: { tags: ['task'], complete: false },
			});
			app.metadataCache.setFileCache(task2, {
				frontmatter: { tags: ['task'], complete: true },
			});

			const result = taskManager.getCompleteTasks();
			expect(result).toHaveLength(1);
			expect(result[0].path).toBe('task2.md');
			expect(result[0].complete).toBe(true);
		});
	});

	describe('getTasksForProject', () => {
		it('should return tasks for specific project', () => {
			const task1 = new TFile('task1.md');
			const task2 = new TFile('task2.md');

			app.vault.files.set('task1.md', task1);
			app.vault.files.set('task2.md', task2);

			app.metadataCache.setFileCache(task1, {
				frontmatter: { tags: ['task'], projects: ['[[Project A]]'] },
			});
			app.metadataCache.setFileCache(task2, {
				frontmatter: { tags: ['task'], projects: ['[[Project B]]'] },
			});

			const result = taskManager.getTasksForProject('[[Project A]]');
			expect(result).toHaveLength(1);
			expect(result[0].path).toBe('task1.md');
		});

		it('should handle tasks with multiple projects', () => {
			const task1 = new TFile('task1.md');

			app.vault.files.set('task1.md', task1);

			app.metadataCache.setFileCache(task1, {
				frontmatter: {
					tags: ['task'],
					projects: ['[[Project A]]', '[[Project B]]'],
				},
			});

			const result = taskManager.getTasksForProject('[[Project A]]');
			expect(result).toHaveLength(1);
			expect(result[0].path).toBe('task1.md');
		});
	});

	describe('getTasksWithTag', () => {
		it('should return tasks with specific tag', () => {
			const task1 = new TFile('task1.md');
			const task2 = new TFile('task2.md');

			app.vault.files.set('task1.md', task1);
			app.vault.files.set('task2.md', task2);

			app.metadataCache.setFileCache(task1, {
				frontmatter: { tags: ['task', 'urgent'] },
			});
			app.metadataCache.setFileCache(task2, {
				frontmatter: { tags: ['task', 'work'] },
			});

			const result = taskManager.getTasksWithTag('urgent');
			expect(result).toHaveLength(1);
			expect(result[0].path).toBe('task1.md');
		});
	});

	describe('getOverdueTasks', () => {
		it('should return incomplete tasks with past due date', () => {
			const task1 = new TFile('task1.md');
			const task2 = new TFile('task2.md');
			const task3 = new TFile('task3.md');

			app.vault.files.set('task1.md', task1);
			app.vault.files.set('task2.md', task2);
			app.vault.files.set('task3.md', task3);

			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			const yesterdayStr = yesterday.toISOString().split('T')[0];

			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			const tomorrowStr = tomorrow.toISOString().split('T')[0];

			app.metadataCache.setFileCache(task1, {
				frontmatter: { tags: ['task'], due: yesterdayStr, complete: false },
			});
			app.metadataCache.setFileCache(task2, {
				frontmatter: { tags: ['task'], due: yesterdayStr, complete: true },
			});
			app.metadataCache.setFileCache(task3, {
				frontmatter: { tags: ['task'], due: tomorrowStr, complete: false },
			});

			const result = taskManager.getOverdueTasks();
			expect(result).toHaveLength(1);
			expect(result[0].path).toBe('task1.md');
			expect(result[0].complete).toBe(false);
		});
	});
});
