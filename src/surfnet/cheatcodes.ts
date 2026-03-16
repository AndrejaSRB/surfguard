import type { SurfnetClient } from "./client.js";
import type {
  AccountUpdate,
  ClockState,
  Scenario,
  ScenarioResult,
  SurfnetInfo,
  TimeTravelConfig,
  TransactionProfile,
} from "./types.js";

export class Cheatcodes {
  constructor(private client: SurfnetClient) {}

  async getSurfnetInfo(): Promise<SurfnetInfo> {
    return this.client.call<SurfnetInfo>("surfnet_getSurfnetInfo");
  }

  async profileTransaction(txBase64: string, tag?: string): Promise<TransactionProfile> {
    const params: unknown[] = [txBase64];
    if (tag) params.push(tag);
    return this.client.call<TransactionProfile>("surfnet_profileTransaction", params);
  }

  async registerScenario(scenario: Scenario, slot?: number): Promise<ScenarioResult> {
    const params: unknown[] = [scenario];
    if (slot !== undefined) params.push(slot);
    return this.client.call<ScenarioResult>("surfnet_registerScenario", params);
  }

  async resetNetwork(): Promise<void> {
    await this.client.call<void>("surfnet_resetNetwork");
  }

  async pauseClock(): Promise<ClockState> {
    return this.client.call<ClockState>("surfnet_pauseClock");
  }

  async resumeClock(): Promise<ClockState> {
    return this.client.call<ClockState>("surfnet_resumeClock");
  }

  async timeTravel(config: TimeTravelConfig): Promise<void> {
    await this.client.call<void>("surfnet_timeTravel", [config]);
  }

  async setAccount(pubkey: string, update: AccountUpdate): Promise<void> {
    await this.client.call<void>("surfnet_setAccount", [pubkey, update]);
  }

  async resetAccount(pubkey: string): Promise<void> {
    await this.client.call<void>("surfnet_resetAccount", [pubkey]);
  }

  async airdrop(pubkey: string, lamports: number): Promise<string> {
    return this.client.call<string>("requestAirdrop", [pubkey, lamports]);
  }
}
