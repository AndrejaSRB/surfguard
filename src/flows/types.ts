import type { SurfguardConfig } from "../config.js";
import type { Profile } from "../profiles/types.js";
import type { Cheatcodes } from "../surfnet/cheatcodes.js";
import type { SurfnetClient } from "../surfnet/client.js";
import type { TransactionProfile } from "../surfnet/types.js";
import type { Logger } from "../utils/logger.js";

export interface FlowContext {
  client: SurfnetClient;
  cheatcodes: Cheatcodes;
  config: SurfguardConfig;
  profile: Profile;
  logger: Logger;
}

export interface FlowResult {
  flowName: string;
  profile: string;
  status: "PASS" | "FAIL";
  summary: string;
  transactionProfile?: TransactionProfile;
  metadata: Record<string, unknown>;
  timestamp: string;
  durationMs: number;
}

export interface FlowRunner {
  name: string;
  description: string;
  execute(ctx: FlowContext): Promise<FlowResult>;
}
