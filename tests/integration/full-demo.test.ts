import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { loadConfig } from "../../src/config.js";
import { getFlow } from "../../src/flows/registry.js";
import type { FlowContext } from "../../src/flows/types.js";
import { loadProfile } from "../../src/profiles/loader.js";
import { diffRuns } from "../../src/runs/differ.js";
import { exportDiffAsText, exportRunAsJson, exportRunAsText } from "../../src/runs/exporter.js";
import { RunManager } from "../../src/runs/manager.js";
import { Cheatcodes, SurfnetClient } from "../../src/surfnet/index.js";
import { Logger } from "../../src/utils/logger.js";

const RPC_URL = process.env.SURFGUARD_RPC_URL ?? "http://localhost:8899";

describe("Full demo flow (requires running Surfpool)", () => {
  let tmpDir: string;
  let manager: RunManager;
  let client: SurfnetClient;
  let cheatcodes: Cheatcodes;
  let logger: Logger;

  beforeAll(async () => {
    client = new SurfnetClient(RPC_URL);
    cheatcodes = new Cheatcodes(client);

    // Verify Surfpool is reachable
    try {
      await cheatcodes.getSurfnetInfo();
    } catch {
      throw new Error(`Surfpool is not reachable at ${RPC_URL}. Start it with: surfpool start`);
    }
  });

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "surfguard-integ-"));
    manager = new RunManager(tmpDir);
    logger = new Logger("info");
  });

  async function buildContext(profileName: string): Promise<FlowContext> {
    const profile = await loadProfile(profileName);
    const config = loadConfig({ dataDir: tmpDir });
    return { client, cheatcodes, config, profile, logger };
  }

  it("Step 1: baseline run produces PASS", async () => {
    const ctx = await buildContext("baseline");
    const flow = getFlow("swap")!;
    const result = await flow.execute(ctx);

    expect(result.status).toBe("PASS");
    expect(result.flowName).toBe("swap");
    expect(result.profile).toBe("baseline");
    expect(result.transactionProfile).toBeDefined();
    expect(result.transactionProfile!.computeUnits).toBeGreaterThan(0);

    const artifact = await manager.save(result);
    expect(artifact.id).toMatch(/^run-/);
  });

  it("Step 2: oracle-shock run produces FAIL", async () => {
    const ctx = await buildContext("oracle-shock");
    const flow = getFlow("swap")!;
    const result = await flow.execute(ctx);

    expect(result.status).toBe("FAIL");
    expect(result.profile).toBe("oracle-shock");
    expect(result.transactionProfile).toBeDefined();
  });

  it("Step 3: diff baseline vs oracle-shock shows regression", async () => {
    const flow = getFlow("swap")!;

    const baselineCtx = await buildContext("baseline");
    const baselineResult = await flow.execute(baselineCtx);
    const artifactA = await manager.save(baselineResult);

    const shockCtx = await buildContext("oracle-shock");
    const shockResult = await flow.execute(shockCtx);
    const artifactB = await manager.save(shockResult);

    const diff = diffRuns(artifactA, artifactB);
    expect(diff.riskLevel).toBe("critical");
    expect(diff.statusChange.changed).toBe(true);
    expect(diff.statusChange.from).toBe("PASS");
    expect(diff.statusChange.to).toBe("FAIL");

    const diffText = exportDiffAsText(diff);
    expect(diffText).toContain("CRITICAL");
    expect(diffText).toContain("PASS → FAIL");
  });

  it("Step 4: export produces valid JSON and text", async () => {
    const ctx = await buildContext("baseline");
    const flow = getFlow("swap")!;
    const result = await flow.execute(ctx);
    const artifact = await manager.save(result);

    // JSON export
    const json = exportRunAsJson(artifact);
    const parsed = JSON.parse(json);
    expect(parsed.id).toBe(artifact.id);
    expect(parsed.result.status).toBe("PASS");

    // Text export
    const text = exportRunAsText(artifact);
    expect(text).toContain(artifact.id);
    expect(text).toContain("PASS");
    expect(text).toContain("Compute Units:");
  });

  it("Full pipeline: run → save → list → load → diff → export", async () => {
    const flow = getFlow("swap")!;

    // Run baseline
    const ctx1 = await buildContext("baseline");
    const result1 = await flow.execute(ctx1);
    const artifact1 = await manager.save(result1);

    // Run oracle-shock
    const ctx2 = await buildContext("oracle-shock");
    const result2 = await flow.execute(ctx2);
    const artifact2 = await manager.save(result2);

    // List
    const runs = await manager.list();
    expect(runs).toHaveLength(2);

    // Load
    const loaded1 = await manager.load(artifact1.id);
    expect(loaded1.result.status).toBe("PASS");
    const loaded2 = await manager.load(artifact2.id);
    expect(loaded2.result.status).toBe("FAIL");

    // Diff
    const diff = diffRuns(loaded1, loaded2);
    expect(diff.riskLevel).toBe("critical");

    // Export both formats
    expect(exportRunAsJson(loaded2)).toContain('"FAIL"');
    expect(exportRunAsText(loaded2)).toContain("FAIL");
    expect(exportDiffAsText(diff)).toContain("CRITICAL");
  });
});
