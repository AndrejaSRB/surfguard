import { describe, expect, it } from "vitest";
import { resolveEntries } from "../../../src/funding/funder.js";
import type { FundTokenEntry } from "../../../src/funding/types.js";

describe("Token funding", () => {
  describe("resolveEntries", () => {
    it("resolves USDC by symbol", () => {
      const entries: FundTokenEntry[] = [{ token: "USDC", amount: 100 }];
      const resolved = resolveEntries(entries);
      expect(resolved).toHaveLength(1);
      expect(resolved[0].symbol).toBe("USDC");
      expect(resolved[0].decimals).toBe(6);
      expect(resolved[0].rawAmount).toBe(100_000_000);
    });

    it("resolves BONK with correct decimals (5)", () => {
      const entries: FundTokenEntry[] = [{ token: "BONK", amount: 1000 }];
      const resolved = resolveEntries(entries);
      expect(resolved[0].rawAmount).toBe(100_000_000);
      expect(resolved[0].decimals).toBe(5);
    });

    it("resolves SOL with 9 decimals", () => {
      const entries: FundTokenEntry[] = [{ token: "SOL", amount: 1 }];
      const resolved = resolveEntries(entries);
      expect(resolved[0].rawAmount).toBe(1_000_000_000);
    });

    it("resolves by mint address with decimals", () => {
      const entries: FundTokenEntry[] = [{ mint: "CustomMint111", decimals: 8, amount: 50 }];
      const resolved = resolveEntries(entries);
      expect(resolved[0].mint).toBe("CustomMint111");
      expect(resolved[0].rawAmount).toBe(5_000_000_000);
    });

    it("resolves multiple tokens", () => {
      const entries: FundTokenEntry[] = [
        { token: "USDC", amount: 100 },
        { token: "BONK", amount: 5000000 },
      ];
      const resolved = resolveEntries(entries);
      expect(resolved).toHaveLength(2);
    });

    it("throws on zero amount", () => {
      expect(() => resolveEntries([{ token: "USDC", amount: 0 }])).toThrow("amount must be positive");
    });

    it("throws on negative amount", () => {
      expect(() => resolveEntries([{ token: "USDC", amount: -10 }])).toThrow("amount must be positive");
    });

    it("throws on unknown token symbol", () => {
      expect(() => resolveEntries([{ token: "FAKE", amount: 100 }])).toThrow('unknown token "FAKE"');
    });

    it("throws on mint without decimals", () => {
      expect(() => resolveEntries([{ mint: "abc123", amount: 100 }])).toThrow('"decimals" is required');
    });

    it("throws when neither token nor mint specified", () => {
      expect(() => resolveEntries([{ amount: 100 }])).toThrow('must specify either "token" or "mint"');
    });
  });
});
