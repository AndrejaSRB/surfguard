import type { Cheatcodes } from "../surfnet/cheatcodes.js";
import { resolveToken } from "../tokens/registry.js";
import type { Logger } from "../utils/logger.js";
import type { FundTokenEntry, ResolvedFundEntry } from "./types.js";

export function resolveEntries(entries: FundTokenEntry[]): ResolvedFundEntry[] {
  return entries.map((entry, i) => {
    if (entry.amount <= 0) {
      throw new Error(`fundTokens[${i}]: amount must be positive`);
    }

    if (entry.token) {
      const lookup = resolveToken(entry.token);
      if (!lookup.found) {
        throw new Error(`fundTokens[${i}]: unknown token "${entry.token}". Use "mint" and "decimals" instead.`);
      }
      const rawAmount = Math.floor(entry.amount * 10 ** lookup.token.decimals);
      return {
        symbol: lookup.token.symbol,
        mint: lookup.token.mint,
        decimals: lookup.token.decimals,
        rawAmount,
      };
    }

    if (entry.mint) {
      if (entry.decimals === undefined) {
        throw new Error(`fundTokens[${i}]: "decimals" is required when using "mint" directly`);
      }
      const rawAmount = Math.floor(entry.amount * 10 ** entry.decimals);
      return {
        symbol: entry.mint.slice(0, 8),
        mint: entry.mint,
        decimals: entry.decimals,
        rawAmount,
      };
    }

    throw new Error(`fundTokens[${i}]: must specify either "token" or "mint"`);
  });
}

/**
 * Fund a wallet with SPL tokens via surfnet_setTokenAccount.
 * Creates ATAs and sets balances in one call per token.
 */
export async function fundWalletTokens(
  cheatcodes: Cheatcodes,
  walletPubkey: string,
  entries: FundTokenEntry[],
  logger: Logger,
): Promise<void> {
  const resolved = resolveEntries(entries);

  for (const entry of resolved) {
    logger.info(`Funding ${entry.symbol}: ${entry.rawAmount / 10 ** entry.decimals} (${entry.rawAmount} raw)`);
    await cheatcodes.setTokenAccount(walletPubkey, entry.mint, { amount: entry.rawAmount });
    logger.success(`${entry.symbol} funded`);
  }
}
