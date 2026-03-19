import { describe, expect, it } from "vitest";
import { DRIFT_WARNING, isDriftError } from "../../../src/errors/drift.js";

describe("Fork drift detection", () => {
  it("detects slippage hex code", () => {
    expect(isDriftError("Error processing Instruction 6: custom program error: 0x1771")).toBe(true);
  });

  it("detects translated slippage message", () => {
    expect(isDriftError("Slippage tolerance exceeded (0x1771) at Instruction 6")).toBe(true);
  });

  it("detects Invalid account owner", () => {
    expect(isDriftError("Error processing Instruction 6: Invalid account owner")).toBe(true);
  });

  it("does not flag insufficient funds as drift", () => {
    expect(isDriftError("Error processing Instruction 3: custom program error: 0x1")).toBe(false);
  });

  it("does not flag unknown errors as drift", () => {
    expect(isDriftError("Something else went wrong")).toBe(false);
  });

  it("DRIFT_WARNING contains restart instructions", () => {
    expect(DRIFT_WARNING).toContain("surfpool stop");
    expect(DRIFT_WARNING).toContain("fork drift");
  });
});
