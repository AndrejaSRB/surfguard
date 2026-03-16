import { resolveJupiterApiKey } from "../../config/store.js";
import type { JupiterQuote, JupiterSwapResponse } from "./types.js";

const JUPITER_API = "https://api.jup.ag";

const DEFAULT_SLIPPAGE_BPS = 1000;

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

export async function getJupiterQuote(
  inputMint: string,
  outputMint: string,
  amountLamports: number,
  slippageBps?: number,
): Promise<JupiterQuote> {
  const apiKey = await getApiKey();
  const url = new URL(`${JUPITER_API}/swap/v1/quote`);
  url.searchParams.set("inputMint", inputMint);
  url.searchParams.set("outputMint", outputMint);
  url.searchParams.set("amount", amountLamports.toString());
  url.searchParams.set("slippageBps", (slippageBps ?? DEFAULT_SLIPPAGE_BPS).toString());

  const res = await fetch(url.toString(), {
    headers: { "x-api-key": apiKey },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Jupiter quote failed: ${res.status} ${res.statusText} — ${body}`);
  }
  return (await res.json()) as JupiterQuote;
}

export async function getJupiterSwapTransaction(quote: JupiterQuote, userPublicKey: string): Promise<string> {
  const apiKey = await getApiKey();
  const res = await fetch(`${JUPITER_API}/swap/v1/swap`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey,
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
