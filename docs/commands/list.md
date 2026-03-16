# surfguard list

List all saved run artifacts.

## Usage

```bash
surfguard list
```

## Example

```
  ➜   Found 3 run(s):

  run-mmrt0afi-485ec480  PASS  swap/baseline       2026-03-15T13:42:10.635Z
  run-mmrt0ei9-353f69a9  PASS  swap/oracle-shock    2026-03-15T13:42:15.920Z
  run-mmrtg1da-2c7c9332  FAIL  swap/low-balance     2026-03-15T13:54:25.389Z
```

Each line shows: run ID, status, flow/profile, timestamp. Use the run ID with `diff`, `export`, or `fixture`.
