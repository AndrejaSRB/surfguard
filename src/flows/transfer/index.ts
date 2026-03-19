import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { DRIFT_WARNING, isDriftError } from "../../errors/drift.js";
import { translateError } from "../../errors/translator.js";
import { fundWalletTokens } from "../../funding/funder.js";
import { parseFundTokens } from "../../funding/parse.js";
import { profileToScenarios } from "../../surfnet/scenarios.js";
import { resolveToken } from "../../tokens/registry.js";
import type { FlowContext, FlowResult, FlowRunner } from "../types.js";
import { TRANSFER_DEFAULTS } from "./defaults.js";
import type { TransferFlowConfig } from "./types.js";

const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ATA_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

function resolveTransferConfig(flowConfig: Record<string, unknown> | undefined): TransferFlowConfig {
  const token = ((flowConfig?.token as string | undefined) ?? TRANSFER_DEFAULTS.token).toUpperCase();

  const amount = (flowConfig?.amount as number | undefined) ?? TRANSFER_DEFAULTS.amount;
  const airdropSol = (flowConfig?.airdropSol as number | undefined) ?? TRANSFER_DEFAULTS.airdropSol;
  const receiverAddress = flowConfig?.receiverAddress as string | undefined;

  if (amount <= 0) {
    throw new Error("Transfer amount must be positive");
  }
  if (airdropSol <= 0) {
    throw new Error("Airdrop amount must be positive");
  }
  if (receiverAddress !== undefined) {
    try {
      new PublicKey(receiverAddress);
    } catch {
      throw new Error(`Invalid receiver address: "${receiverAddress}"`);
    }
  }

  return { token, amount, airdropSol, receiverAddress };
}

/** Derive the associated token account address */
function deriveAta(owner: PublicKey, mint: PublicKey): PublicKey {
  const [ata] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ATA_PROGRAM_ID,
  );
  return ata;
}

/** Build an SPL Token transfer instruction (no spl-token dependency) */
function buildTokenTransferInstruction(
  sourceAta: PublicKey,
  destAta: PublicKey,
  authority: PublicKey,
  rawAmount: number,
): TransactionInstruction {
  // SPL Token Transfer instruction: index 3, data = 8 bytes (amount as u64 LE)
  const data = Buffer.alloc(9);
  data.writeUInt8(3, 0); // Transfer instruction index
  data.writeBigUInt64LE(BigInt(rawAmount), 1);

  return new TransactionInstruction({
    programId: TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: sourceAta, isSigner: false, isWritable: true },
      { pubkey: destAta, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: false },
    ],
    data,
  });
}

export class TransferFlow implements FlowRunner {
  name = "transfer";
  description = "SOL or SPL token transfer between wallets, profiled through Surfpool";

  async execute(ctx: FlowContext): Promise<FlowResult> {
    const start = Date.now();
    const { cheatcodes, config, logger, profile } = ctx;
    const connection = new Connection(config.rpcUrl);
    const transferConfig = resolveTransferConfig(profile.flowConfig);
    const isSOL = transferConfig.token === "SOL";

    // 1. Reset network and pause clock
    logger.info("Resetting network state...");
    await cheatcodes.resetNetwork();
    await cheatcodes.pauseClock();

    // 2. Apply profile scenarios
    const scenarios = profileToScenarios(profile);
    for (const scenario of scenarios) {
      logger.info(`Applying scenario: ${scenario.name}`);
      await cheatcodes.registerScenario(scenario);
    }

    // 3. Create sender wallet and airdrop SOL (for fees)
    const sender = Keypair.generate();
    const senderPubkey = sender.publicKey.toBase58();
    logger.info(`Airdropping ${transferConfig.airdropSol} SOL to sender ${senderPubkey}`);
    await cheatcodes.airdrop(senderPubkey, Math.floor(transferConfig.airdropSol * LAMPORTS_PER_SOL));
    logger.success("SOL airdropped");

    // 3b. Fund SPL tokens if specified
    const fundEntries = parseFundTokens(profile.flowConfig);
    if (fundEntries.length > 0) {
      await fundWalletTokens(cheatcodes, senderPubkey, fundEntries, logger);
    }

    // 4. Resolve receiver
    const receiver = transferConfig.receiverAddress
      ? new PublicKey(transferConfig.receiverAddress)
      : Keypair.generate().publicKey;
    const receiverPubkey = receiver.toBase58();
    logger.info(`Receiver: ${receiverPubkey}${transferConfig.receiverAddress ? "" : " (generated)"}`);

    // 5. Resume clock
    await cheatcodes.resumeClock();

    // 6. Build transfer transaction
    const { blockhash } = await connection.getLatestBlockhash();
    const tx = new Transaction({ recentBlockhash: blockhash, feePayer: sender.publicKey });

    let transferLabel: string;

    if (isSOL) {
      const lamports = Math.floor(transferConfig.amount * LAMPORTS_PER_SOL);
      tx.add(SystemProgram.transfer({ fromPubkey: sender.publicKey, toPubkey: receiver, lamports }));
      transferLabel = `${transferConfig.amount} SOL`;
    } else {
      // SPL token transfer
      const tokenLookup = resolveToken(transferConfig.token);
      if (!tokenLookup.found) {
        throw new Error(`Unknown token: "${transferConfig.token}". Add it to fundTokens with a mint address.`);
      }
      const mint = new PublicKey(tokenLookup.token.mint);
      const rawAmount = Math.floor(transferConfig.amount * 10 ** tokenLookup.token.decimals);

      // Ensure receiver ATA exists via surfnet_setTokenAccount
      await cheatcodes.setTokenAccount(receiverPubkey, tokenLookup.token.mint, { amount: 0 });

      const sourceAta = deriveAta(sender.publicKey, mint);
      const destAta = deriveAta(receiver, mint);

      tx.add(buildTokenTransferInstruction(sourceAta, destAta, sender.publicKey, rawAmount));
      transferLabel = `${transferConfig.amount} ${tokenLookup.token.symbol}`;
    }

    logger.info(`Building transfer: ${transferLabel} → ${receiverPubkey}`);
    tx.sign(sender);
    const signedTxBase64 = Buffer.from(tx.serialize()).toString("base64");

    // 7. Profile the transaction
    logger.info("Profiling transaction via surfnet...");
    const rawProfile = (await cheatcodes.profileTransaction(signedTxBase64)) as Record<string, unknown>;

    // 8. Pause clock and extract results
    await cheatcodes.pauseClock();

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
      ? `Transfer succeeded: ${transferLabel} → ${receiverPubkey.slice(0, 8)}... (${computeUnits.toLocaleString()} CU)`
      : `Transfer failed: ${displayError} (${computeUnits.toLocaleString()} CU)`;

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
        token: transferConfig.token,
        transferAmount: transferConfig.amount,
        senderPubkey,
        receiverPubkey,
        scenariosApplied: scenarios.map((s) => s.name),
        computeUnits,
      },
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - start,
    };
  }
}
