import { describe, expect, it } from "vitest";
import { DEFAULT_DEX, getDexAdapter, listDexAdapters } from "../../../src/dex/registry.js";

describe("DEX registry", () => {
  it("has jupiter registered", () => {
    expect(listDexAdapters()).toContain("jupiter");
  });

  it("returns jupiter adapter by name", () => {
    const adapter = getDexAdapter("jupiter");
    expect(adapter).toBeDefined();
    expect(adapter!.name).toBe("jupiter");
  });

  it("returns undefined for unknown adapter", () => {
    expect(getDexAdapter("nonexistent")).toBeUndefined();
  });

  it("DEFAULT_DEX is jupiter", () => {
    expect(DEFAULT_DEX).toBe("jupiter");
  });
});
