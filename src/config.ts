import { resolve } from "node:path";

export interface SurfguardConfig {
  rpcUrl: string;
  dataDir: string;
}

const DEFAULT_RPC_URL = "http://localhost:8899";

export function loadConfig(overrides: Partial<SurfguardConfig> = {}): SurfguardConfig {
  const dataDir = overrides.dataDir ?? resolve(process.cwd(), "data", "runs");
  return {
    rpcUrl: overrides.rpcUrl ?? process.env.SURFGUARD_RPC_URL ?? DEFAULT_RPC_URL,
    dataDir,
  };
}
