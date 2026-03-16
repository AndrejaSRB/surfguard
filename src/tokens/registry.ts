/**
 * Well-known Solana token registry.
 * Mint addresses are on-chain constants — they never change.
 * This registry enables symbol-based lookups so users don't need to paste addresses.
 */

export interface TokenEntry {
  symbol: string;
  name: string;
  mint: string;
  decimals: number;
}

const TOKENS: TokenEntry[] = [
  { symbol: "SOL", name: "Solana", mint: "So11111111111111111111111111111111111111112", decimals: 9 },
  { symbol: "USDC", name: "USD Coin", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6 },
  { symbol: "USDT", name: "Tether USD", mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", decimals: 6 },
  { symbol: "BONK", name: "Bonk", mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", decimals: 5 },
  { symbol: "JUP", name: "Jupiter", mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", decimals: 6 },
  { symbol: "RAY", name: "Raydium", mint: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R", decimals: 6 },
  { symbol: "ORCA", name: "Orca", mint: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE", decimals: 6 },
  { symbol: "MSOL", name: "Marinade SOL", mint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So", decimals: 9 },
  { symbol: "JITOSOL", name: "Jito Staked SOL", mint: "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn", decimals: 9 },
  { symbol: "PYTH", name: "Pyth Network", mint: "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3", decimals: 6 },
  { symbol: "WIF", name: "dogwifhat", mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm", decimals: 6 },
  { symbol: "RENDER", name: "Render", mint: "rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof", decimals: 8 },
  { symbol: "HNT", name: "Helium", mint: "hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux", decimals: 8 },
  { symbol: "TENSOR", name: "Tensor", mint: "TNSRxcUxoT9xBG3de7PiJyTDYu7kskLqcpddxnEJAS6", decimals: 5 },
  { symbol: "W", name: "Wormhole", mint: "85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ", decimals: 6 },
  { symbol: "BSOL", name: "BlazeStake SOL", mint: "bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1", decimals: 9 },
  { symbol: "INF", name: "Infinity", mint: "5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm", decimals: 9 },
  { symbol: "MOBILE", name: "Helium Mobile", mint: "mb1eu7TzEc71KxDpsmsKoucSSuuo6KWzBx8SBVA9qu6F", decimals: 6 },
  { symbol: "SAMO", name: "Samoyedcoin", mint: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU", decimals: 9 },
  { symbol: "MNDE", name: "Marinade", mint: "MNDEFzGvMt87ueuHvVU9VcTqsAP5b3fTGPsHuuPA5ey", decimals: 9 },
];

const SYMBOL_INDEX = new Map<string, TokenEntry>(TOKENS.map((t) => [t.symbol.toUpperCase(), t]));

export interface TokenLookupResult {
  found: true;
  token: TokenEntry;
}

export interface TokenLookupMiss {
  found: false;
  query: string;
}

export type TokenLookup = TokenLookupResult | TokenLookupMiss;

export function resolveToken(symbolOrMint: string): TokenLookup {
  const upper = symbolOrMint.toUpperCase();
  const bySymbol = SYMBOL_INDEX.get(upper);
  if (bySymbol) {
    return { found: true, token: bySymbol };
  }

  // Check if it looks like a base58 mint address (32-44 chars, alphanumeric)
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(symbolOrMint)) {
    const byMint = TOKENS.find((t) => t.mint === symbolOrMint);
    if (byMint) {
      return { found: true, token: byMint };
    }
  }

  return { found: false, query: symbolOrMint };
}

export function listTokens(): TokenEntry[] {
  return [...TOKENS];
}

export function getTokenBySymbol(symbol: string): TokenEntry | undefined {
  return SYMBOL_INDEX.get(symbol.toUpperCase());
}
