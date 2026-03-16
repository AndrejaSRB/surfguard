import { SwapFlow } from "./swap/index.js";
import type { FlowRunner } from "./types.js";

const flows = new Map<string, FlowRunner>();

export function registerFlow(flow: FlowRunner): void {
  flows.set(flow.name, flow);
}

export function getFlow(name: string): FlowRunner | undefined {
  return flows.get(name);
}

export function listFlows(): string[] {
  return Array.from(flows.keys());
}

// Register built-in flows
registerFlow(new SwapFlow());
