import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

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

function pluginNames(config) {
  return new Set(
    config.flatMap((entry) => Object.keys(entry.plugins ?? {})),
  );
}

function mergedRules(config) {
  return Object.assign({}, ...config.map((entry) => entry.rules ?? {}));
}

test("exports every public ESLint preset", () => {
  assert.deepEqual(
    Object.keys(packageJson.exports).sort(),
    ["./base", "./next-js", "./react-internal"].sort(),
  );
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
});
