import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Command } from "commander";
import { resolveJupiterApiKey, setConfigValue } from "../config/store.js";
import { DEFAULT_DEX, listDexAdapters } from "../dex/registry.js";
import { SWAP_DEFAULTS } from "../flows/swap/defaults.js";
import type { Profile } from "../profiles/types.js";
import { listTokens, resolveToken } from "../tokens/registry.js";
import { Logger } from "../utils/logger.js";
import { ask, askRequired, closePrompt } from "../utils/prompt.js";

const SUPPORTED_FLOWS = ["swap"];

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Create a new profile interactively")
    .option("--type <flow>", "Flow type (swap)")
    .option("--dex <name>", "DEX adapter (default: jupiter)")
    .option("--from <token>", "Input token symbol")
    .option("--to <token>", "Output token symbol")
    .option("--amount <amount>", "Swap amount")
    .option("--airdrop <sol>", "Airdrop amount in SOL")
    .option("--slippage <bps>", "Slippage tolerance in basis points")
    .option("--name <name>", "Profile name")
    .option("--out <dir>", "Output directory", "./profiles")
    .action(
      async (opts: {
        type?: string;
        dex?: string;
        from?: string;
        to?: string;
        amount?: string;
        airdrop?: string;
        slippage?: string;
        name?: string;
        out: string;
      }) => {
        const logger = new Logger("info");
        const interactive = !opts.name;

        try {
          if (interactive) {
            logger.header("\n  Surfguard Profile Setup\n");
          }

          // Check Jupiter API key
          const apiKey = await resolveJupiterApiKey();
          if (!apiKey) {
            if (interactive) {
              logger.warn("Jupiter API key not found.");
              const key = await askRequired("Enter your Jupiter API key (from https://portal.jup.ag)");
              await setConfigValue("jupiter-api-key", key);
              logger.success("Jupiter API key saved to config");
              console.log();
            } else {
              logger.error("Jupiter API key not found. Run: surfguard config set jupiter-api-key <key>");
              process.exit(1);
            }
          }

          // Flow type
          const flowType = opts.type ?? (await askWithOptions("Flow type", SUPPORTED_FLOWS, "swap"));
          if (!SUPPORTED_FLOWS.includes(flowType)) {
            logger.error(`Unknown flow type: "${flowType}". Supported: ${SUPPORTED_FLOWS.join(", ")}`);
            process.exit(1);
          }

          // Input token
          const inputRaw = opts.from ?? (await ask("Input token", "SOL"));
          const inputResolved = resolveToken(inputRaw);
          let inputMint: string;
          let inputSymbol: string;

          if (inputResolved.found) {
            inputSymbol = inputResolved.token.symbol;
            inputMint = inputResolved.token.mint;
          } else {
            if (interactive) {
              logger.warn(`"${inputRaw}" not in token registry.`);
              inputMint = await askRequired("Enter mint address");
              inputSymbol = inputRaw.toUpperCase();
            } else {
              logger.error(
                `Unknown token: "${inputRaw}". Use --from with a known symbol or provide inputMint in the profile.`,
              );
              printAvailableTokens(logger);
              process.exit(1);
            }
          }

          // Output token
          const outputRaw = opts.to ?? (await ask("Output token", "USDC"));
          const outputResolved = resolveToken(outputRaw);
          let outputMint: string;
          let outputSymbol: string;

          if (outputResolved.found) {
            outputSymbol = outputResolved.token.symbol;
            outputMint = outputResolved.token.mint;
          } else {
            if (interactive) {
              logger.warn(`"${outputRaw}" not in token registry.`);
              outputMint = await askRequired("Enter mint address");
              outputSymbol = outputRaw.toUpperCase();
            } else {
              logger.error(
                `Unknown token: "${outputRaw}". Use --to with a known symbol or provide outputMint in the profile.`,
              );
              printAvailableTokens(logger);
              process.exit(1);
            }
          }

          // Amount, airdrop, slippage
          const amount = parseFloat(opts.amount ?? (await ask("Swap amount", String(SWAP_DEFAULTS.amount))));
          const airdropSol = parseFloat(opts.airdrop ?? (await ask("Airdrop SOL", String(SWAP_DEFAULTS.airdropSol))));
          const slippageBps = parseInt(
            opts.slippage ?? (await ask("Slippage (bps)", String(SWAP_DEFAULTS.slippageBps))),
            10,
          );

          if (Number.isNaN(amount) || amount <= 0) {
            logger.error("Amount must be a positive number");
            process.exit(1);
          }
          if (Number.isNaN(airdropSol) || airdropSol <= 0) {
            logger.error("Airdrop must be a positive number");
            process.exit(1);
          }
          if (Number.isNaN(slippageBps) || slippageBps < 0) {
            logger.error("Slippage must be a non-negative number");
            process.exit(1);
          }

          // DEX adapter
          const dexName = opts.dex ?? DEFAULT_DEX;
          if (!listDexAdapters().includes(dexName)) {
            logger.error(`Unknown DEX adapter: "${dexName}". Available: ${listDexAdapters().join(", ")}`);
            process.exit(1);
          }

          // Profile name
          const defaultName = `${inputSymbol.toLowerCase()}-${outputSymbol.toLowerCase()}-${flowType}`;
          const profileName = opts.name ?? (await ask("Profile name", defaultName));

          // Build profile
          const profile: Profile & { flowConfig: Record<string, unknown> } = {
            name: profileName,
            description: `${inputSymbol} → ${outputSymbol} ${flowType} test`,
            flowConfig: {
              dex: dexName,
              inputToken: inputSymbol,
              outputToken: outputSymbol,
              amount,
              airdropSol,
              slippageBps,
            },
          };

          // Include mint addresses if tokens were manually entered
          if (!resolveToken(inputSymbol).found) {
            profile.flowConfig.inputMint = inputMint;
          }
          if (!resolveToken(outputSymbol).found) {
            profile.flowConfig.outputMint = outputMint;
          }

          // Write file
          const outDir = resolve(process.cwd(), opts.out);
          await mkdir(outDir, { recursive: true });
          const filePath = resolve(outDir, `${profileName}.json`);
          await writeFile(filePath, `${JSON.stringify(profile, null, 2)}\n`, "utf-8");

          console.log();
          logger.success(`Profile created: ${filePath}`);
          logger.info("");
          logger.info(`Run it:`);
          logger.info(`  surfguard run ${flowType} --profile ${opts.out}/${profileName}.json`);
        } finally {
          closePrompt();
        }
      },
    );
}

async function askWithOptions(question: string, options: string[], defaultValue: string): Promise<string> {
  const optionsList = options.join(" / ");
  return await ask(`${question} (${optionsList})`, defaultValue);
}

function printAvailableTokens(logger: Logger): void {
  const tokens = listTokens();
  const symbols = tokens.map((t) => t.symbol).join(", ");
  logger.info(`Available tokens: ${symbols}`);
}
