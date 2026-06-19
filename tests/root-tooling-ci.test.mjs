import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

async function text(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("required CI workflow gates pull requests with the root quality suite", async () => {
  const ci = await text(".github/workflows/ci.yml");

  assert.match(ci, /^name: CI/m);
  assert.match(ci, /pull_request:/);
  assert.match(ci, /workflow_call:/);
  assert.match(ci, /pnpm install --frozen-lockfile/);
  assert.match(ci, /pnpm ci:local/);
  assert.match(ci, /python -m pip install -r requirements\.txt/);
  assert.match(ci, /python -m pip install pytest/);
  assert.match(ci, /docker\/setup-buildx-action@v3/);
  assert.match(ci, /scripts\/ci-docker-build\.sh/);
});

test("security audit fails on high advisories and uses explicit suppressions", async () => {
  const workflow = await text(".github/workflows/security-audit.yml");
  const suppressions = JSON.parse(await text("security/audit-suppressions.json"));

  assert.match(workflow, /pnpm audit:deps/);
  assert.match(workflow, /--audit-level high/);
  assert.ok(Array.isArray(suppressions.suppressions));
  assert.ok(suppressions.suppressions.length > 0);

  const keys = new Set();
  for (const suppression of suppressions.suppressions) {
    assert.match(suppression.id, /^GHSA-|^CVE-|^\d+$/);
    assert.ok(suppression.module);
    assert.ok(suppression.reason.includes("Temporary baseline suppression"));
    assert.equal(suppression.expires, "2026-07-19");
    assert.ok(Array.isArray(suppression.contexts));
    assert.ok(suppression.contexts.length > 0);
    for (const context of suppression.contexts) {
      assert.ok(
        ["production dependencies", "all dependencies"].includes(context)
      );
    }
    const key = `${suppression.module}:${suppression.id}`;
    assert.equal(keys.has(key), false, `duplicate suppression ${key}`);
    keys.add(key);
  }
});

test("deploy workflows are gated, immutable, scanned, signed, and environment protected", async () => {
  for (const path of [
    ".github/workflows/server-build.yml",
    ".github/workflows/ai-build.yml",
  ]) {
    const workflow = await text(path);

    assert.match(workflow, /concurrency:/);
    assert.match(workflow, /quality-gate:/);
    assert.match(workflow, /uses: \.\/\.github\/workflows\/ci\.yml/);
    assert.match(workflow, /needs: quality-gate/);
    assert.match(workflow, /environment:/);
    assert.match(workflow, /github\.sha/);
    assert.doesNotMatch(workflow, /:latest/);
    assert.match(workflow, /sbom: true/);
    assert.match(workflow, /provenance: true/);
    assert.match(workflow, /aquasecurity\/trivy-action@/);
    assert.match(workflow, /sigstore\/cosign-installer@/);
    assert.match(workflow, /cosign sign/);
    assert.match(workflow, /Rollback metadata/);
  }
});

test("server runtime image installs only production server dependencies", async () => {
  const dockerfile = await text("apps/server/Dockerfile");

  assert.match(
    dockerfile,
    /pnpm install --frozen-lockfile --prod --filter server\.\.\./
  );
  assert.doesNotMatch(dockerfile, /pnpm .*deploy/);
  assert.match(dockerfile, /apt-get upgrade -y/);
  assert.match(dockerfile, /COPY packages\/typescript-config packages\/typescript-config/);
  assert.match(dockerfile, /rm -rf[\s\S]*\/root\/\.cache\/node/);
  assert.match(dockerfile, /rm -rf[\s\S]*\/usr\/local\/lib\/node_modules\/npm/);
  assert.match(dockerfile, /rm -rf[\s\S]*\/usr\/local\/lib\/node_modules\/corepack/);
  assert.doesNotMatch(dockerfile, /COPY packages\/typescript-config\/package\.json/);
  assert.doesNotMatch(
    dockerfile,
    /COPY --from=build .*\/app\/node_modules \/app\/node_modules/
  );
});

test("Dependabot covers npm, GitHub Actions, Dockerfiles, and AI Python requirements", async () => {
  const dependabot = await text(".github/dependabot.yml");

  for (const ecosystem of [
    "npm",
    "github-actions",
    "docker",
    "pip",
  ]) {
    assert.match(dependabot, new RegExp(`package-ecosystem: "${ecosystem}"`));
  }

  assert.match(dependabot, /directory: "\/apps\/server"/);
  assert.match(dependabot, /directory: "\/apps\/ai"/);
});
