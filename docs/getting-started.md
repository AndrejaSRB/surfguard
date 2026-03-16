# Getting Started

## Prerequisites

- Node.js 22+
- Surfpool running on `localhost:8899`
- Jupiter API key (free at https://portal.jup.ag)

## Install

```bash
npm install -g surfguard
```

## Setup

```bash
# Install Surfpool
curl -sL https://run.surfpool.run/ | bash

# Start Surfpool
surfpool start
```

## Create Your First Profile

```bash
surfguard init
```

This will prompt for your Jupiter API key (first time only), token pair, amount, and profile name. Generates a ready-to-run profile JSON.

Or non-interactive:

```bash
surfguard init --type swap --from SOL --to USDC --amount 0.1 --name my-first-test
```

## Run It

```bash
# Run your profile
surfguard run swap --profile ./profiles/my-first-test.json

# Run a built-in stress test
surfguard run swap --profile low-balance

# Compare the two
surfguard diff <first-id> <low-balance-id>
```

## What's Next

- Export results: `surfguard export <id> --format json`
- Run in CI: `surfguard ci`
- Generate frontend fixtures: `surfguard fixture <id> --out ./fixtures`

See [Commands](./commands/) and [Profiles](./profiles/overview.md) for full reference.
