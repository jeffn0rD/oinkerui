module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['backend/src/**/*.js'],
  testMatch: ['**/backend/tests/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '/frontend/'],
};
