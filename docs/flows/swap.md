# Swap Flow

SOL/token swap via Jupiter, profiled through Surfpool.

## What It Does

1. Resets Surfpool network state
2. Applies profile scenarios (oracle overrides, account manipulation)
3. Airdrops SOL to a fresh test wallet
4. Gets a Jupiter quote (mainnet pricing)
5. Replaces blockhash with Surfpool's local one
6. Signs and profiles the transaction via `surfnet_profileTransaction`
7. Returns: status, compute units, logs, error message

## Supported Token Pairs

Any token pair Jupiter supports. Specify in profile:

```json
{
  "flowConfig": {
    "inputToken": "SOL",
    "outputToken": "USDC"
  }
}
```

Built-in token registry includes: SOL, USDC, USDT, BONK, JUP, RAY, ORCA, mSOL, jitoSOL, PYTH, WIF, RENDER, HNT, TENSOR, W, bSOL, INF, MOBILE, SAMO, MNDE.

For tokens not in the registry, use `inputMint` / `outputMint` with the on-chain address.

## Common Errors

| Error | Meaning |
|---|---|
| `custom program error: 0x1` | Insufficient funds — increase `airdropSol` |
| `custom program error: 0x1771` | Slippage exceeded — restart Surfpool for fresh fork or increase `slippageBps` |
| `custom program error: 0x5` | Token account insufficient balance — increase `airdropSol` |
| `Blockhash not found` | Surfpool blockhash issue — this is handled automatically |

> **What's next:** Future versions will support alternative aggregators (`raydium`, `orca`, `meteora`) selectable per profile, enabling cross-DEX comparison with `surfguard diff`.
