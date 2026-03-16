import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { resolve } from "node:path";

const CONFIG_DIR = resolve(homedir(), ".surfguard");
const CONFIG_PATH = resolve(CONFIG_DIR, "config.json");

export interface SurfguardConfigStore {
  "jupiter-api-key"?: string;
  "rpc-url"?: string;
}

const KNOWN_KEYS = new Set<keyof SurfguardConfigStore>(["jupiter-api-key", "rpc-url"]);

export function isKnownConfigKey(key: string): key is keyof SurfguardConfigStore {
  return KNOWN_KEYS.has(key as keyof SurfguardConfigStore);
}

export function listKnownKeys(): string[] {
  return [...KNOWN_KEYS];
}

export async function readConfig(): Promise<SurfguardConfigStore> {
  try {
    const raw = await readFile(CONFIG_PATH, "utf-8");
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    return parsed as SurfguardConfigStore;
  } catch {
    return {};
  }
}

export async function writeConfig(config: SurfguardConfigStore): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

export async function getConfigValue(key: keyof SurfguardConfigStore): Promise<string | undefined> {
  const config = await readConfig();
  return config[key];
}

export async function setConfigValue(key: keyof SurfguardConfigStore, value: string): Promise<void> {
  const config = await readConfig();
  config[key] = value;
  await writeConfig(config);
}

/**
 * Resolve the Jupiter API key from multiple sources, in priority order:
 * 1. Explicit value passed (e.g., from a CLI flag)
 * 2. JUPITER_API_KEY environment variable
 * 3. ~/.surfguard/config.json "jupiter-api-key"
 *
 * Returns undefined if not found anywhere.
 */
export async function resolveJupiterApiKey(explicit?: string): Promise<string | undefined> {
  if (explicit) return explicit;
  if (process.env.JUPITER_API_KEY) return process.env.JUPITER_API_KEY;
  return getConfigValue("jupiter-api-key");
}

/**
 * Resolve the RPC URL from multiple sources, in priority order:
 * 1. Explicit value passed (e.g., from --rpc-url flag)
 * 2. SURFGUARD_RPC_URL environment variable
 * 3. ~/.surfguard/config.json "rpc-url"
 * 4. Default: http://localhost:8899
 */
export async function resolveRpcUrl(explicit?: string): Promise<string> {
  if (explicit) return explicit;
  if (process.env.SURFGUARD_RPC_URL) return process.env.SURFGUARD_RPC_URL;
  const stored = await getConfigValue("rpc-url");
  if (stored) return stored;
  return "http://localhost:8899";
}
