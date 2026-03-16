import type { RunArtifact, RunDiff } from "./types.js";

export function exportRunAsJson(artifact: RunArtifact): string {
  return JSON.stringify(artifact, null, 2);
}

export function exportRunAsText(artifact: RunArtifact): string {
  const r = artifact.result;
  const statusIcon = r.status === "PASS" ? "[PASS]" : "[FAIL]";
  const lines = [
    "========================================",
    `  ${statusIcon} ${r.flowName} / ${r.profile}`,
    "========================================",
    "",
    `  Run ID:    ${artifact.id}`,
    `  Summary:   ${r.summary}`,
    `  Timestamp: ${r.timestamp}`,
    `  Duration:  ${r.durationMs}ms`,
    "",
  ];

  if (r.transactionProfile) {
    const tp = r.transactionProfile;
    lines.push("  Transaction Profile:");
    const cu = tp.computeUnits ?? tp.computeUnitsConsumed;
    if (cu != null) {
      lines.push(`    Compute Units: ${Number(cu).toLocaleString()}`);
    }
    if (tp.success != null) {
      lines.push(`    Success:       ${tp.success}`);
    }
    if (tp.errorMessage) {
      lines.push(`    Error:         ${tp.errorMessage}`);
    } else if (tp.error) {
      lines.push(`    Error:         ${tp.error}`);
    }
    const logs = tp.logMessages ?? tp.logs;
    if (Array.isArray(logs)) {
      lines.push(`    Log entries:   ${logs.length}`);
    }
    lines.push("");
  }

  if (Object.keys(r.metadata).length > 0) {
    lines.push("  Metadata:");
    for (const [key, value] of Object.entries(r.metadata)) {
      lines.push(`    ${key}: ${JSON.stringify(value)}`);
    }
    lines.push("");
  }

  lines.push("========================================");
  return lines.join("\n");
}

const RISK_LABELS: Record<string, string> = {
  none: "NONE",
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
  critical: "!! CRITICAL !!",
};

export function exportDiffAsText(diff: RunDiff): string {
  const riskLabel = RISK_LABELS[diff.riskLevel] ?? diff.riskLevel.toUpperCase();
  const lines = [
    "========================================",
    `  DIFF: ${diff.runA} vs ${diff.runB}`,
    "========================================",
    "",
    `  Risk Level: ${riskLabel}`,
    `  Status:     ${diff.statusChange.from} -> ${diff.statusChange.to}${diff.statusChange.changed ? "  ** CHANGED **" : ""}`,
    `  Summary:    ${diff.summary}`,
    "",
  ];

  const changed = diff.deltas.filter((d) => d.changed);
  if (changed.length === 0) {
    lines.push("  Changes: (none)");
  } else {
    lines.push("  Changes:");
    for (const delta of changed) {
      lines.push(`    ${delta.field}:`);
      lines.push(`      before: ${JSON.stringify(delta.valueA)}`);
      lines.push(`      after:  ${JSON.stringify(delta.valueB)}`);
    }
  }

  lines.push("");
  lines.push("========================================");
  return lines.join("\n");
}
