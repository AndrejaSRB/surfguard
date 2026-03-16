import { describe, expect, it } from "vitest";
import type { Profile } from "../../../src/profiles/types.js";
import { profileToScenarios } from "../../../src/surfnet/scenarios.js";

describe("profileToScenarios", () => {
  it("returns empty array for baseline profile", () => {
    const profile: Profile = { name: "baseline", description: "No overrides" };
    expect(profileToScenarios(profile)).toEqual([]);
  });

  it("converts overrides to a scenario with proper OverrideInstance shape", () => {
    const profile: Profile = {
      name: "oracle-shock",
      description: "test",
      overrides: [
        {
          templateId: "pyth-sol-usd",
          account: "7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE",
          values: { priceDropPercent: 50 },
        },
      ],
    };
    const scenarios = profileToScenarios(profile);
    expect(scenarios).toHaveLength(1);
    expect(scenarios[0].id).toBe("oracle-shock-scenario");
    expect(scenarios[0].overrides).toHaveLength(1);
    expect(scenarios[0].overrides[0].templateId).toBe("pyth-sol-usd");
    expect(scenarios[0].overrides[0].account).toEqual({ pubkey: "7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE" });
    expect(scenarios[0].overrides[0].enabled).toBe(true);
    expect(scenarios[0].overrides[0].scenarioRelativeSlot).toBe(0);
  });

  it("handles multiple overrides in one scenario", () => {
    const profile: Profile = {
      name: "multi",
      description: "test",
      overrides: [
        { templateId: "a", account: "pubkey1", values: { x: 1 } },
        { templateId: "b", account: "pubkey2", values: { y: 2 } },
      ],
    };
    const scenarios = profileToScenarios(profile);
    expect(scenarios).toHaveLength(1);
    expect(scenarios[0].overrides).toHaveLength(2);
  });
});
