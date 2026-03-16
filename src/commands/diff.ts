import type { Command } from "commander";
import { loadConfig } from "../config.js";
import { diffRuns } from "../runs/differ.js";
import { exportDiffAsText } from "../runs/exporter.js";
import { loadRunOrExit } from "../runs/helpers.js";
import { RunManager } from "../runs/manager.js";
import { Logger } from "../utils/logger.js";

export function registerDiffCommand(program: Command): void {
  program
    .command("diff <runA> <runB>")
    .description("Compare two run artifacts and show regressions")
    .option("-f, --format <format>", "Output format: json or text", "text")
    .action(async (runA: string, runB: string, opts: { format: string }) => {
      const logger = new Logger("info");
      const config = loadConfig();
      const manager = new RunManager(config.dataDir);

      const artifactA = await loadRunOrExit(manager, runA, logger);
      const artifactB = await loadRunOrExit(manager, runB, logger);

      const diff = diffRuns(artifactA, artifactB);

      if (opts.format === "json") {
        console.log(JSON.stringify(diff, null, 2));
      } else {
        console.log(exportDiffAsText(diff));
      }
    });
}
