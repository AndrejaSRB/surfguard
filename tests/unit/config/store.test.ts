import { describe, expect, it } from "vitest";
import { isKnownConfigKey, listKnownKeys } from "../../../src/config/store.js";

describe("Config store", () => {
  describe("isKnownConfigKey", () => {
    it("accepts jupiter-api-key", () => {
      expect(isKnownConfigKey("jupiter-api-key")).toBe(true);
    });

    it("accepts rpc-url", () => {
      expect(isKnownConfigKey("rpc-url")).toBe(true);
    });

    it("rejects unknown key", () => {
      expect(isKnownConfigKey("something-else")).toBe(false);
    });

    it("rejects empty string", () => {
      expect(isKnownConfigKey("")).toBe(false);
    });
  });

  describe("listKnownKeys", () => {
    it("returns all known keys", () => {
      const keys = listKnownKeys();
      expect(keys).toContain("jupiter-api-key");
      expect(keys).toContain("rpc-url");
      expect(keys.length).toBe(2);
    });
  });
});
