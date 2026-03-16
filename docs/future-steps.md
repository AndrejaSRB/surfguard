# Future Steps

## Near-term (MVP+)

### `surfguard init` command
Interactive profile creation. Prompts for flow type, tokens, amount, profile name. Resolves token symbols to mint addresses via built-in registry. Generates a ready-to-run profile JSON.

### Transfer flow
SOL and SPL token transfers between wallets. Simpler than swap — useful for testing basic transaction behavior, fee estimation, and account creation under different conditions.

### Error message translation
Map common Solana/SPL program error codes to human-readable messages:
- `0x1` → "Insufficient funds"
- `0x1771` → "Slippage tolerance exceeded"
- `0x5` → "Token account insufficient balance"

### Fork drift detection
Detect when Surfpool's fork has drifted too far from mainnet (causes slippage errors on fresh transactions). Warn the user and suggest restarting Surfpool.

## Medium-term

### Plugin system for custom flows
Load FlowRunner implementations from external JS/TS files:
```bash
surfguard run --flow ./my-custom-flow.ts --profile ./my-profile.json
```
No source code editing or registry modification required.

### `surfguard watch` mode
Watch a profile file and re-run the flow on change. Useful during development — edit your profile, see results immediately.

### Alternative DEXes
While Jupiter aggregates most DEXes, some teams may want to test direct pool interactions:
- Direct Raydium swap
- Direct Orca whirlpool swap
- Direct Meteora DLMM swap

Each would be a separate flow type with its own SDK integration.

### Documentation site
Next.js-based docs site (Vercel documentation starter kit) with:
- Command reference with expected outputs
- Profile creation guide
- Flow development guide
- Example response payloads
- Video demos

## Long-term

### npm publishing
Publish as `surfguard` on npm so users can run:
```bash
npx surfguard init
npx surfguard run swap --profile ./my-profile.json
```

### CI/CD integration guides
Step-by-step guides for:
- GitHub Actions
- GitLab CI
- Vercel deployment hooks

### DeFi protocol flows

These are the flows where Surfguard becomes essential — oracle manipulation via Surfpool produces real, meaningful PASS→FAIL regressions.

**Lending / Borrowing**

Deposit collateral → borrow against it → verify health factor. Protocols: Marginfi, Kamino, Solend.

```bash
surfguard init --type lending --name borrow-baseline
surfguard run lending --profile ./profiles/borrow-baseline.json
```

```json
{
  "name": "borrow-baseline",
  "description": "Deposit SOL, borrow USDC at safe ratio",
  "flowConfig": {
    "protocol": "marginfi",
    "collateralToken": "SOL",
    "borrowToken": "USDC",
    "depositAmount": 1.0,
    "borrowAmount": 50,
    "airdropSol": 5
  }
}
```

```json
{
  "name": "borrow-oracle-crash",
  "description": "Same borrow, but SOL price drops 40% — health factor drops, borrow should fail",
  "flowConfig": {
    "protocol": "marginfi",
    "collateralToken": "SOL",
    "borrowToken": "USDC",
    "depositAmount": 1.0,
    "borrowAmount": 50,
    "airdropSol": 5
  },
  "overrides": [
    {
      "templateId": "pyth-sol-usd",
      "account": "7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE",
      "values": { "priceDropPercent": 40 },
      "label": "SOL/USD 40% crash"
    }
  ]
}
```

```bash
surfguard diff borrow-baseline-run borrow-oracle-crash-run
# → CRITICAL: PASS → FAIL, health factor below threshold
```

**Liquidation**

Set up an undercollateralized position → trigger liquidation → verify liquidator receives expected amounts. Critical for teams building liquidation bots or lending protocol upgrades.

```json
{
  "name": "liquidation-test",
  "description": "Create position, crash oracle, attempt liquidation",
  "flowConfig": {
    "protocol": "marginfi",
    "collateralToken": "SOL",
    "borrowToken": "USDC",
    "depositAmount": 1.0,
    "borrowAmount": 120,
    "triggerLiquidation": true,
    "airdropSol": 5
  },
  "overrides": [
    {
      "templateId": "pyth-sol-usd",
      "account": "7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE",
      "values": { "priceDropPercent": 50 },
      "label": "SOL/USD 50% crash — makes position liquidatable"
    }
  ]
}
```

**Leveraged positions**

Deposit → borrow → swap → redeposit (loop). Test at different leverage ratios and oracle shock levels.

```json
{
  "name": "leverage-3x-stable",
  "description": "3x leverage loop on SOL — verify position stays healthy",
  "flowConfig": {
    "protocol": "kamino",
    "collateralToken": "SOL",
    "leverageMultiplier": 3,
    "initialDeposit": 1.0,
    "airdropSol": 5
  }
}
```

```json
{
  "name": "leverage-3x-stressed",
  "description": "3x leverage + 20% oracle drop — should approach liquidation threshold",
  "flowConfig": {
    "protocol": "kamino",
    "collateralToken": "SOL",
    "leverageMultiplier": 3,
    "initialDeposit": 1.0,
    "airdropSol": 5
  },
  "overrides": [
    {
      "templateId": "pyth-sol-usd",
      "account": "7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE",
      "values": { "priceDropPercent": 20 },
      "label": "SOL/USD 20% drop"
    }
  ]
}
```

**Yield vault operations**

Deposit → harvest → rebalance → withdraw. Protocols: Kamino, Tulip, Francium.

```json
{
  "name": "vault-harvest",
  "description": "Deposit into USDC vault, trigger harvest, verify yield",
  "flowConfig": {
    "protocol": "kamino",
    "vaultToken": "USDC",
    "depositAmount": 100,
    "triggerHarvest": true,
    "airdropSol": 5
  }
}
```

**Staking**

Stake SOL → verify stake account → unstake. Test across epoch boundaries.

```json
{
  "name": "stake-baseline",
  "description": "Stake 1 SOL, verify stake account creation",
  "flowConfig": {
    "validator": "auto",
    "stakeAmount": 1.0,
    "airdropSol": 5
  }
}
```

Each flow supports the same workflow — `surfguard init`, `surfguard run`, `surfguard diff`, `surfguard ci`. Same CLI, same profiles, same regression detection.

### Rust rewrite
Port to Rust as a PR into Surfpool itself. Makes Surfguard a first-party Surfpool feature — zero extra dependencies, ships with `surfpool` binary.

### Multi-flow profiles
A single profile that runs multiple flows in sequence:
```json
{
  "name": "full-defi-check",
  "steps": [
    { "flow": "swap", "params": { "inputToken": "SOL", "outputToken": "USDC" } },
    { "flow": "transfer", "params": { "token": "USDC", "amount": 5 } },
    { "flow": "swap", "params": { "inputToken": "USDC", "outputToken": "SOL" } }
  ]
}
```
