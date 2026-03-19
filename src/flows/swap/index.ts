import { Connection, Keypair, LAMPORTS_PER_SOL, VersionedTransaction } from "@solana/web3.js";
import { DEFAULT_DEX, getDexAdapter, listDexAdapters } from "../../dex/registry.js";
import { DRIFT_WARNING, isDriftError } from "../../errors/drift.js";
import { translateError } from "../../errors/translator.js";
import { profileToScenarios } from "../../surfnet/scenarios.js";
import { getTokenBySymbol, resolveToken } from "../../tokens/registry.js";
import type { FlowContext, FlowResult, FlowRunner } from "../types.js";
import { SWAP_DEFAULTS } from "./defaults.js";

interface SwapFlowConfig {
  dex: string;
  inputToken: string;
  inputMint: string;
  outputToken: string;
  outputMint: string;
  amount: number;
  airdropSol: number;
  slippageBps: number;
}

function resolveSwapConfig(flowConfig: Record<string, unknown> | undefined): SwapFlowConfig {
  const inputSymbol = (flowConfig?.inputToken as string | undefined) ?? SWAP_DEFAULTS.inputToken;
  const outputSymbol = (flowConfig?.outputToken as string | undefined) ?? SWAP_DEFAULTS.outputToken;

  const inputLookup = resolveToken((flowConfig?.inputMint as string) ?? inputSymbol);
  const outputLookup = resolveToken((flowConfig?.outputMint as string) ?? outputSymbol);

  if (!inputLookup.found) {
    throw new Error(`Unknown input token: "${inputSymbol}". Provide inputMint in flowConfig.`);
  }
  if (!outputLookup.found) {
    throw new Error(`Unknown output token: "${outputSymbol}". Provide outputMint in flowConfig.`);
  }

  return {
    dex: (flowConfig?.dex as string | undefined) ?? DEFAULT_DEX,
    inputToken: inputLookup.token.symbol,
    inputMint: inputLookup.token.mint,
    outputToken: outputLookup.token.symbol,
    outputMint: outputLookup.token.mint,
    amount: (flowConfig?.amount as number | undefined) ?? SWAP_DEFAULTS.amount,
    airdropSol: (flowConfig?.airdropSol as number | undefined) ?? SWAP_DEFAULTS.airdropSol,
    slippageBps: (flowConfig?.slippageBps as number | undefined) ?? SWAP_DEFAULTS.slippageBps,
  };
}

export class SwapFlow implements FlowRunner {
  name = "swap";
  description = "Token swap via DEX adapter, profiled through Surfpool";

  async execute(ctx: FlowContext): Promise<FlowResult> {
    const start = Date.now();
    const { cheatcodes, config, logger, profile } = ctx;
    const connection = new Connection(config.rpcUrl);
    const swapConfig = resolveSwapConfig(profile.flowConfig);

    // Resolve DEX adapter
    const adapter = getDexAdapter(swapConfig.dex);
    if (!adapter) {
      throw new Error(`Unknown DEX adapter: "${swapConfig.dex}". Available: ${listDexAdapters().join(", ")}`);
    }

    // 1. Reset network and pause clock for determinism
    logger.info("Resetting network state...");
    await cheatcodes.resetNetwork();
    await cheatcodes.pauseClock();

    // 2. Apply profile scenarios (e.g., oracle overrides)
    const scenarios = profileToScenarios(profile);
    for (const scenario of scenarios) {
      logger.info(`Applying scenario: ${scenario.name}`);
      await cheatcodes.registerScenario(scenario);
    }

    // 3. Create test wallet and airdrop
    const wallet = Keypair.generate();
    const pubkey = wallet.publicKey.toBase58();
    logger.info(`Airdropping ${swapConfig.airdropSol} SOL to ${pubkey}`);
    await cheatcodes.airdrop(pubkey, Math.floor(swapConfig.airdropSol * LAMPORTS_PER_SOL));
    logger.success("Wallet funded");

    // 4. Resume clock for execution
    await cheatcodes.resumeClock();

    // 5. Get quote and swap transaction via DEX adapter
    const amountLamports = Math.floor(swapConfig.amount * LAMPORTS_PER_SOL);
    const slippageLabel = ` (slippage: ${swapConfig.slippageBps} bps)`;
    logger.info(
      `Getting ${adapter.name} quote for ${swapConfig.amount} ${swapConfig.inputToken} → ${swapConfig.outputToken}${slippageLabel}...`,
    );

    const quote = await adapter.getQuote({
      inputMint: swapConfig.inputMint,
      outputMint: swapConfig.outputMint,
      amountLamports,
      slippageBps: swapConfig.slippageBps,
    });

    const outputTokenEntry = getTokenBySymbol(swapConfig.outputToken);
    const outputDecimals = outputTokenEntry?.decimals ?? 6;
    const displayPrecision = outputDecimals <= 6 ? 2 : 4;
    const outputFormatted = (Number(quote.outAmount) / 10 ** outputDecimals).toFixed(displayPrecision);
    logger.success(`Quote received: ${outputFormatted} ${swapConfig.outputToken}, ${quote.priceImpactPct}% impact`);

    const swapTxBase64 = await adapter.buildSwapTransaction(quote, pubkey);

    // 6. Deserialize, replace blockhash with Surfpool's, sign, and serialize
    logger.info("Preparing transaction...");
    const txBuffer = Buffer.from(swapTxBase64, "base64");
    const tx = VersionedTransaction.deserialize(txBuffer);
    const { blockhash } = await connection.getLatestBlockhash();
    tx.message.recentBlockhash = blockhash;
    tx.sign([wallet]);
    const signedTxBase64 = Buffer.from(tx.serialize()).toString("base64");

    // 7. Profile the transaction via surfnet
    logger.info("Profiling transaction via surfnet...");
    const rawProfile = (await cheatcodes.profileTransaction(signedTxBase64)) as Record<string, unknown>;

    // 8. Pause clock and extract results
    await cheatcodes.pauseClock();

    // Parse surfnet_profileTransaction response
    const value = (rawProfile.value ?? {}) as Record<string, unknown>;
    const txProfileData = (value.transactionProfile ?? {}) as Record<string, unknown>;

    const rawErrorMessage = txProfileData.errorMessage as string | null | undefined;
    const computeUnits = Number(txProfileData.computeUnitsConsumed ?? 0);
    const logMessages = (txProfileData.logMessages ?? []) as string[];
    const success = !rawErrorMessage;

    const errorInfo = rawErrorMessage ? translateError(rawErrorMessage) : undefined;
    const displayError = errorInfo?.translated ?? rawErrorMessage;

    const status = success ? "PASS" : "FAIL";
    const summary = success
      ? `Swap succeeded: ${swapConfig.amount} ${swapConfig.inputToken} → ${outputFormatted} ${swapConfig.outputToken} (${computeUnits.toLocaleString()} CU)`
      : `Swap failed: ${displayError} (${computeUnits.toLocaleString()} CU)`;

    if (success) {
      logger.success(summary);
    } else {
      logger.error(summary);
      if (rawErrorMessage && isDriftError(rawErrorMessage)) {
        logger.warn(DRIFT_WARNING);
      }
    }

    return {
      flowName: this.name,
      profile: profile.name,
      status,
      summary,
      transactionProfile: {
        computeUnits,
        logMessages,
        errorMessage: rawErrorMessage ?? undefined,
        errorTranslated: displayError ?? undefined,
        success,
      },
      metadata: {
        dex: adapter.name,
        walletPubkey: pubkey,
        inputToken: swapConfig.inputToken,
        outputToken: swapConfig.outputToken,
        swapAmount: swapConfig.amount,
        quoteOutput: outputFormatted,
        priceImpactPct: quote.priceImpactPct,
        scenariosApplied: scenarios.map((s) => s.name),
        computeUnits,
      },
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - start,
    };
  }
}
