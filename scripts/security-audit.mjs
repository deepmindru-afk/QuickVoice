import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const severityRank = {
  low: 1,
  moderate: 2,
  high: 3,
  critical: 4,
};

const args = process.argv.slice(2);
const auditLevelIndex = args.indexOf("--audit-level");
const auditLevel = auditLevelIndex >= 0 ? args[auditLevelIndex + 1] ?? "high" : "high";
const threshold = severityRank[auditLevel] ?? severityRank.high;

const suppressionFile = "security/audit-suppressions.json";
const suppressionConfig = JSON.parse(await readFile(suppressionFile, "utf8"));
const suppressions = suppressionConfig.suppressions ?? [];

function advisoryId(advisory) {
  return (
    advisory.github_advisory_id ??
    advisory.cves?.[0] ??
    advisory.id?.toString() ??
    advisory.url ??
    `${advisory.module_name}:${advisory.title}`
  );
}

function isSuppressed(advisory, context) {
  const id = advisoryId(advisory);
  return suppressions.some((suppression) => {
    const contextMatches =
      suppression.contexts === undefined || suppression.contexts.includes(context);
    const moduleMatches =
      suppression.module === undefined || suppression.module === advisory.module_name;
    const idMatches =
      suppression.id === id ||
      suppression.id === advisory.github_advisory_id ||
      suppression.id === advisory.id?.toString() ||
      advisory.cves?.includes(suppression.id);
    return contextMatches && moduleMatches && idMatches && suppression.reason;
  });
}

function parseAuditJson(stdout) {
  const firstBrace = stdout.indexOf("{");
  if (firstBrace === -1) {
    return {};
  }
  return JSON.parse(stdout.slice(firstBrace));
}

function runAudit(context, extraArgs) {
  const result = spawnSync(
    "pnpm",
    ["audit", "--json", "--audit-level", auditLevel, ...extraArgs],
    { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 }
  );

  if (result.error) {
    throw result.error;
  }

  const output = parseAuditJson(result.stdout);
  const advisories = Object.values(output.advisories ?? {});
  const unsuppressed = advisories.filter((advisory) => {
    const rank = severityRank[advisory.severity] ?? 0;
    return rank >= threshold && !isSuppressed(advisory, context);
  });
  const uniqueUnsuppressed = [
    ...new Map(
      unsuppressed.map((advisory) => [
        `${advisory.module_name}:${advisoryId(advisory)}:${advisory.title}`,
        advisory,
      ])
    ).values(),
  ];

  if (uniqueUnsuppressed.length === 0 && result.status === 0) {
    console.log(`${context}: no ${auditLevel}+ advisories found.`);
    return [];
  }

  if (uniqueUnsuppressed.length === 0) {
    console.log(`${context}: all ${auditLevel}+ advisories are explicitly suppressed.`);
    return [];
  }

  console.error(`${context}: ${uniqueUnsuppressed.length} unsuppressed ${auditLevel}+ advisories found.`);
  for (const advisory of uniqueUnsuppressed) {
    console.error(
      `- ${advisory.severity}: ${advisory.module_name} ${advisoryId(advisory)} ${advisory.title}`
    );
  }
  return uniqueUnsuppressed;
}

const productionFindings = runAudit("production dependencies", ["--prod"]);
const allFindings = runAudit("all dependencies", []);

if (productionFindings.length > 0 || allFindings.length > 0) {
  console.error(
    `Add a reviewed entry to ${suppressionFile} only for temporary, documented exceptions.`
  );
  process.exit(1);
}
