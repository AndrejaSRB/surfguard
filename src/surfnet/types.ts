export interface SurfnetInfo {
  [key: string]: unknown;
}

export interface TransactionProfile {
  [key: string]: unknown;
}

export interface AccountAccess {
  pubkey: string;
  writable: boolean;
  signer: boolean;
}

export interface OverrideInstance {
  id: string;
  templateId: string;
  values: Record<string, unknown>;
  scenarioRelativeSlot: number;
  label?: string | null;
  enabled: boolean;
  fetchBeforeUse?: boolean;
  account: AccountAddress;
}

export type AccountAddress = { pubkey: string } | { pda: { programId: string; seeds: unknown[] } };

export interface Scenario {
  id: string;
  name: string;
  description: string;
  overrides: OverrideInstance[];
  tags: string[];
}

export interface ScenarioResult {
  [key: string]: unknown;
}

export interface ClockState {
  [key: string]: unknown;
}

export interface TimeTravelConfig {
  absoluteEpoch?: number;
  absoluteSlot?: number;
  absoluteTimestamp?: number;
}

export interface AccountUpdate {
  lamports?: number;
  data?: string;
  owner?: string;
  executable?: boolean;
  rentEpoch?: number;
}
