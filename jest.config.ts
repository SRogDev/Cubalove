import type { Config } from "jest";
import nextJest from "next/jest";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
    testEnvironment: "jsdom",
    setupFiles: ["<rootDir>/tests/setup.ts"],
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

export default createJestConfig(config);
