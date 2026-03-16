# surfguard diff

Compare two runs and show regressions.

## Usage

```bash
surfguard diff <runA> <runB>
```

## Options

| Option | Default | Description |
|---|---|---|
| `-f, --format <format>` | `text` | `json` or `text` |

## Example

```bash
surfguard diff run-mmrt0afi-485ec480 run-mmrtg1da-2c7c9332
```

```
========================================
  DIFF: run-mmrt0afi-485ec480 vs run-mmrtg1da-2c7c9332
========================================

  Risk Level: !! CRITICAL !!
  Status:     PASS -> FAIL  ** CHANGED **
  Summary:    4 field(s) changed. Status: PASS → FAIL.

  Changes:
    status:
      before: "PASS"
      after:  "FAIL"
    computeUnits:
      before: 99976
      after:  19550
    success:
      before: true
      after:  false
    errorMessage:
      before: undefined
      after:  "Error processing Instruction 3: custom program error: 0x1"

========================================
```

## Risk Levels

| Level | Meaning |
|---|---|
| NONE | No meaningful changes |
| LOW | Minor changes or improvement (FAIL → PASS) |
| MEDIUM | Several fields changed, status unchanged |
| HIGH | Many fields changed |
| CRITICAL | Status changed from PASS to FAIL |
