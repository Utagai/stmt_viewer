module.exports = {
  // Our E2E test runs npm run so it takes some time...
  slowTestThreshold: 10,
  testPathIgnorePatterns: ['.js'],
  preset: 'ts-jest',
  testEnvironment: 'node',
};
