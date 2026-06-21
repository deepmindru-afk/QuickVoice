import tseslint from "typescript-eslint";
import { config as baseConfig } from "./base.js";

const typeCheckedRules = tseslint.configs.recommendedTypeCheckedOnly.find(
  (entry) => entry.name === "typescript-eslint/recommended-type-checked-only",
);

if (!typeCheckedRules) {
  throw new Error("typescript-eslint type-checked rules are unavailable.");
}

/**
 * An opt-in ESLint configuration for TypeScript workspaces that can afford
 * type-aware linting. Run from a workspace with a discoverable tsconfig.json.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const typeCheckedConfig = [
  ...baseConfig,
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
  {
    ...typeCheckedRules,
    files: ["**/*.{ts,tsx,mts,cts}"],
  },
];
