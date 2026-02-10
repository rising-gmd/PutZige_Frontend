module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/node_modules/', '/e2e/', '/.github/'], 
  moduleFileExtensions: ['ts', 'html', 'js', 'json', 'mjs'],
  transform: {
    '^.+\\.(ts|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage/jest',
  coverageThreshold: {
    global: {
      branches: 42,
      functions: 41,
      lines: 59,
      statements: 59
    }
  }
};