# surfguard ci

Run all flows against all profiles, report regressions, exit non-zero on failure.

## Usage

```bash
surfguard ci
```

## Options

| Option | Default | Description |
|---|---|---|
| `--rpc-url <url>` | from config | Surfpool RPC URL |
| `--baseline <runId>` | none | Compare results against this run for regression detection |
| `--flows <flows>` | all | Comma-separated list of flows |
| `--profiles <profiles>` | all built-in | Comma-separated list of profiles |

## Example

```bash
surfguard ci
```

```
========================================
  SURFGUARD CI
========================================

  Results:
  ────────────────────────────────────────────────────────
  Flow        Profile          Status  Regression  Run ID
  ────────────────────────────────────────────────────────
  swap        baseline         PASS       no       run-mmrt0afi-485ec480
  swap        oracle-shock     PASS       no       run-mmrt0ei9-353f69a9
  swap        low-balance      FAIL       no       run-mmrtg1da-2c7c9332
  ────────────────────────────────────────────────────────

  Total: 3 | Passed: 2 | Failed: 1 | Regressions: 0

  CI RESULT: FAIL
========================================
```

Exit code is `1` if any run fails or a regression is detected. Use in GitHub Actions:

```yaml
- name: DeFi regression check
  run: surfguard ci
```

## Filtering

```bash
surfguard ci --flows swap --profiles baseline,low-balance
```

> **What's next:** Future versions will support parallel profile execution and automatic baseline comparison against the previous CI run.
