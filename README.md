# Surfguard

DeFi flow regression testing on top of [Surfpool](https://github.com/txtx/surfpool). Test your transactions under different network conditions, diff the results, catch regressions before production.

## Prerequisites

- Node.js 22+
- [Surfpool](https://github.com/txtx/surfpool) installed and running on `localhost:8899`

### Installing Surfpool

```bash
curl -sL https://run.surfpool.run/ | bash
surfpool --version
```

## Setup

```bash
git clone <repo-url> surfguard
cd surfguard
npm install
```

## Quick Start

Start Surfpool in one terminal:

```bash
surfpool start
```

In another terminal, run your first flow:

```bash
# 1. Run a swap under normal conditions
npx tsx src/index.ts run swap --profile baseline

# 2. Run the same swap with a 50% oracle price crash
npx tsx src/index.ts run swap --profile oracle-shock

# 3. Compare the two runs (use the run IDs from steps 1 & 2)
npx tsx src/index.ts diff <run-id-1> <run-id-2>

# 4. Export a run for analysis
npx tsx src/index.ts export <run-id> --format json

# 5. Run all flows × all profiles in CI mode
npx tsx src/index.ts ci

# 6. Export a run as a frontend test fixture
npx tsx src/index.ts fixture <run-id> --out ./src/fixtures
```

## CLI Reference

### `surfguard run <flow> [options]`

Execute a flow against Surfpool under a given profile.

| Option | Default | Description |
|---|---|---|
| `-p, --profile <name>` | `baseline` | Profile to apply |
| `--rpc-url <url>` | `http://localhost:8899` | Surfpool RPC URL |

```bash
npx tsx src/index.ts run swap --profile baseline
npx tsx src/index.ts run swap --profile oracle-shock
npx tsx src/index.ts run swap --profile oracle-shock --rpc-url http://localhost:9000
```

### `surfguard list`

List all saved run artifacts.

```bash
npx tsx src/index.ts list
```

### `surfguard diff <runA> <runB> [options]`

Compare two runs and show regressions with risk assessment.

| Option | Default | Description |
|---|---|---|
| `-f, --format <format>` | `text` | Output format: `json` or `text` |

```bash
npx tsx src/index.ts diff run-abc123 run-def456
npx tsx src/index.ts diff run-abc123 run-def456 --format json
```

Risk levels: `NONE` → `LOW` → `MEDIUM` → `HIGH` → `CRITICAL`

### `surfguard export <runId> [options]`

Export a run artifact.

| Option | Default | Description |
|---|---|---|
| `-f, --format <format>` | `text` | Output format: `json` or `text` |

```bash
npx tsx src/index.ts export run-abc123
npx tsx src/index.ts export run-abc123 --format json
```

### `surfguard ci [options]`

Run all flows against all profiles, print a summary table, exit non-zero on failure or regression.

| Option | Default | Description |
|---|---|---|
| `--rpc-url <url>` | `http://localhost:8899` | Surfpool RPC URL |
| `--baseline <runId>` | none | Run ID to compare against for regression detection |
| `--flows <flows>` | all | Comma-separated list of flows to run |
| `--profiles <profiles>` | all built-in | Comma-separated list of profiles to run |

```bash
npx tsx src/index.ts ci
npx tsx src/index.ts ci --baseline run-abc123
npx tsx src/index.ts ci --flows swap --profiles baseline,oracle-shock
```

### `surfguard fixture <runId> [options]`

Copy a run artifact to a directory as a test fixture for frontend or CI.

| Option | Default | Description |
|---|---|---|
| `-o, --out <dir>` | `./fixtures` | Output directory |
| `-n, --name <name>` | `<flow>-<profile>` | Output filename (without .json) |

```bash
npx tsx src/index.ts fixture run-abc123 --out ./src/fixtures
npx tsx src/index.ts fixture run-abc123 --name failed-swap
```

Usage in frontend tests:
```typescript
import fixture from './fixtures/swap-oracle-shock.json';
// fixture.result.status === "FAIL"
// fixture.result.transactionProfile — CU, logs, errors
```

## Profiles

Profiles define the network conditions for a run. Built-in profiles:

| Profile | Description |
|---|---|
| `baseline` | No overrides — run under normal mainnet-fork conditions |
| `oracle-shock` | Manipulate the Pyth SOL/USD oracle to simulate a 50% price drop before the swap |

Profiles are JSON files in `src/profiles/built-in/`. You can also pass a file path as the profile name:

```bash
npx tsx src/index.ts run swap --profile ./my-custom-profile.json
```

Custom profile format:

```json
{
  "name": "my-profile",
  "description": "What this profile simulates",
  "overrides": [
    {
      "template": "pyth-sol-usd",
      "params": { "priceDropPercent": 30 }
    }
  ]
}
```

## Flows

Flows define what transaction to execute and profile. Built-in flows:

| Flow | Description |
|---|---|
| `swap` | SOL → USDC swap via Jupiter, profiled through Surfpool |

The swap flow:
1. Resets Surfpool state and pauses the clock
2. Applies profile scenario overrides (e.g., oracle manipulation)
3. Airdrops 1 SOL to a fresh test wallet
4. Gets a Jupiter quote for 0.1 SOL → USDC
5. Profiles the swap transaction via `surfnet_profileTransaction`
6. Records the result (CU usage, logs, success/fail, metadata)

## Run Artifacts

Runs are saved as JSON files in `data/runs/`. Each artifact contains:

- Run ID, timestamp
- Flow result (status, summary, duration)
- Transaction profile (compute units, logs, success, errors)
- Metadata (wallet, quote amounts, scenarios applied)

## Configuration

| Env Variable | Default | Description |
|---|---|---|
| `SURFGUARD_RPC_URL` | `http://localhost:8899` | Surfpool RPC endpoint |
| `JUPITER_API_KEY` | *(required)* | Jupiter API key — get a free one at https://portal.jup.ag |

You can also pass `--rpc-url` to the `run` command, which takes precedence.

## Tests

```bash
# Unit tests (no Surfpool needed, all mocked)
npm test

# Watch mode
npm run test:watch

# Integration tests (requires running Surfpool)
npm run test:integration
```

## Build

```bash
npm run build
```

Compiles TypeScript to `dist/`. After building, you can run via:

```bash
node dist/index.js run swap --profile baseline
```

## Project Structure

```
src/
├── index.ts              # CLI entry point
├── config.ts             # Global config (RPC URL, data dir)
├── commands/             # CLI command handlers
│   ├── run.ts            # surfguard run
│   ├── diff.ts           # surfguard diff
│   ├── export.ts         # surfguard export
│   ├── list.ts           # surfguard list
│   ├── ci.ts             # surfguard ci
│   └── fixture.ts        # surfguard fixture
├── surfnet/              # Surfpool JSON-RPC client
│   ├── client.ts         # Transport layer
│   ├── cheatcodes.ts     # Typed surfnet_* method wrappers
│   ├── scenarios.ts      # Profile → scenario translation
│   └── types.ts          # Type definitions
├── flows/                # Pluggable flow runners
│   ├── types.ts          # FlowRunner interface, FlowContext
│   ├── registry.ts       # Flow name → runner mapping
│   └── swap/             # Jupiter swap flow
├── profiles/             # Test condition profiles
│   ├── types.ts          # Profile schema
│   ├── loader.ts         # Load/validate profiles
│   └── built-in/         # baseline.json, oracle-shock.json
├── runs/                 # Run artifact management
│   ├── types.ts          # RunArtifact, RunDiff types
│   ├── manager.ts        # Save/load/list
│   ├── differ.ts         # Compare runs, assess risk
│   └── exporter.ts       # JSON + text formatting
└── utils/
    ├── rpc.ts            # Generic JSON-RPC 2.0 caller
    ├── id.ts             # Run ID generation
    └── logger.ts         # Structured console output
```

## Adding a New Flow

1. Create a directory under `src/flows/` (e.g., `src/flows/liquidate/`)
2. Implement the `FlowRunner` interface:

```typescript
import type { FlowRunner, FlowContext, FlowResult } from "../types.js";

export class LiquidateFlow implements FlowRunner {
  name = "liquidate";
  description = "Test a lending protocol liquidation";

  async execute(ctx: FlowContext): Promise<FlowResult> {
    // Use ctx.cheatcodes for surfnet_* calls
    // Use ctx.profile for condition overrides
    // Return a FlowResult with status, summary, metadata
  }
}
```

3. Register it in `src/flows/registry.ts`:

```typescript
import { LiquidateFlow } from "./liquidate/index.js";
registerFlow(new LiquidateFlow());
```

4. It's now available as `surfguard run liquidate --profile <profile>`

## License

MIT
