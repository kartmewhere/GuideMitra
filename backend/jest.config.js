module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/**/__tests__/**',
    '!src/scripts/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testMatch: [
    '**/__tests__/**/*.{js,jsx}',
    '**/?(*.)+(spec|test).{js,jsx}',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/prisma/',
  ],
  verbose: true,
  maxWorkers: '50%',
};

