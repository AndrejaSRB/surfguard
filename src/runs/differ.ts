import type { FieldDelta, RiskLevel, RunArtifact, RunDiff } from "./types.js";

// Fields that always differ between runs and shouldn't affect risk assessment
const NOISE_FIELDS = new Set(["durationMs", "summary", "metadata.walletPubkey", "metadata.computeUnits"]);

export function diffRuns(a: RunArtifact, b: RunArtifact): RunDiff {
  const deltas: FieldDelta[] = [];

  // Compare key fields
  addDelta(deltas, "status", a.result.status, b.result.status);
  addDelta(
    deltas,
    "computeUnits",
    a.result.transactionProfile?.computeUnits,
    b.result.transactionProfile?.computeUnits,
  );
  addDelta(deltas, "success", a.result.transactionProfile?.success, b.result.transactionProfile?.success);
  addDelta(
    deltas,
    "errorMessage",
    a.result.transactionProfile?.errorMessage,
    b.result.transactionProfile?.errorMessage,
  );

  // Compare metadata (excluding noise)
  const allMetaKeys = new Set([...Object.keys(a.result.metadata), ...Object.keys(b.result.metadata)]);
  for (const key of allMetaKeys) {
    if (NOISE_FIELDS.has(`metadata.${key}`)) continue;
    addDelta(deltas, `metadata.${key}`, a.result.metadata[key], b.result.metadata[key]);
  }

  const statusChange = {
    from: a.result.status,
    to: b.result.status,
    changed: a.result.status !== b.result.status,
  };

  const riskLevel = assessRisk(statusChange, deltas);

  const changedFields = deltas.filter((d) => d.changed);
  const summary =
    changedFields.length === 0
      ? "No differences detected."
      : `${changedFields.length} field(s) changed. ${statusChange.changed ? `Status: ${statusChange.from} → ${statusChange.to}.` : "Status unchanged."}`;

  return { runA: a.id, runB: b.id, statusChange, deltas, riskLevel, summary };
}

function addDelta(deltas: FieldDelta[], field: string, valueA: unknown, valueB: unknown): void {
  const a = JSON.stringify(valueA);
  const b = JSON.stringify(valueB);
  deltas.push({ field, valueA, valueB, changed: a !== b });
}

function assessRisk(statusChange: { from: string; to: string; changed: boolean }, deltas: FieldDelta[]): RiskLevel {
  // PASS → FAIL is critical
  if (statusChange.changed && statusChange.from === "PASS" && statusChange.to === "FAIL") {
    return "critical";
  }
  // FAIL → PASS is low (improvement)
  if (statusChange.changed && statusChange.from === "FAIL" && statusChange.to === "PASS") {
    return "low";
  }

  const meaningful = deltas.filter((d) => d.changed && !NOISE_FIELDS.has(d.field));
  if (meaningful.length === 0) return "none";
  if (meaningful.length <= 2) return "low";
  if (meaningful.length <= 5) return "medium";
  return "high";
}
