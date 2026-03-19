export interface TransferFlowConfig {
  /** Token to transfer — "SOL" for native, or any token symbol (e.g., "USDC", "BONK") */
  token: string;
  /** Amount to transfer in human-readable units */
  amount: number;
  /** SOL to airdrop to the sender wallet (needed for transaction fees) */
  airdropSol: number;
  /** Optional receiver address. If omitted, a fresh keypair is generated. */
  receiverAddress?: string;
}
