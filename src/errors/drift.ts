/**
 * Detect fork drift errors — when Surfpool's local fork has diverged too far
 * from mainnet state, causing transactions to fail with slippage or account errors.
 */

const DRIFT_PATTERNS = [
  /Slippage tolerance exceeded/i,
  /custom program error: 0x1771/i,
  /Invalid account owner/i,
  /Account owned by wrong program/i,
];

export function isDriftError(errorMessage: string): boolean {
  return DRIFT_PATTERNS.some((pattern) => pattern.test(errorMessage));
}

export const DRIFT_WARNING =
  "This error is likely caused by fork drift — Surfpool's local state has diverged from mainnet.\n" +
  "  Fix: restart Surfpool for a fresh fork (surfpool stop && surfpool start)";
