import { describe, expect, it } from "vitest";
import { exportDiffAsText, exportRunAsJson, exportRunAsText } from "../../../src/runs/exporter.js";
import type { RunArtifact, RunDiff } from "../../../src/runs/types.js";

const artifact: RunArtifact = {
  id: "run-001",
  createdAt: "2025-01-01T00:00:00.000Z",
  result: {
    flowName: "swap",
    profile: "baseline",
    status: "PASS",
    summary: "Swap succeeded: 0.1 SOL → 15 USDC (200000 CU)",
    transactionProfile: {
      computeUnits: 200000,
      logs: ["log1", "log2"],
      success: true,
    },
    metadata: { walletPubkey: "abc123" },
    timestamp: "2025-01-01T00:00:00.000Z",
    durationMs: 500,
  },
};

describe("exportRunAsJson", () => {
  it("returns valid JSON", () => {
    const json = exportRunAsJson(artifact);
    const parsed = JSON.parse(json);
    expect(parsed.id).toBe("run-001");
  });
});

describe("exportRunAsText", () => {
  it("includes key fields", () => {
    const text = exportRunAsText(artifact);
    expect(text).toContain("[PASS]");
    expect(text).toContain("run-001");
    expect(text).toContain("200,000");
    expect(text).toContain("walletPubkey");
  });

  it("shows FAIL status for failed runs", () => {
    const failed: RunArtifact = {
      ...artifact,
      result: { ...artifact.result, status: "FAIL" },
    };
    const text = exportRunAsText(failed);
    expect(text).toContain("[FAIL]");
  });
});

describe("exportDiffAsText", () => {
  it("formats a diff with changes", () => {
    const diff: RunDiff = {
      runA: "run-001",
      runB: "run-002",
      statusChange: { from: "PASS", to: "FAIL", changed: true },
      deltas: [
        { field: "status", valueA: "PASS", valueB: "FAIL", changed: true },
        { field: "computeUnits", valueA: 200000, valueB: 200000, changed: false },
      ],
      riskLevel: "critical",
      summary: "1 field(s) changed. Status: PASS → FAIL.",
    };
    const text = exportDiffAsText(diff);
    expect(text).toContain("!! CRITICAL !!");
    expect(text).toContain("PASS -> FAIL");
    expect(text).toContain("** CHANGED **");
    expect(text).toContain("status");
  });

  it("shows (none) when no changes", () => {
    const diff: RunDiff = {
      runA: "run-001",
      runB: "run-002",
      statusChange: { from: "PASS", to: "PASS", changed: false },
      deltas: [],
      riskLevel: "none",
      summary: "No differences detected.",
    };
    const text = exportDiffAsText(diff);
    expect(text).toContain("(none)");
  });
});
