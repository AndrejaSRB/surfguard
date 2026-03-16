import { beforeEach, describe, expect, it, vi } from "vitest";
import { SurfnetClient } from "../../../src/surfnet/client.js";

describe("SurfnetClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("sends a JSON-RPC request and returns the result", async () => {
    const mockResponse = { jsonrpc: "2.0", id: 1, result: { version: "0.1.0" } };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(JSON.stringify(mockResponse), { status: 200 }));

    const client = new SurfnetClient("http://localhost:8899");
    const result = await client.call<{ version: string }>("surfnet_getSurfnetInfo");

    expect(result).toEqual({ version: "0.1.0" });
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8899",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("throws on RPC error", async () => {
    const mockResponse = {
      jsonrpc: "2.0",
      id: 1,
      error: { code: -32600, message: "Invalid Request" },
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(JSON.stringify(mockResponse), { status: 200 }));

    const client = new SurfnetClient("http://localhost:8899");
    await expect(client.call("bad_method")).rejects.toThrow("RPC error -32600");
  });

  it("throws on HTTP error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("", { status: 500, statusText: "Internal Server Error" }),
    );

    const client = new SurfnetClient("http://localhost:8899");
    await expect(client.call("any")).rejects.toThrow("HTTP 500");
  });

  it("exposes the url", () => {
    const client = new SurfnetClient("http://example.com:9999");
    expect(client.url).toBe("http://example.com:9999");
  });
});
