import { describe, expect, it } from "vitest";
import { getTokenBySymbol, listTokens, resolveToken } from "../../../src/tokens/registry.js";

describe("Token registry", () => {
  it("resolves SOL by symbol", () => {
    const result = resolveToken("SOL");
    expect(result.found).toBe(true);
    if (result.found) {
      expect(result.token.symbol).toBe("SOL");
      expect(result.token.mint).toBe("So11111111111111111111111111111111111111112");
      expect(result.token.decimals).toBe(9);
    }
  });

  it("resolves USDC by symbol", () => {
    const result = resolveToken("USDC");
    expect(result.found).toBe(true);
    if (result.found) {
      expect(result.token.symbol).toBe("USDC");
      expect(result.token.decimals).toBe(6);
    }
  });

  it("is case-insensitive", () => {
    const lower = resolveToken("sol");
    const upper = resolveToken("SOL");
    const mixed = resolveToken("Sol");
    expect(lower.found).toBe(true);
    expect(upper.found).toBe(true);
    expect(mixed.found).toBe(true);
  });

  it("resolves by mint address", () => {
    const result = resolveToken("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
    expect(result.found).toBe(true);
    if (result.found) {
      expect(result.token.symbol).toBe("USDC");
    }
  });

  it("returns miss for unknown symbol", () => {
    const result = resolveToken("NOTATOKEN");
    expect(result.found).toBe(false);
    if (!result.found) {
      expect(result.query).toBe("NOTATOKEN");
    }
  });

  it("returns miss for unknown mint address", () => {
    const result = resolveToken("11111111111111111111111111111111");
    expect(result.found).toBe(false);
  });

  it("getTokenBySymbol returns undefined for unknown", () => {
    expect(getTokenBySymbol("FAKE")).toBeUndefined();
  });

  it("getTokenBySymbol returns token for known symbol", () => {
    const token = getTokenBySymbol("JUP");
    expect(token).toBeDefined();
    expect(token!.name).toBe("Jupiter");
  });

  it("listTokens returns all tokens", () => {
    const tokens = listTokens();
    expect(tokens.length).toBeGreaterThanOrEqual(20);
    expect(tokens.find((t) => t.symbol === "SOL")).toBeDefined();
    expect(tokens.find((t) => t.symbol === "USDC")).toBeDefined();
  });
});
