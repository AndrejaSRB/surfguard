import type { Command } from "commander";
import { loadConfig } from "../config.js";
import { getFlow, listFlows } from "../flows/registry.js";
import type { FlowContext } from "../flows/types.js";
import { listBuiltInProfiles, loadProfile } from "../profiles/loader.js";
import { exportRunAsText } from "../runs/exporter.js";
import { RunManager } from "../runs/manager.js";
import { connectToSurfpool } from "../surfnet/setup.js";
import { Logger } from "../utils/logger.js";

export function registerRunCommand(program: Command): void {
  program
    .command("run <flow>")
    .description("Execute a flow under a given profile")
    .option("-p, --profile <name>", "Profile to apply", "baseline")
    .option("--rpc-url <url>", "Surfpool RPC URL")
    .action(async (flowName: string, opts: { profile: string; rpcUrl?: string }) => {
      const logger = new Logger("info");

      const flow = getFlow(flowName);
      if (!flow) {
        logger.error(`Unknown flow: "${flowName}"`);
        logger.info(`Available flows: ${listFlows().join(", ")}`);
        process.exit(1);
      }

      let profile: Awaited<ReturnType<typeof loadProfile>>;
      try {
        profile = await loadProfile(opts.profile);
      } catch (err) {
        logger.error(`Failed to load profile "${opts.profile}": ${err instanceof Error ? err.message : err}`);
        logger.info(`Built-in profiles: ${listBuiltInProfiles().join(", ")}`);
        process.exit(1);
      }

      const config = loadConfig({ rpcUrl: opts.rpcUrl });
      const { client, cheatcodes } = await connectToSurfpool(config.rpcUrl, logger);

      const ctx: FlowContext = { client, cheatcodes, config, profile, logger };
      logger.info(`Running flow "${flow.name}" with profile "${profile.name}"...\n`);

      try {
        const result = await flow.execute(ctx);

        const manager = new RunManager(config.dataDir);
        const artifact = await manager.save(result);

        console.log();
        console.log(exportRunAsText(artifact));
        console.log();
        logger.success(`Run saved: ${artifact.id}`);
        logger.info(`View with:    surfguard export ${artifact.id}`);
        logger.info(`Compare with: surfguard diff <other-run> ${artifact.id}`);
      } catch (err) {
        logger.error(`Flow execution failed: ${err instanceof Error ? err.message : err}`);
        process.exit(1);
      }
    });
}
