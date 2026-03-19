export interface QuoteParams {
  inputMint: string;
  outputMint: string;
  amountLamports: number;
  slippageBps: number;
}

export interface DexQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: string;
  /** Adapter-specific data needed for building the swap transaction */
  raw: unknown;
}

export interface DexAdapter {
  name: string;
  getQuote(params: QuoteParams): Promise<DexQuote>;
  buildSwapTransaction(quote: DexQuote, userPubkey: string): Promise<string>;
}
