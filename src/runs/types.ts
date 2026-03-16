import type { FlowResult } from "../flows/types.js";

export interface RunArtifact {
  id: string;
  result: FlowResult;
  createdAt: string;
}

export interface FieldDelta {
  field: string;
  valueA: unknown;
  valueB: unknown;
  changed: boolean;
}

export type RiskLevel = "none" | "low" | "medium" | "high" | "critical";

export interface RunDiff {
  runA: string;
  runB: string;
  statusChange: { from: string; to: string; changed: boolean };
  deltas: FieldDelta[];
  riskLevel: RiskLevel;
  summary: string;
}
