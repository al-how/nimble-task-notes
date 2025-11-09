module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['<rootDir>/src'],
	testMatch: ['**/__tests__/**/*.test.ts'],
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
	collectCoverageFrom: [
		'src/**/*.ts',
		'!src/**/*.d.ts',
		'!src/**/__tests__/**',
	],
	coverageDirectory: 'coverage',
	coverageReporters: ['text', 'lcov', 'html'],
	transform: {
		'^.+\\.ts$': 'ts-jest',
	},
	moduleNameMapper: {
		// Mock Obsidian modules
		'^obsidian$': '<rootDir>/src/__tests__/__mocks__/obsidian.ts',
	},
	globals: {
		'ts-jest': {
			tsconfig: {
				esModuleInterop: true,
				allowSyntheticDefaultImports: true,
			},
		},
	},
};
