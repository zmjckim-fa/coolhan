module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/src/__tests__/**/*.test.js'],
  // The private folder holds survey material and throwaway projects with their own packages: never part of this suite.
  modulePathIgnorePatterns: ['<rootDir>/.coolhan-private/'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/.coolhan-private/'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/__tests__/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  verbose: true,
  bail: false,
  maxWorkers: 1
};
