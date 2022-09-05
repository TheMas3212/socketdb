module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageDirectory: "./coverage",
  collectCoverageFrom: [
    "./packages/**/src/**/*.ts"
  ]
};