import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Profile } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUILT_IN_DIR = resolve(__dirname, "built-in");

const BUILT_IN_PROFILES: Record<string, string> = {
  baseline: "baseline.json",
  "oracle-shock": "oracle-shock.json",
  "low-balance": "low-balance.json",
  "transfer-baseline": "transfer-baseline.json",
  "transfer-low-balance": "transfer-low-balance.json",
};

export async function loadProfile(name: string): Promise<Profile> {
  const builtInFile = BUILT_IN_PROFILES[name];
  if (builtInFile) {
    const filePath = resolve(BUILT_IN_DIR, builtInFile);
    const raw = await readFile(filePath, "utf-8");
    return validateProfile(JSON.parse(raw));
  }

  // Try loading as a file path
  const raw = await readFile(resolve(process.cwd(), name), "utf-8");
  return validateProfile(JSON.parse(raw));
}

export function validateProfile(data: unknown): Profile {
  if (!data || typeof data !== "object") {
    throw new Error("Profile must be a JSON object");
  }
  const obj = data as Record<string, unknown>;
  if (typeof obj.name !== "string" || !obj.name) {
    throw new Error("Profile must have a 'name' string field");
  }
  if (typeof obj.description !== "string") {
    throw new Error("Profile must have a 'description' string field");
  }
  if (obj.overrides !== undefined) {
    if (!Array.isArray(obj.overrides)) {
      throw new Error("Profile 'overrides' must be an array");
    }
    for (const o of obj.overrides) {
      if (typeof o.templateId !== "string") {
        throw new Error("Each override must have a 'templateId' string");
      }
      if (typeof o.account !== "string") {
        throw new Error("Each override must have an 'account' string (pubkey)");
      }
      if (!o.values || typeof o.values !== "object") {
        throw new Error("Each override must have a 'values' object");
      }
    }
  }
  return data as Profile;
}

export function listBuiltInProfiles(): string[] {
  return Object.keys(BUILT_IN_PROFILES);
}
