import { JupiterAdapter } from "./jupiter.js";
import type { DexAdapter } from "./types.js";

const adapters = new Map<string, DexAdapter>();

export function registerDex(adapter: DexAdapter): void {
  adapters.set(adapter.name, adapter);
}

export function getDexAdapter(name: string): DexAdapter | undefined {
  return adapters.get(name);
}

export function listDexAdapters(): string[] {
  return Array.from(adapters.keys());
}

export const DEFAULT_DEX = "jupiter";

// Register built-in adapters
registerDex(new JupiterAdapter());
