import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: "v8",
  // Use Stryker's Jest environment wrapper for mutation testing compatibility
  // This is compatible with normal Jest runs and enables Stryker's coverage analysis
  testEnvironment: "@stryker-mutator/jest-runner/jest-env/jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  // Only run unit, api, and integration tests with Jest
  testMatch: [
    "**/tests/unit/**/*.test.{ts,tsx}",
    "**/tests/api/**/*.test.{ts,tsx}",
    "**/tests/integration/**/*.test.{ts,tsx}",
    "**/__tests__/**/*.test.{ts,tsx}",
  ],

  // Exclude e2e tests (run separately with Playwright)
  testPathIgnorePatterns: ["/node_modules/", "/.next/", "/tests/e2e/"],

  // Allow testing of app, components, lib directories
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },

  // ESM transformation for dependencies that need it

  // Coverage thresholds - enforced during test runs
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);
