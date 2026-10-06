// Jest config must be CJS: next@16's package.json has no "exports" map,
// so ESM `import "next/jest"` cannot resolve the extensionless subpath
// (ERR_MODULE_NOT_FOUND). CJS require() probes file extensions and works.
const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

const config = {
    // "node": unit tests are pure logic (zod schemas, formatters) with zero
    // DOM usage; jest-environment-jsdom was never installed, so "jsdom"
    // could never resolve here.
    testEnvironment: "node",
    // AfterEnv (not setupFiles): @testing-library/jest-dom extends `expect`
    // at import time, so the test framework globals must exist first.
    setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
    testMatch: ["<rootDir>/tests/unit/**/*.test.{ts,tsx}"],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1",
    },
    collectCoverageFrom: [
        "lib/**/*.ts",
        "app/actions/**/*.ts",
        "!**/*.d.ts",
    ],
};

module.exports = createJestConfig(config);
