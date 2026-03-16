import type { Logger } from "../utils/logger.js";
import { Cheatcodes } from "./cheatcodes.js";
import { SurfnetClient } from "./client.js";

export interface SurfnetConnection {
  client: SurfnetClient;
  cheatcodes: Cheatcodes;
}

/**
 * Create a surfnet client and cheatcodes instance, verify Surfpool is reachable.
 * Exits with a clear error if connection fails.
 */
export async function connectToSurfpool(rpcUrl: string, logger: Logger): Promise<SurfnetConnection> {
  const client = new SurfnetClient(rpcUrl);
  const cheatcodes = new Cheatcodes(client);

  try {
    await cheatcodes.getSurfnetInfo();
    logger.success(`Connected to Surfpool at ${rpcUrl}`);
  } catch {
    logger.error(`Cannot connect to Surfpool at ${rpcUrl}`);
    logger.error("Make sure Surfpool is running: surfpool start");
    process.exit(1);
  }

  return { client, cheatcodes };
}
