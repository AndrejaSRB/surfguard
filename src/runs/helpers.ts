import type { Logger } from "../utils/logger.js";
import type { RunManager } from "./manager.js";
import type { RunArtifact } from "./types.js";

/**
 * Load a run artifact by ID, or exit with a helpful error listing available runs.
 */
export async function loadRunOrExit(manager: RunManager, runId: string, logger: Logger): Promise<RunArtifact> {
  try {
    return await manager.load(runId);
  } catch {
    logger.error(`Cannot load run "${runId}".`);
    const runs = await manager.list();
    if (runs.length > 0) {
      logger.info(`Available runs: ${runs.join(", ")}`);
    } else {
      logger.info("No runs found. Use 'surfguard run <flow>' to create one.");
    }
    process.exit(1);
  }
}
