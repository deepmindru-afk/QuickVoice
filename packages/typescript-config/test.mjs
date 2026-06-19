import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const packageJson = readJson("package.json");

function readJson(path) {
  return JSON.parse(readFileSync(new URL(`./${path}`, import.meta.url), "utf8"));
}

function normalizedLibs(config) {
  return (config.compilerOptions?.lib ?? []).map((lib) => lib.toLowerCase());
}

test("exports every supported TypeScript preset", () => {
  assert.deepEqual(packageJson.exports, {
    "./base.json": "./base.json",
    "./browser.json": "./browser.json",
    "./nextjs.json": "./nextjs.json",
    "./node.json": "./node.json",
    "./react-library.json": "./react-library.json",
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

test("strict optional preset enables additional safety checks", () => {
  const strictOptions = readJson("strict.json").compilerOptions;
  assert.equal(strictOptions.noUnusedLocals, true);
  assert.equal(strictOptions.noUnusedParameters, true);
  assert.equal(strictOptions.noImplicitReturns, true);
  assert.equal(strictOptions.noFallthroughCasesInSwitch, true);
  assert.equal(strictOptions.exactOptionalPropertyTypes, true);
});
