import { describe, expect, it } from "vitest";
import { listBuiltInProfiles, validateProfile } from "../../../src/profiles/loader.js";

describe("validateProfile", () => {
  it("accepts a valid baseline profile", () => {
    const profile = validateProfile({ name: "test", description: "A test" });
    expect(profile.name).toBe("test");
    expect(profile.description).toBe("A test");
  });

  it("accepts a profile with overrides", () => {
    const profile = validateProfile({
      name: "test",
      description: "A test",
      overrides: [{ templateId: "pyth-sol-usd", account: "abc123", values: { priceDropPercent: 50 } }],
    });
    expect(profile.overrides).toHaveLength(1);
  });

  it("rejects non-object", () => {
    expect(() => validateProfile(null)).toThrow("must be a JSON object");
    expect(() => validateProfile("string")).toThrow("must be a JSON object");
  });

  it("rejects missing name", () => {
    expect(() => validateProfile({ description: "x" })).toThrow("'name' string field");
  });

  it("rejects missing description", () => {
    expect(() => validateProfile({ name: "x" })).toThrow("'description' string field");
  });

  it("rejects invalid overrides", () => {
    expect(() => validateProfile({ name: "x", description: "y", overrides: "bad" })).toThrow("must be an array");
  });

  it("rejects override without templateId", () => {
    expect(() => validateProfile({ name: "x", description: "y", overrides: [{ account: "a", values: {} }] })).toThrow(
      "'templateId' string",
    );
  });

  it("rejects override without account", () => {
    expect(() =>
      validateProfile({ name: "x", description: "y", overrides: [{ templateId: "t", values: {} }] }),
    ).toThrow("'account' string");
  });

  it("rejects override without values", () => {
    expect(() =>
      validateProfile({ name: "x", description: "y", overrides: [{ templateId: "t", account: "a" }] }),
    ).toThrow("'values' object");
  });
});

describe("listBuiltInProfiles", () => {
  it("returns baseline and oracle-shock", () => {
    const profiles = listBuiltInProfiles();
    expect(profiles).toContain("baseline");
    expect(profiles).toContain("oracle-shock");
  });
});
