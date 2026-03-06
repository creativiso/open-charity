/** @type {import('jest').Config} */

module.exports = {
  testEnvironment: 'node',
  testTimeout: 15000,
  collectCoverage: true,
  projects: ['<rootDir>/packages/*', '<rootDir>/tests'],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 90,
      lines: 85,
    },
  },
  testMatch: ['<rootDir>/tests/**/*.test.{js,ts}'],
};
