import { NaturalLanguageParser } from '../../services/NaturalLanguageParser';

describe('NaturalLanguageParser', () => {
	let parser: NaturalLanguageParser;

	beforeEach(() => {
		parser = new NaturalLanguageParser();
	});

	describe('parseDateStrict', () => {
		it('should parse valid YYYY-MM-DD date', () => {
			const date = parser.parseDateStrict('2025-11-15');

			expect(date).not.toBeNull();
			expect(date?.getFullYear()).toBe(2025);
			expect(date?.getMonth()).toBe(10); // 0-indexed (November)
			expect(date?.getDate()).toBe(15);
		});

		it('should return null for invalid format', () => {
			expect(parser.parseDateStrict('11/15/2025')).toBeNull();
			expect(parser.parseDateStrict('2025-11-15 10:00')).toBeNull();
			expect(parser.parseDateStrict('Nov 15, 2025')).toBeNull();
			expect(parser.parseDateStrict('invalid')).toBeNull();
		});

		it('should return null for invalid dates', () => {
			expect(parser.parseDateStrict('2025-02-31')).toBeNull(); // Feb 31
			expect(parser.parseDateStrict('2025-13-01')).toBeNull(); // Month 13
			expect(parser.parseDateStrict('2025-00-01')).toBeNull(); // Month 0
			expect(parser.parseDateStrict('2025-11-32')).toBeNull(); // Day 32
		});

		it('should handle leap years correctly', () => {
			// 2024 is a leap year
			const leapDate = parser.parseDateStrict('2024-02-29');
			expect(leapDate).not.toBeNull();

			// 2025 is not a leap year
			const nonLeapDate = parser.parseDateStrict('2025-02-29');
			expect(nonLeapDate).toBeNull();
		});

		it('should return null for empty input', () => {
			expect(parser.parseDateStrict('')).toBeNull();
		});
	});

	describe('formatDateForFrontmatter', () => {
		it('should format date as YYYY-MM-DD', () => {
			const date = new Date(2025, 10, 15); // Nov 15, 2025
			const result = parser.formatDateForFrontmatter(date);

			expect(result).toBe('2025-11-15');
		});

		it('should pad single-digit months and days', () => {
			const date = new Date(2025, 0, 5); // Jan 5, 2025
			const result = parser.formatDateForFrontmatter(date);

			expect(result).toBe('2025-01-05');
		});

		it('should handle end of year', () => {
			const date = new Date(2025, 11, 31); // Dec 31, 2025
			const result = parser.formatDateForFrontmatter(date);

			expect(result).toBe('2025-12-31');
		});
	});

	describe('parseDate', () => {
		it('should parse YYYY-MM-DD format (fallback)', async () => {
			const date = await parser.parseDate('2025-11-15');

			expect(date).not.toBeNull();
			expect(date?.getFullYear()).toBe(2025);
			expect(date?.getMonth()).toBe(10);
			expect(date?.getDate()).toBe(15);
		});

		it('should return null for empty input', async () => {
			expect(await parser.parseDate('')).toBeNull();
			expect(await parser.parseDate('   ')).toBeNull();
		});

		it('should return null for invalid input', async () => {
			const result = await parser.parseDate('asdfasdf');
			expect(result).toBeNull();
		});

		// Note: Natural language tests would require chrono-node to be available
		// We're testing the fallback behavior when chrono is not available
	});

	describe('formatDatePreview', () => {
		it('should format date with emoji prefix', async () => {
			const preview = await parser.formatDatePreview('2025-11-15');

			expect(preview).toMatch(/📅 \w+, \w+ \d+, \d{4}/);
			expect(preview).toContain('2025');
		});

		it('should return empty string for invalid input', async () => {
			const preview = await parser.formatDatePreview('invalid');

			expect(preview).toBe('');
		});

		it('should return empty string for empty input', async () => {
			const preview = await parser.formatDatePreview('');

			expect(preview).toBe('');
		});
	});

	describe('isNaturalLanguageAvailable', () => {
		it('should check chrono-node availability', async () => {
			// This will attempt to load chrono-node
			// In a real environment, it should succeed
			// In test environment, it depends on module availability
			const available = await parser.isNaturalLanguageAvailable();

			// Should be boolean
			expect(typeof available).toBe('boolean');
		});
	});

	describe('edge cases', () => {
		it('should handle dates at year boundaries', async () => {
			const newYear = await parser.parseDate('2025-01-01');
			const endYear = await parser.parseDate('2025-12-31');

			expect(newYear).not.toBeNull();
			expect(endYear).not.toBeNull();
			expect(newYear?.getMonth()).toBe(0);
			expect(endYear?.getMonth()).toBe(11);
		});

		it('should handle dates with leading zeros', () => {
			const date = parser.parseDateStrict('2025-01-05');

			expect(date).not.toBeNull();
			expect(date?.getMonth()).toBe(0);
			expect(date?.getDate()).toBe(5);
		});

		it('should reject dates with extra characters', () => {
			expect(parser.parseDateStrict('2025-11-15 extra')).toBeNull();
			expect(parser.parseDateStrict('x2025-11-15')).toBeNull();
		});
	});

	describe('round-trip formatting', () => {
		it('should maintain date integrity through parse and format', async () => {
			const original = '2025-11-15';
			const parsed = await parser.parseDate(original);
			const formatted = parser.formatDateForFrontmatter(parsed!);

			expect(formatted).toBe(original);
		});

		it('should format dates consistently', () => {
			const date1 = new Date(2025, 10, 15);
			const date2 = new Date(2025, 10, 15);

			const formatted1 = parser.formatDateForFrontmatter(date1);
			const formatted2 = parser.formatDateForFrontmatter(date2);

			expect(formatted1).toBe(formatted2);
		});
	});
});
