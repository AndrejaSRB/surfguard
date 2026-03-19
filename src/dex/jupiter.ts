import { resolveJupiterApiKey } from "../config/store.js";
import type { DexAdapter, DexQuote, QuoteParams } from "./types.js";

const JUPITER_API = "https://api.jup.ag";

interface JupiterRawQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: string;
  routePlan: unknown[];
}

interface JupiterSwapResponse {
  swapTransaction: string;
}

async function getApiKey(): Promise<string> {
  const key = await resolveJupiterApiKey();
  if (!key) {
    throw new Error(
      "Jupiter API key not found. Set it with:\n" +
        "  surfguard config set jupiter-api-key <your-key>\n" +
        "  or: export JUPITER_API_KEY=<your-key>\n" +
        "Get a free key at https://portal.jup.ag",
    );
  }
  return key;
}

export class JupiterAdapter implements DexAdapter {
  name = "jupiter";

  async getQuote(params: QuoteParams): Promise<DexQuote> {
    const apiKey = await getApiKey();
    const url = new URL(`${JUPITER_API}/swap/v1/quote`);
    url.searchParams.set("inputMint", params.inputMint);
    url.searchParams.set("outputMint", params.outputMint);
    url.searchParams.set("amount", params.amountLamports.toString());
    url.searchParams.set("slippageBps", params.slippageBps.toString());

    const res = await fetch(url.toString(), {
      headers: { "x-api-key": apiKey },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Jupiter quote failed: ${res.status} ${res.statusText} — ${body}`);
    }

    const raw = (await res.json()) as JupiterRawQuote;
    return {
      inputMint: raw.inputMint,
      outputMint: raw.outputMint,
      inAmount: raw.inAmount,
      outAmount: raw.outAmount,
      priceImpactPct: raw.priceImpactPct,
      raw,
    };
  }

  async buildSwapTransaction(quote: DexQuote, userPubkey: string): Promise<string> {
    const apiKey = await getApiKey();
    const res = await fetch(`${JUPITER_API}/swap/v1/swap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        quoteResponse: quote.raw,
        userPublicKey: userPubkey,
        wrapAndUnwrapSol: true,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Jupiter swap failed: ${res.status} ${res.statusText} — ${body}`);
    }

    const data = (await res.json()) as JupiterSwapResponse;
    return data.swapTransaction;
  }
}
