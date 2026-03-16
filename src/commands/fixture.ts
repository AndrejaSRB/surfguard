import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import type { Command } from "commander";
import { loadConfig } from "../config.js";
import { loadRunOrExit } from "../runs/helpers.js";
import { RunManager } from "../runs/manager.js";
import { Logger } from "../utils/logger.js";

export function registerFixtureCommand(program: Command): void {
  program
    .command("fixture <runId>")
    .description("Copy a run artifact to a directory as a test fixture for frontend or CI")
    .option("-o, --out <dir>", "Output directory", "./fixtures")
    .option("-n, --name <name>", "Output filename (without .json)")
    .action(async (runId: string, opts: { out: string; name?: string }) => {
      const logger = new Logger("info");
      const config = loadConfig();
      const manager = new RunManager(config.dataDir);

      const artifact = await loadRunOrExit(manager, runId, logger);

      const outDir = resolve(process.cwd(), opts.out);
      await mkdir(outDir, { recursive: true });

      const filename = opts.name ? `${opts.name}.json` : `${artifact.result.flowName}-${artifact.result.profile}.json`;
      const outPath = resolve(outDir, filename);

      const srcPath = resolve(config.dataDir, `${runId}.json`);
      await copyFile(srcPath, outPath);

      logger.info(`Fixture saved: ${outPath}`);
      logger.info("");
      logger.info("Usage in frontend tests:");
      const importPath = opts.out.startsWith("./") ? `${opts.out}/${filename}` : `./${opts.out}/${filename}`;
      logger.info(`  import fixture from '${importPath}';`);
      logger.info(`  // fixture.result.status === "${artifact.result.status}"`);
      logger.info(`  // fixture.result.transactionProfile — CU, logs, errors`);
    });
}
