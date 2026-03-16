import type { Command } from "commander";
import { loadConfig } from "../config.js";
import { RunManager } from "../runs/manager.js";
import { Logger } from "../utils/logger.js";

export function registerListCommand(program: Command): void {
  program
    .command("list")
    .description("List all saved run artifacts")
    .action(async () => {
      const logger = new Logger("info");
      const config = loadConfig();
      const manager = new RunManager(config.dataDir);

      const runs = await manager.list();
      if (runs.length === 0) {
        logger.info("No runs found. Use 'surfguard run <flow>' to create one.");
        return;
      }

      logger.info(`Found ${runs.length} run(s):\n`);
      for (const runId of runs) {
        try {
          const artifact = await manager.load(runId);
          const r = artifact.result;
          console.log(`  ${runId}  ${r.status}  ${r.flowName}/${r.profile}  ${r.timestamp}`);
        } catch {
          console.log(`  ${runId}  (corrupt or unreadable)`);
        }
      }
    });
}
