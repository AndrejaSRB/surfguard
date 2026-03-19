import type { FundTokenEntry } from "./types.js";

/**
 * Extract fundTokens array from flowConfig. Returns empty array if not specified.
 */
export function parseFundTokens(flowConfig: Record<string, unknown> | undefined): FundTokenEntry[] {
  const raw = flowConfig?.fundTokens;
  if (!raw) return [];
  if (!Array.isArray(raw)) {
    throw new Error("fundTokens must be an array");
  }
  return raw as FundTokenEntry[];
}
