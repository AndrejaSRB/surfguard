import { describe, expect, it, vi } from "vitest";
import { Cheatcodes } from "../../../src/surfnet/cheatcodes.js";
import type { SurfnetClient } from "../../../src/surfnet/client.js";

function mockClient(): SurfnetClient {
  return { call: vi.fn(), url: "http://localhost:8899" } as unknown as SurfnetClient;
}

describe("Cheatcodes", () => {
  it("getSurfnetInfo calls the correct method", async () => {
    const client = mockClient();
    const info = { version: "0.1.0" };
    (client.call as ReturnType<typeof vi.fn>).mockResolvedValue(info);

    const cc = new Cheatcodes(client);
    const result = await cc.getSurfnetInfo();

    expect(result).toEqual(info);
    expect(client.call).toHaveBeenCalledWith("surfnet_getSurfnetInfo");
  });

  it("profileTransaction passes tx base64", async () => {
    const client = mockClient();
    const profile = { computeUnits: 200000, logs: [], success: true };
    (client.call as ReturnType<typeof vi.fn>).mockResolvedValue(profile);

    const cc = new Cheatcodes(client);
    await cc.profileTransaction("base64tx");

    expect(client.call).toHaveBeenCalledWith("surfnet_profileTransaction", ["base64tx"]);
  });

  it("registerScenario passes scenario object", async () => {
    const client = mockClient();
    (client.call as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const cc = new Cheatcodes(client);
    const scenario = {
      id: "test-pyth",
      name: "test-pyth",
      description: "test",
      overrides: [{ template: "pyth-sol-usd", priceDropPercent: 50 }],
      tags: ["test"],
    };
    await cc.registerScenario(scenario);

    expect(client.call).toHaveBeenCalledWith("surfnet_registerScenario", [scenario]);
  });

  it("resetNetwork calls surfnet_resetNetwork", async () => {
    const client = mockClient();
    (client.call as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const cc = new Cheatcodes(client);
    await cc.resetNetwork();

    expect(client.call).toHaveBeenCalledWith("surfnet_resetNetwork");
  });

  it("airdrop calls requestAirdrop", async () => {
    const client = mockClient();
    (client.call as ReturnType<typeof vi.fn>).mockResolvedValue("txsig123");

    const cc = new Cheatcodes(client);
    const sig = await cc.airdrop("pubkey123", 1000000000);

    expect(sig).toBe("txsig123");
    expect(client.call).toHaveBeenCalledWith("requestAirdrop", ["pubkey123", 1000000000]);
  });

  it("pauseClock calls surfnet_pauseClock", async () => {
    const client = mockClient();
    (client.call as ReturnType<typeof vi.fn>).mockResolvedValue({ slot: 100 });

    const cc = new Cheatcodes(client);
    const result = await cc.pauseClock();

    expect(result).toEqual({ slot: 100 });
    expect(client.call).toHaveBeenCalledWith("surfnet_pauseClock");
  });
});
