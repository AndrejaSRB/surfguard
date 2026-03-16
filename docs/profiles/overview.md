# Profiles

Profiles define the conditions under which a flow runs. Same flow, different profile, different outcome.

## Built-in Profiles

| Profile | Description | Expected |
|---|---|---|
| `baseline` | Normal conditions — 5 SOL airdrop, default slippage | PASS |
| `oracle-shock` | Pyth SOL/USD oracle override via Surfpool scenario | Depends on route |
| `low-balance` | 0.01 SOL airdrop — can't cover swap + fees | FAIL |

## Profile Structure

```json
{
  "name": "my-profile",
  "description": "What this profile tests",
  "flowConfig": {
    "inputToken": "SOL",
    "outputToken": "USDC",
    "amount": 0.5,
    "airdropSol": 2,
    "slippageBps": 500
  },
  "overrides": [
    {
      "templateId": "pyth-sol-usd",
      "account": "7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE",
      "values": { "priceDropPercent": 50 },
      "label": "SOL/USD crash"
    }
  ]
}
```

## flowConfig

Parameters passed to the flow runner.

| Field | Type | Default | Description |
|---|---|---|---|
| `inputToken` | string | `"SOL"` | Input token symbol (e.g., `SOL`, `USDC`, `BONK`) |
| `outputToken` | string | `"USDC"` | Output token symbol |
| `inputMint` | string | auto-resolved | Override mint address if token not in registry |
| `outputMint` | string | auto-resolved | Override mint address if token not in registry |
| `amount` | number | `0.1` | Swap amount in input token units |
| `airdropSol` | number | `5` | SOL to airdrop to test wallet |
| `slippageBps` | number | `1000` | Slippage tolerance in basis points (1000 = 10%) |

## overrides

Surfpool scenario registrations. Applied after network reset, before the flow executes.

| Field | Type | Description |
|---|---|---|
| `templateId` | string | Surfpool scenario template (e.g., `pyth-sol-usd`) |
| `account` | string | On-chain account to override (pubkey) |
| `values` | object | Template-specific parameters |
| `label` | string | Human-readable label |

## Creating Profiles

The easiest way to create a profile:

```bash
surfguard init
```

This prompts for token pair, amount, and settings, then generates the JSON. See [init command](../commands/init.md) for details.

Or create manually and run:

```bash
surfguard run swap --profile ./profiles/my-custom-test.json
```

> **What's next:** Future versions will support aggregator selection per profile (`jupiter`, `raydium`, `orca`) for cross-DEX comparison.
