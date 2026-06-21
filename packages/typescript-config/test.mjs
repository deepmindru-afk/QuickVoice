import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const packageJson = readJson("package.json");
const readme = readFileSync(new URL("./README.md", import.meta.url), "utf8");

function readJson(path) {
  return JSON.parse(
    readFileSync(new URL(`./${path}`, import.meta.url), "utf8"),
  );
}

function readAppPackageJson(appName) {
  return JSON.parse(
    readFileSync(
      new URL(`../../apps/${appName}/package.json`, import.meta.url),
      "utf8",
    ),
  );
}

function normalizedLibs(config) {
  return (config.compilerOptions?.lib ?? []).map((lib) => lib.toLowerCase());
}

test("exports every supported TypeScript preset", () => {
  assert.deepEqual(packageJson.exports, {
    "./base": "./base.json",
    "./base.json": "./base.json",
    "./browser": "./browser.json",
    "./browser.json": "./browser.json",
    "./next-js": "./nextjs.json",
    "./nextjs": "./nextjs.json",
    "./nextjs.json": "./nextjs.json",
    "./node": "./node.json",
    "./node.json": "./node.json",
    "./react-internal": "./react-library.json",
    "./react-library": "./react-library.json",
    "./react-library.json": "./react-library.json",
    "./strict": "./strict.json",
    "./strict.json": "./strict.json",
  });
});

test("every exported TypeScript preset parses as JSON", () => {
  for (const target of Object.values(packageJson.exports)) {
    const config = readJson(target);
    assert.equal(typeof config.compilerOptions, "object", target);
  }
});

test("base preset is runtime-neutral", () => {
  const baseConfig = readJson("base.json");
  assert.deepEqual(normalizedLibs(baseConfig), ["es2022"]);
});

test("runtime presets opt into browser and Node globals explicitly", () => {
  const browserConfig = readJson("browser.json");
  assert.deepEqual(normalizedLibs(browserConfig), [
    "es2022",
    "dom",
    "dom.iterable",
  ]);

  const nodeConfig = readJson("node.json");
  assert.deepEqual(normalizedLibs(nodeConfig), ["es2022"]);
  assert.deepEqual(nodeConfig.compilerOptions.types, ["node"]);
});

test("framework presets extend the browser runtime preset", () => {
  assert.equal(readJson("nextjs.json").extends, "./browser.json");
  assert.equal(readJson("react-library.json").extends, "./browser.json");
});

test("Next app manifests declare the shared TypeScript config package", () => {
  for (const appName of ["console", "web"]) {
    assert.equal(
      readAppPackageJson(appName).devDependencies["@repo/typescript-config"],
      "workspace:*",
      appName,
    );
  }
});

test("strict optional preset enables additional safety checks", () => {
  const strictOptions = readJson("strict.json").compilerOptions;
  assert.equal(strictOptions.noUnusedLocals, true);
  assert.equal(strictOptions.noUnusedParameters, true);
  assert.equal(strictOptions.noImplicitReturns, true);
  assert.equal(strictOptions.noFallthroughCasesInSwitch, true);
  assert.equal(strictOptions.exactOptionalPropertyTypes, true);
});

test("README documents naming aliases and common setup errors", () => {
  assert.match(readme, /## Preset Naming/i);
  assert.match(readme, /@repo\/typescript-config\/next-js/);
  assert.match(readme, /@repo\/typescript-config\/react-library/);
  assert.match(readme, /## Troubleshooting/i);
  assert.match(readme, /ERR_PACKAGE_PATH_NOT_EXPORTED/);
  assert.match(readme, /@types\/node/);
  assert.match(readme, /base/i);
  assert.match(readme, /strict/i);
});
