/** Default values for the swap flow. Shared between the flow runner and the init command. */

export const SWAP_DEFAULTS = {
  inputToken: "SOL",
  outputToken: "USDC",
  amount: 0.1,
  airdropSol: 5,
  slippageBps: 1000,
} as const;
