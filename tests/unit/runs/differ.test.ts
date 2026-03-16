import { describe, expect, it } from "vitest";
import type { FlowResult } from "../../../src/flows/types.js";
import { diffRuns } from "../../../src/runs/differ.js";
import type { RunArtifact } from "../../../src/runs/types.js";

function makeArtifact(id: string, overrides: Partial<FlowResult> = {}): RunArtifact {
  return {
    id,
    createdAt: new Date().toISOString(),
    result: {
      flowName: "swap",
      profile: "baseline",
      status: "PASS",
      summary: "Swap succeeded",
      transactionProfile: {
        computeUnits: 200000,
        logs: ["log1"],
        success: true,
        accounts: [],
      },
      metadata: { quoteOutAmount: "150.00" },
      timestamp: new Date().toISOString(),
      durationMs: 500,
      ...overrides,
    },
  };
}

describe("diffRuns", () => {
  it("detects no changes for identical runs", () => {
    const a = makeArtifact("run-001");
    const b = makeArtifact("run-002");
    const diff = diffRuns(a, b);

    expect(diff.riskLevel).toBe("none");
    expect(diff.statusChange.changed).toBe(false);
    expect(diff.deltas.filter((d) => d.changed)).toHaveLength(0);
  });

  it("detects PASS → FAIL as critical", () => {
    const a = makeArtifact("run-001");
    const b = makeArtifact("run-002", {
      status: "FAIL",
      summary: "Swap failed",
      transactionProfile: {
        computeUnits: 150000,
        logs: ["error"],
        success: false,
        error: "slippage exceeded",
        accounts: [],
      },
    });

    const diff = diffRuns(a, b);
    expect(diff.riskLevel).toBe("critical");
    expect(diff.statusChange.changed).toBe(true);
    expect(diff.statusChange.from).toBe("PASS");
    expect(diff.statusChange.to).toBe("FAIL");
  });

  it("detects FAIL → PASS as low risk", () => {
    const a = makeArtifact("run-001", { status: "FAIL" });
    const b = makeArtifact("run-002", { status: "PASS" });

    const diff = diffRuns(a, b);
    expect(diff.riskLevel).toBe("low");
  });

  it("includes metadata deltas", () => {
    const a = makeArtifact("run-001");
    const b = makeArtifact("run-002", { metadata: { quoteOutAmount: "100.00" } });

    const diff = diffRuns(a, b);
    const metaDelta = diff.deltas.find((d) => d.field === "metadata.quoteOutAmount");
    expect(metaDelta?.changed).toBe(true);
    expect(metaDelta?.valueA).toBe("150.00");
    expect(metaDelta?.valueB).toBe("100.00");
  });

  it("summary describes changed fields", () => {
    const a = makeArtifact("run-001");
    const b = makeArtifact("run-002", { status: "FAIL" });
    const diff = diffRuns(a, b);
    expect(diff.summary).toContain("PASS → FAIL");
  });
});
