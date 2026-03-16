import type { Command } from "commander";
import { loadConfig } from "../config.js";
import { getFlow, listFlows } from "../flows/registry.js";
import type { FlowContext, FlowResult } from "../flows/types.js";
import { listBuiltInProfiles, loadProfile } from "../profiles/loader.js";
import { diffRuns } from "../runs/differ.js";
import { RunManager } from "../runs/manager.js";
import type { RunArtifact } from "../runs/types.js";
import { connectToSurfpool } from "../surfnet/setup.js";
import { Logger } from "../utils/logger.js";

export function registerCiCommand(program: Command): void {
  program
    .command("ci")
    .description("Run all flows against all profiles, report regressions, exit non-zero on failure")
    .option("--rpc-url <url>", "Surfpool RPC URL")
    .option("--baseline <runId>", "Run ID to compare against for regression detection")
    .option("--flows <flows>", "Comma-separated list of flows to run (default: all)")
    .option("--profiles <profiles>", "Comma-separated list of profiles to run (default: all built-in)")
    .action(async (opts: { rpcUrl?: string; baseline?: string; flows?: string; profiles?: string }) => {
      const logger = new Logger("info");
      const config = loadConfig({ rpcUrl: opts.rpcUrl });
      const { client, cheatcodes } = await connectToSurfpool(config.rpcUrl, logger);
      const manager = new RunManager(config.dataDir);

      const flowNames = opts.flows ? opts.flows.split(",") : listFlows();
      const profileNames = opts.profiles ? opts.profiles.split(",") : listBuiltInProfiles();

      // Load baseline if provided
      let baselineArtifact: RunArtifact | undefined;
      if (opts.baseline) {
        try {
          baselineArtifact = await manager.load(opts.baseline);
        } catch {
          logger.error(`Cannot load baseline run "${opts.baseline}"`);
          process.exit(1);
        }
      }

      console.log("========================================");
      console.log("  SURFGUARD CI");
      console.log("========================================");
      console.log();

      const results: { flow: string; profile: string; status: string; runId: string; regression: boolean }[] = [];
      let hasFailure = false;

      for (const flowName of flowNames) {
        const flow = getFlow(flowName);
        if (!flow) {
          logger.warn(`Unknown flow: ${flowName}, skipping`);
          continue;
        }

        for (const profileName of profileNames) {
          let profile: Awaited<ReturnType<typeof loadProfile>>;
          try {
            profile = await loadProfile(profileName);
          } catch {
            logger.warn(`Cannot load profile: ${profileName}, skipping`);
            continue;
          }

          const ctx: FlowContext = { client, cheatcodes, config, profile, logger };

          let result: FlowResult;
          try {
            result = await flow.execute(ctx);
          } catch (err) {
            logger.error(`${flowName}/${profileName}: execution failed — ${err instanceof Error ? err.message : err}`);
            results.push({ flow: flowName, profile: profileName, status: "ERROR", runId: "-", regression: false });
            hasFailure = true;
            continue;
          }

          const artifact = await manager.save(result);

          // Check for regression against baseline
          let regression = false;
          if (baselineArtifact && baselineArtifact.result.flowName === flowName) {
            const diff = diffRuns(baselineArtifact, artifact);
            if (diff.riskLevel === "critical" || diff.riskLevel === "high") {
              regression = true;
              hasFailure = true;
            }
          }

          results.push({
            flow: flowName,
            profile: profileName,
            status: result.status,
            runId: artifact.id,
            regression,
          });

          if (result.status === "FAIL") {
            hasFailure = true;
          }
        }
      }

      // Print summary table
      console.log("  Results:");
      console.log("  ────────────────────────────────────────────────────────");
      console.log("  Flow        Profile          Status  Regression  Run ID");
      console.log("  ────────────────────────────────────────────────────────");

      for (const r of results) {
        const regLabel = r.regression ? "!! YES" : "   no";
        const flow = r.flow.padEnd(10);
        const profile = r.profile.padEnd(15);
        const status = r.status.padEnd(6);
        console.log(`  ${flow}  ${profile}  ${status}  ${regLabel}       ${r.runId}`);
      }

      console.log("  ────────────────────────────────────────────────────────");
      console.log();

      const passed = results.filter((r) => r.status === "PASS").length;
      const failed = results.filter((r) => r.status !== "PASS").length;
      const regressions = results.filter((r) => r.regression).length;

      console.log(`  Total: ${results.length} | Passed: ${passed} | Failed: ${failed} | Regressions: ${regressions}`);
      console.log();

      if (hasFailure) {
        console.log("  CI RESULT: FAIL");
        console.log("========================================");
        process.exit(1);
      } else {
        console.log("  CI RESULT: PASS");
        console.log("========================================");
      }
    });
}
