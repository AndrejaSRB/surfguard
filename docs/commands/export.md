# surfguard export

Export a run artifact as text or JSON.

## Usage

```bash
surfguard export <runId>
surfguard export <runId> --format json
```

## Options

| Option | Default | Description |
|---|---|---|
| `-f, --format <format>` | `text` | `json` or `text` |

## Text Output

```bash
surfguard export run-mmrtg1da-2c7c9332
```

```
========================================
  [FAIL] swap / low-balance
========================================

  Run ID:    run-mmrtg1da-2c7c9332
  Summary:   Swap failed: Error processing Instruction 3: custom program error: 0x1 (19,550 CU)
  Timestamp: 2026-03-15T13:54:25.389Z
  Duration:  2120ms

  Transaction Profile:
    Compute Units: 19,550
    Success:       false
    Error:         Error processing Instruction 3: custom program error: 0x1
    Log entries:   28

  Metadata:
    inputToken: "SOL"
    outputToken: "USDC"
    swapAmount: 0.1
    quoteOutput: "8.77"
    computeUnits: 19550

========================================
```

## JSON Output

```bash
surfguard export run-mmrtg1da-2c7c9332 --format json
```

```json
{
  "id": "run-mmrtg1da-2c7c9332",
  "result": {
    "flowName": "swap",
    "profile": "low-balance",
    "status": "FAIL",
    "summary": "Swap failed: Error processing Instruction 3: custom program error: 0x1 (19,550 CU)",
    "transactionProfile": {
      "computeUnits": 19550,
      "logMessages": [
        "Program ComputeBudget111111111111111111111111111111 invoke [1]",
        "Program ComputeBudget111111111111111111111111111111 success",
        "..."
      ],
      "errorMessage": "Error processing Instruction 3: custom program error: 0x1",
      "success": false
    },
    "metadata": {
      "inputToken": "SOL",
      "outputToken": "USDC",
      "swapAmount": 0.1,
      "quoteOutput": "8.77",
      "computeUnits": 19550
    },
    "timestamp": "2026-03-15T13:54:25.389Z",
    "durationMs": 2120
  },
  "createdAt": "2026-03-15T13:54:25.391Z"
}
```

The JSON format is designed for CI pipelines, dashboards, and frontend test fixtures.
