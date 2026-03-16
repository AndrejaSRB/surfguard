# Surfguard

**DeFi regression testing, powered by Surfpool.**

> Run your DeFi flows under different conditions. Diff the results. Catch regressions before production.

---

## The Problem

DeFi protocols live in volatile, stateful environments. Oracle prices shift, liquidity changes, slippage conditions vary. But the testing options today don't reflect that reality:

- **Unit tests** mock everything away — fast, but they miss real-world failures
- **Devnet/testnet** doesn't have mainnet state — no real liquidity, no real oracles
- **Mainnet** is where teams actually discover regressions — a swap fails because the oracle moved, a liquidation breaks under extreme prices, a fee calculation silently changes

Teams are flying blind between "it works in tests" and "it broke in production."

---

## The Surfpool Opportunity

Surfpool solves the hardest part: it lazily forks mainnet state into a local simulator. Real Jupiter pools, real AMM programs, real Pyth oracles — all available locally. On top of that, it exposes powerful `surfnet_*` cheatcodes: clock control, state reset, oracle manipulation, transaction profiling.

**What's missing is a developer workflow on top of these primitives.** Surfpool gives you the engine. Nobody's built the dashboard yet.

---

## What Surfguard Does

Surfguard wraps Surfpool's primitives into an opinionated, repeatable testing workflow:

**Run** a DeFi transaction flow (e.g., a Jupiter swap) under a named condition profile (e.g., "baseline", "low-balance", or "oracle-shock"). Every run resets state, applies the conditions, executes the flow, profiles the transaction via `surfnet_profileTransaction`, and saves the result as a versioned artifact.

**Diff** any two runs to see exactly what changed — status, compute units, error messages — with an automatic risk assessment (NONE through CRITICAL). Noise fields like wallet addresses and timing are excluded.

**Export** run artifacts as JSON or text for CI pipelines, dashboards, or audit reports.

**CI mode** runs all flows against all profiles in one shot, prints a summary table, and exits non-zero on any failure or regression — ready to plug into GitHub Actions.

**Fixture export** copies run artifacts into your project's test fixture directory, giving frontend and integration tests real transaction data to work with.

| Surfpool Primitive | What Surfguard Builds On Top |
|---|---|
| `surfnet_profileTransaction` | Profile full DeFi flows — returns CU breakdown, logs, success/fail |
| `surfnet_registerScenario` | Named condition profiles (baseline, oracle-shock, etc.) |
| `surfnet_resetNetwork` + clock control | Deterministic, comparable runs |
| `surfnet_setAccount` | Manipulate on-chain state for stress testing |
| Raw JSON-RPC | Structured CLI with `run`, `diff`, `export`, `list`, `ci`, `fixture` |

---

## Demo

**1. Baseline** — run a SOL → USDC swap under normal conditions
```
surfguard run swap --profile baseline
→ PASS | ~100k CU | ~$8.75 USDC output | 77 log entries
```

**2. Low balance** — same swap, but the wallet only has 0.01 SOL (can't cover swap + fees)
```
surfguard run swap --profile low-balance
→ FAIL | ~20k CU | insufficient funds error | fails at instruction 3
```

**3. Diff** — see the regression
```
surfguard diff <baseline-run> <low-balance-run>
→ Risk: CRITICAL | Status: PASS → FAIL | CU dropped from 100k to 20k
```

**4. Export** — pull the artifact for analysis
```
surfguard export <low-balance-run> --format json
→ Full transaction profile with CU, logs, error message, metadata
```

**5. CI** — run everything, get a pass/fail summary
```
surfguard ci
→ Summary table: baseline PASS, oracle-shock PASS, low-balance FAIL | CI RESULT: FAIL
```

**6. Fixture** — export a run as a frontend test fixture
```
surfguard fixture <low-balance-run> --out ./fixtures
→ Saves swap-low-balance.json, ready to import in component tests
```

One workflow. Multiple conditions. Regressions caught before they ever hit production.

---

## Built-in Profiles

| Profile | What it does | Expected outcome |
|---|---|---|
| `baseline` | Normal conditions — full airdrop, default slippage tolerance | PASS |
| `oracle-shock` | Registers a Pyth SOL/USD oracle override via `surfnet_registerScenario` | Depends on swap route |
| `low-balance` | Airdrops only 0.01 SOL — wallet can't cover swap + fees | FAIL (always) |

Profiles are JSON files. Custom profiles can override flow parameters (`slippageBps`, `airdropSol`) and register Surfpool scenarios.

---

## How It Works on Top of Surfpool

```
   Surfguard                          Surfpool (local mainnet fork)
   ─────────                          ─────────────────────────────
   1. Reset network        ────────▶  Wipes to clean fork state
   2. Apply profile        ────────▶  Registers scenarios, sets account overrides
   3. Airdrop test wallet  ────────▶  Funds a fresh keypair
   4. Get Jupiter quote    ────────▶  Fetches real mainnet pricing
   5. Replace blockhash    ────────▶  Uses Surfpool's local blockhash
   6. Sign + profile tx    ────────▶  surfnet_profileTransaction returns CU, logs, success/fail
   7. Save artifact        ◀────────  Versioned JSON with full transaction profile
```

The key insight: because Surfpool forks real mainnet state, **Jupiter routes and AMM pools behave exactly as they would in production**. The transaction is quoted against mainnet prices, then profiled against the local fork — any state divergence (manipulated oracles, insufficient funds, corrupted accounts) produces the same errors a user would see on mainnet.

---

## Who This Is For

| Audience | Use Case |
|---|---|
| **DeFi protocol teams** | Regression-test swaps, liquidations, and yield strategies under different conditions before deploying |
| **Security auditors** | Reproduce and verify edge-case scenarios in a controlled, repeatable environment |
| **Infrastructure teams** | Validate that program upgrades don't change transaction behavior under stress |

---

## Frontend Developers: Why This Matters for You Too

Surfguard isn't just for Solana program developers. **Frontend teams building DeFi interfaces have an equally painful testing gap** — and Surfguard directly addresses it.

### The frontend DeFi testing problem

You're building a swap UI, a lending dashboard, a vault deposit page. You need to handle error states, edge cases, and degraded conditions. But you can't reliably reproduce them:

- **Mocking responses** means guessing what real failures look like — your error toast might not match what Jupiter actually returns when a swap fails
- **Devnet** has no real liquidity, so your UI never sees realistic amounts, CU profiles, or error messages
- **Mainnet** is too risky for testing edge cases

### How Surfguard helps

**Realistic test fixtures on demand.** Run `low-balance`, then export the result as a fixture:
```
surfguard fixture <run-id> --out ./src/fixtures
```
Now your React/Vue/Svelte component tests can import real transaction failure data — including the actual error message, log entries, and CU profile.

**Stable local backend for UI development.** Point your frontend at Surfpool on localhost instead of devnet. Real Jupiter quotes, real token balances, real program behavior — and you can trigger failures on demand by switching profiles.

**CI for the full stack.** Add `surfguard ci` to your GitHub Actions. If a swap flow starts failing, the build breaks before the code ships — not after users hit it.

**Condition profiles as design specs.** "Does the UI handle `low-balance` gracefully?" becomes a concrete, testable question shared between frontend and protocol teams.

### Where this goes for frontend

- Pre-built fixture packs from Surfguard runs — frontend devs don't even need Surfpool running, just import the JSON
- A `surfguard watch` mode that cycles through conditions while you're building the UI
- Integration with Playwright/Cypress for end-to-end DeFi UI testing against real transaction outcomes

---

## DeFi Compatibility

Surfguard works with any protocol on Solana mainnet, because Surfpool lazily forks all mainnet state:

- **DEX aggregators** (Jupiter) — real swap routes, AMM pools, and liquidity
- **Oracles** (Pyth, Switchboard) — price accounts can be manipulated via scenarios
- **Lending protocols** (Marginfi, Kamino, Solend) — test liquidation paths under different collateral ratios
- **Yield vaults** — verify harvest/rebalance under changing oracle prices
- **Any Solana program** — if it exists on mainnet, it exists in the fork

New flows are pluggable. Implement a runner, register it, and it's available as `surfguard run <your-flow>`.

---

## Current State

This is a **working TypeScript proof of concept** validated end-to-end against a live Surfpool instance:

- Full CLI with 6 commands: `run`, `diff`, `export`, `list`, `ci`, `fixture`
- Typed surfnet client wrapping `surfnet_*` cheatcodes (reset, profile, scenarios, clock, accounts)
- Jupiter swap flow with real mainnet quotes profiled through Surfpool
- 3 built-in profiles: baseline (PASS), oracle-shock (scenario-driven), low-balance (guaranteed FAIL)
- Run artifact management with field-level diffing and risk assessment
- 40 unit tests, all passing
- Integration test suite ready for automated validation

---

## Roadmap

| Phase | What | Why |
|---|---|---|
| **Done** | End-to-end validation against live Surfpool | Baseline PASS, low-balance FAIL, diff shows CRITICAL, CI catches it |
| **Next** | More flows (lending, liquidation, yield) and more profiles (congestion, stale oracle, liquidity drain) | Cover the scenarios DeFi teams actually worry about |
| **Then** | CI integration + frontend fixture pipeline | Make this part of every DeFi team's build process |
| **Goal** | Rust rewrite as a PR into Surfpool | Make this a first-party Surfpool feature, zero extra dependencies |

---

## The Bigger Picture

> **Surfpool gives you the simulation engine. Surfguard gives you the testing workflow.**

Today, DeFi developers — both protocol and frontend — choose between fast-but-fake (mocked tests) and real-but-risky (mainnet). Surfguard proposes a third path: **automated, repeatable, condition-aware integration tests against a real mainnet fork with controllable chaos.**

This isn't just a backend tool. The exported artifacts, CI integration, and fixture pipeline make it valuable across the entire DeFi development stack — from Rust programs to React frontends.

The TypeScript implementation proves the concept. If this pattern lands well, the natural home for it is inside Surfpool itself — as a Rust-native CLI that ships with `surfpool`, giving every Solana DeFi team regression testing out of the box.
