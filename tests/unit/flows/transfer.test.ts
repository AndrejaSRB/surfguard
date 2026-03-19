import { describe, expect, it } from "vitest";
import { getFlow, listFlows } from "../../../src/flows/registry.js";
import { TRANSFER_DEFAULTS } from "../../../src/flows/transfer/defaults.js";

describe("Transfer flow", () => {
  it("is registered in the flow registry", () => {
    expect(listFlows()).toContain("transfer");
  });

  it("returns the transfer flow by name", () => {
    const flow = getFlow("transfer");
    expect(flow).toBeDefined();
    expect(flow!.name).toBe("transfer");
    expect(flow!.description).toBeTruthy();
  });

  it("has sensible defaults", () => {
    expect(TRANSFER_DEFAULTS.token).toBe("SOL");
    expect(TRANSFER_DEFAULTS.amount).toBe(1.0);
    expect(TRANSFER_DEFAULTS.airdropSol).toBe(5);
  });
});
