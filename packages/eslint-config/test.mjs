import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

import { config as baseConfig } from "./base.js";
import { nextJsConfig } from "./next.js";
import { config as reactConfig } from "./react-internal.js";

const packageJson = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
);
const rootPackageJson = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
);
const typescriptConfigPackageJson = JSON.parse(
  readFileSync(
    new URL("../typescript-config/package.json", import.meta.url),
    "utf8",
  ),
);
const readme = readFileSync(new URL("./README.md", import.meta.url), "utf8");

function readAppPackageJson(appName) {
  return JSON.parse(
    readFileSync(
      new URL(`../../apps/${appName}/package.json`, import.meta.url),
      "utf8",
    ),
  );
}

function pluginNames(config) {
  return new Set(config.flatMap((entry) => Object.keys(entry.plugins ?? {})));
}

function mergedRules(config) {
  return Object.assign({}, ...config.map((entry) => entry.rules ?? {}));
}

function countEntry(config, target) {
  return config.filter((entry) => entry === target).length;
}

test("exports every public ESLint preset", () => {
  assert.deepEqual(
    Object.keys(packageJson.exports).sort(),
    [
      "./base",
      "./next-js",
      "./nextjs",
      "./react-internal",
      "./react-library",
      "./type-checked",
    ].sort(),
  );
});

test("shared Next lint dependency stays aligned with workspace Next apps", () => {
  const sharedNextLintVersion =
    packageJson.devDependencies["eslint-config-next"];

  for (const appName of ["console", "web"]) {
    const appPackageJson = readAppPackageJson(appName);

    assert.equal(
      sharedNextLintVersion,
      appPackageJson.devDependencies["eslint-config-next"],
      appName,
    );
    assert.equal(
      appPackageJson.devDependencies["eslint-config-next"],
      appPackageJson.dependencies.next,
      appName,
    );
  }
});

test("base preset fails undeclared Turbo env vars and does not downgrade errors", () => {
  assert.equal(
    mergedRules(baseConfig)["turbo/no-undeclared-env-vars"],
    "error",
  );
  assert.equal(pluginNames(baseConfig).has("onlyWarn"), false);
});

test("derived presets do not include the warning-only plugin", () => {
  assert.equal(pluginNames(nextJsConfig).has("onlyWarn"), false);
  assert.equal(pluginNames(reactConfig).has("onlyWarn"), false);
});

test("React preset composes the base layers once", () => {
  assert.equal(countEntry(reactConfig, js.configs.recommended), 1);
  assert.equal(countEntry(reactConfig, eslintConfigPrettier), 1);

  for (const entry of tseslint.configs.recommended) {
    assert.equal(countEntry(reactConfig, entry), 1, entry.name);
  }
});

test("exports an opt-in type-aware ESLint preset", async () => {
  assert.equal(packageJson.exports["./type-checked"], "./type-checked.js");

  const { typeCheckedConfig } = await import("./type-checked.js");
  const rules = mergedRules(typeCheckedConfig);

  assert.equal(Array.isArray(typeCheckedConfig), true);
  assert.equal(pluginNames(typeCheckedConfig).has("onlyWarn"), false);
  assert.equal(
    typeCheckedConfig.some(
      (entry) => entry.languageOptions?.parserOptions?.projectService === true,
    ),
    true,
  );
  assert.equal(rules["@typescript-eslint/no-floating-promises"], "error");
});

test("Next preset preserves the same app lint coverage as eslint-config-next", () => {
  const plugins = pluginNames(nextJsConfig);
  for (const pluginName of [
    "@next/next",
    "@typescript-eslint",
    "import",
    "jsx-a11y",
    "react",
    "react-hooks",
  ]) {
    assert.equal(plugins.has(pluginName), true, pluginName);
  }

  const rules = mergedRules(nextJsConfig);
  assert.equal(Object.hasOwn(rules, "@next/next/no-html-link-for-pages"), true);
  assert.equal(Object.hasOwn(rules, "jsx-a11y/alt-text"), true);
});

test("workspace Next apps consume the shared preset with a strict warning gate", () => {
  for (const appName of ["console", "web"]) {
    const appConfig = readFileSync(
      new URL(`../../apps/${appName}/eslint.config.mjs`, import.meta.url),
      "utf8",
    );
    const appPackageJson = JSON.parse(
      readFileSync(
        new URL(`../../apps/${appName}/package.json`, import.meta.url),
        "utf8",
      ),
    );

    assert.match(appConfig, /@repo\/eslint-config\/next-js/);
    assert.doesNotMatch(appConfig, /eslint-config-next/);
    assert.equal(appPackageJson.scripts.lint, "eslint --max-warnings=0");
    assert.equal(
      appPackageJson.devDependencies["@repo/eslint-config"],
      "workspace:*",
    );
    assert.equal(
      appPackageJson.devDependencies["@repo/typescript-config"],
      "workspace:*",
    );
  }
});

test("root config validation task runs both shared config package checks", () => {
  assert.equal(
    rootPackageJson.scripts["check:configs"],
    "pnpm --filter @repo/eslint-config lint && pnpm --filter @repo/typescript-config lint",
  );
  assert.match(rootPackageJson.scripts["ci:local"], /pnpm check:configs/);
  assert.match(packageJson.scripts.lint, /node --test \.\/test\.mjs/);
  assert.match(
    typescriptConfigPackageJson.scripts.lint,
    /node --test \.\/test\.mjs/,
  );

  for (const extension of ["js", "mjs", "json", "ts", "tsx", "md"]) {
    assert.match(
      rootPackageJson.scripts.format,
      new RegExp(`\\b${extension}\\b`),
    );
  }
});

test("README documents naming aliases, type-aware usage, and setup errors", () => {
  assert.match(readme, /## Preset Naming/i);
  assert.match(readme, /@repo\/eslint-config\/nextjs/);
  assert.match(readme, /@repo\/eslint-config\/react-library/);
  assert.match(readme, /@repo\/eslint-config\/type-checked/);
  assert.match(readme, /## Troubleshooting/i);
  assert.match(readme, /ERR_PACKAGE_PATH_NOT_EXPORTED/);
  assert.match(readme, /version skew/i);
});
