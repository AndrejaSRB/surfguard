/**
 * Token funding entry — sets a token balance on the test wallet before the flow runs.
 * Uses surfnet_setTokenAccount to create the ATA and set balance in one call.
 */
export interface FundTokenEntry {
  /** Token symbol (e.g., "USDC", "BONK") — resolved via token registry */
  token?: string;
  /** Direct mint address — use when token is not in the registry */
  mint?: string;
  /** Token decimals — required when using mint directly (not in registry) */
  decimals?: number;
  /** Amount in human-readable units (e.g., 100 = 100 USDC) */
  amount: number;
}

export interface ResolvedFundEntry {
  symbol: string;
  mint: string;
  decimals: number;
  rawAmount: number;
}
