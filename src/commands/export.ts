import type { Command } from "commander";
import { loadConfig } from "../config.js";
import { exportRunAsJson, exportRunAsText } from "../runs/exporter.js";
import { loadRunOrExit } from "../runs/helpers.js";
import { RunManager } from "../runs/manager.js";
import { Logger } from "../utils/logger.js";

export function registerExportCommand(program: Command): void {
  program
    .command("export <runId>")
    .description("Export a run artifact as JSON or text")
    .option("-f, --format <format>", "Output format: json or text", "text")
    .action(async (runId: string, opts: { format: string }) => {
      const logger = new Logger("info");
      const config = loadConfig();
      const manager = new RunManager(config.dataDir);

      const artifact = await loadRunOrExit(manager, runId, logger);

      if (opts.format === "json") {
        console.log(exportRunAsJson(artifact));
      } else {
        console.log(exportRunAsText(artifact));
      }
    });
}
