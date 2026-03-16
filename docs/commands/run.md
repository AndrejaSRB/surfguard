# surfguard run

Execute a flow under a given profile.

## Usage

```bash
surfguard run <flow> --profile <name-or-path>
```

## Options

| Option | Default | Description |
|---|---|---|
| `-p, --profile <name>` | `baseline` | Built-in profile name or path to a custom JSON |
| `--rpc-url <url>` | from config | Surfpool RPC URL |

## Examples

```bash
surfguard run swap --profile baseline
```

```
  ✓   Connected to Surfpool at http://localhost:8899
  ➜   Running flow "swap" with profile "baseline"...

  ➜   Resetting network state...
  ➜   Airdropping 5 SOL to 69YBmPQxY53AqzTvPHoga9dpRDS3FcAUizVTz1sEPgYD
  ✓   Wallet funded
  ➜   Getting Jupiter quote for 0.1 SOL → USDC...
  ✓   Quote received: 8.75 USDC, 0% impact
  ➜   Preparing transaction...
  ➜   Profiling transaction via surfnet...
  ✓   Swap succeeded: 0.1 SOL → 8.75 USDC (99,976 CU)

========================================
  [PASS] swap / baseline
========================================

  Run ID:    run-mmrt0afi-485ec480
  Summary:   Swap succeeded: 0.1 SOL → 8.75 USDC (99,976 CU)
  Timestamp: 2026-03-15T13:42:10.635Z
  Duration:  2231ms

  Transaction Profile:
    Compute Units: 99,976
    Success:       true
    Log entries:   77

  Metadata:
    inputToken: "SOL"
    outputToken: "USDC"
    swapAmount: 0.1
    quoteOutput: "8.75"
    computeUnits: 99976

========================================

  ✓   Run saved: run-mmrt0afi-485ec480
```

```bash
surfguard run swap --profile low-balance
```

```
  ✗   Swap failed: Error processing Instruction 3: custom program error: 0x1 (19,550 CU)

========================================
  [FAIL] swap / low-balance
========================================

  Run ID:    run-mmrtg1da-2c7c9332
  Summary:   Swap failed: Error processing Instruction 3: custom program error: 0x1 (19,550 CU)

  Transaction Profile:
    Compute Units: 19,550
    Success:       false
    Error:         Error processing Instruction 3: custom program error: 0x1
    Log entries:   28

========================================
```

Custom profile:

```bash
surfguard run swap --profile ./my-profiles/bonk-swap.json
```

> **What's next:** Future versions will support additional flow types (`transfer`, `stake`) and alternative DEX aggregators selectable per profile.
