import { describe, expect, it } from "vitest";
import { getFlow, listFlows } from "../../../src/flows/registry.js";

describe("Flow registry", () => {
  it("has swap flow registered", () => {
    expect(listFlows()).toContain("swap");
  });

  it("returns swap flow by name", () => {
    const flow = getFlow("swap");
    expect(flow).toBeDefined();
    expect(flow!.name).toBe("swap");
    expect(flow!.description).toBeTruthy();
  });

  it("returns undefined for unknown flow", () => {
    expect(getFlow("nonexistent")).toBeUndefined();
  });
});
