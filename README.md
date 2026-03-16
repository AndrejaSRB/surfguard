# Surfguard

DeFi flow regression testing on top of [Surfpool](https://github.com/txtx/surfpool). Test your transactions under different conditions, diff the results, catch regressions before production.

## Install

```bash
npm install -g surfguard
```

**Prerequisites:** Node.js 22+, [Surfpool](https://github.com/txtx/surfpool) (`curl -sL https://run.surfpool.run/ | bash`)

## Quick Start

```bash
# Start Surfpool
surfpool start

# Set your Jupiter API key (one-time)
surfguard config set jupiter-api-key <your-key-from-portal.jup.ag>

# Create a profile
surfguard init

# Run it
surfguard run swap --profile ./profiles/my-profile.json

# Run with a different profile
surfguard run swap --profile low-balance

# Compare two runs
surfguard diff <run-id-1> <run-id-2>
```

## Commands

| Command | Description |
|---|---|
| `surfguard init` | Create a profile interactively or via flags |
| `surfguard run <flow> --profile <name>` | Execute a flow under a profile |
| `surfguard diff <runA> <runB>` | Compare two runs, show regressions |
| `surfguard export <runId>` | Export a run as text or JSON |
| `surfguard list` | List all saved runs |
| `surfguard ci` | Run all profiles, exit non-zero on failure |
| `surfguard fixture <runId>` | Export a run as a frontend test fixture |
| `surfguard config set <key> <value>` | Save configuration (API keys, RPC URL) |

## Built-in Profiles

| Profile | Description | Expected |
|---|---|---|
| `baseline` | Normal conditions — 5 SOL airdrop, default slippage | PASS |
| `oracle-shock` | Pyth SOL/USD oracle override via Surfpool scenario | Varies |
| `low-balance` | 0.01 SOL airdrop — can't cover swap + fees | FAIL |

Create custom profiles with `surfguard init` or write JSON directly:

```json
{
  "name": "my-test",
  "description": "SOL to BONK swap",
  "flowConfig": {
    "inputToken": "SOL",
    "outputToken": "BONK",
    "amount": 0.5,
    "airdropSol": 3,
    "slippageBps": 500
  }
}
```

20 tokens built-in (SOL, USDC, USDT, BONK, JUP, RAY, ORCA, mSOL, jitoSOL, PYTH, WIF, and more). Unknown tokens can be specified by mint address.

## Configuration

```bash
surfguard config set jupiter-api-key <key>    # required for swaps
surfguard config set rpc-url <url>             # default: localhost:8899
```

Also supports env vars: `JUPITER_API_KEY`, `SURFGUARD_RPC_URL`

## Development

```bash
npm install
npm run lint          # Biome
npm test              # Vitest (54 tests)
npm run build         # TypeScript → dist/
```

## Docs

See [`docs/`](./docs/) for full command reference, profile guide, and flow documentation.

## License

MIT
