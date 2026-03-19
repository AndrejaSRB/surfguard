import { describe, expect, it } from "vitest";
import { getKnownErrorCodes, translateError } from "../../../src/errors/translator.js";

describe("Error translator", () => {
  it("translates 0x1 (insufficient funds)", () => {
    const result = translateError("Error processing Instruction 3: custom program error: 0x1");
    expect(result.translated).toBe("Insufficient funds (0x1) at Instruction 3");
    expect(result.instructionIndex).toBe(3);
    expect(result.hexCode).toBe("0x1");
    expect(result.humanMessage).toBe("Insufficient funds");
  });

  it("translates 0x5 (token insufficient balance)", () => {
    const result = translateError("Error processing Instruction 6: custom program error: 0x5");
    expect(result.translated).toBe("Token account insufficient balance (0x5) at Instruction 6");
    expect(result.hexCode).toBe("0x5");
  });

  it("translates 0x1771 (slippage exceeded)", () => {
    const result = translateError("Error processing Instruction 6: custom program error: 0x1771");
    expect(result.translated).toBe("Slippage tolerance exceeded (0x1771) at Instruction 6");
  });

  it("translates uppercase hex codes", () => {
    const result = translateError("Error processing Instruction 2: custom program error: 0xA");
    expect(result.translated).toBe("Account is frozen (0xa) at Instruction 2");
  });

  it("handles unknown hex codes", () => {
    const result = translateError("Error processing Instruction 1: custom program error: 0xBEEF");
    expect(result.translated).toBe("Unknown error (0xbeef) at Instruction 1");
    expect(result.hexCode).toBe("0xbeef");
    expect(result.humanMessage).toBeUndefined();
  });

  it("translates Blockhash not found", () => {
    const result = translateError("Blockhash not found");
    expect(result.translated).toContain("Blockhash expired");
  });

  it("translates insufficient funds for fee", () => {
    const result = translateError("insufficient funds for fee");
    expect(result.translated).toBe("Not enough SOL for transaction fee");
  });

  it("returns original for unrecognized errors", () => {
    const msg = "Some completely unknown error";
    const result = translateError(msg);
    expect(result.translated).toBe(msg);
    expect(result.original).toBe(msg);
  });

  it("preserves original message", () => {
    const original = "Error processing Instruction 3: custom program error: 0x1";
    const result = translateError(original);
    expect(result.original).toBe(original);
  });

  it("getKnownErrorCodes returns the map", () => {
    const codes = getKnownErrorCodes();
    expect(codes.size).toBeGreaterThanOrEqual(15);
    expect(codes.get("0x1")).toBe("Insufficient funds");
    expect(codes.get("0x1771")).toBe("Slippage tolerance exceeded");
  });
});
