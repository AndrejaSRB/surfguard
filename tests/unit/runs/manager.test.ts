import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FlowResult } from "../../../src/flows/types.js";
import { RunManager } from "../../../src/runs/manager.js";

function makeResult(overrides: Partial<FlowResult> = {}): FlowResult {
  return {
    flowName: "swap",
    profile: "baseline",
    status: "PASS",
    summary: "Test passed",
    metadata: {},
    timestamp: new Date().toISOString(),
    durationMs: 100,
    ...overrides,
  };
}

describe("RunManager", () => {
  let tmpDir: string;
  let manager: RunManager;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "surfguard-test-"));
    manager = new RunManager(tmpDir);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("saves and loads a run", async () => {
    const result = makeResult();
    const artifact = await manager.save(result);

    expect(artifact.id).toMatch(/^run-/);
    expect(artifact.result).toEqual(result);

    const loaded = await manager.load(artifact.id);
    expect(loaded).toEqual(artifact);
  });

  it("lists saved runs", async () => {
    await manager.save(makeResult());
    await manager.save(makeResult({ status: "FAIL" }));

    const runs = await manager.list();
    expect(runs).toHaveLength(2);
  });

  it("returns empty list for empty directory", async () => {
    const runs = await manager.list();
    expect(runs).toEqual([]);
  });

  it("throws when loading nonexistent run", async () => {
    await expect(manager.load("nonexistent")).rejects.toThrow();
  });
});
