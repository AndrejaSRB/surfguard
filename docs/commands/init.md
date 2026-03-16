# surfguard init

Create a new profile interactively or via flags.

## Usage

```bash
# Interactive
surfguard init

# Non-interactive
surfguard init --type swap --from SOL --to USDC --amount 0.1 --name my-test
```

## Options

| Option | Description |
|---|---|
| `--type <flow>` | Flow type (`swap`) |
| `--from <token>` | Input token symbol |
| `--to <token>` | Output token symbol |
| `--amount <n>` | Swap amount (default: 0.1) |
| `--airdrop <n>` | Airdrop SOL (default: 5) |
| `--slippage <bps>` | Slippage in basis points (default: 1000) |
| `--name <name>` | Profile name |
| `--out <dir>` | Output directory (default: `./profiles`) |

## Interactive Example

```
surfguard init

  Surfguard Profile Setup

  ? Flow type (swap): swap
  ? Input token (SOL): SOL
  ? Output token (USDC): BONK
  ? Swap amount (0.1): 0.5
  ? Airdrop SOL (5): 3
  ? Slippage (bps) (1000): 500
  ? Profile name (sol-bonk-swap): sol-bonk-test

  ✓   Profile created: profiles/sol-bonk-test.json
  ➜   Run it:
  ➜     surfguard run swap --profile ./profiles/sol-bonk-test.json
```

## Generated Profile

```json
{
  "name": "sol-bonk-test",
  "description": "SOL → BONK swap test",
  "flowConfig": {
    "inputToken": "SOL",
    "outputToken": "BONK",
    "amount": 0.5,
    "airdropSol": 3,
    "slippageBps": 500
  }
}
```

## Unknown Tokens

If a token isn't in the registry, interactive mode asks for the mint address:

```
  ? Output token: MYTOKEN
  ⚠️  "MYTOKEN" not in token registry.
  ? Enter mint address: 7xKX...abc

  ✓   Profile created: profiles/sol-mytoken-swap.json
```

Non-interactive mode shows the available tokens and exits:

```
  ✗   Unknown token: "MYTOKEN"
  ➜   Available tokens: SOL, USDC, USDT, BONK, JUP, RAY, ORCA, ...
```

## First-Run Setup

If no Jupiter API key is found, interactive mode prompts for it and saves to config:

```
  ⚠️  Jupiter API key not found.
  ? Enter your Jupiter API key (from https://portal.jup.ag): abc123
  ✓   Jupiter API key saved to config
```
