# surfguard fixture

Export a run artifact as a test fixture for frontend or CI.

## Usage

```bash
surfguard fixture <runId> --out <directory>
```

## Options

| Option | Default | Description |
|---|---|---|
| `-o, --out <dir>` | `./fixtures` | Output directory |
| `-n, --name <name>` | `<flow>-<profile>` | Output filename (without .json) |

## Example

```bash
surfguard fixture run-mmrtg1da-2c7c9332 --out ./src/fixtures
```

```
  ➜   Fixture saved: /path/to/project/src/fixtures/swap-low-balance.json
  ➜
  ➜   Usage in frontend tests:
  ➜     import fixture from './src/fixtures/swap-low-balance.json';
  ➜     // fixture.result.status === "FAIL"
  ➜     // fixture.result.transactionProfile — CU, logs, errors
```

Use in your tests:

```typescript
import failedSwap from './fixtures/swap-low-balance.json';
import passedSwap from './fixtures/swap-baseline.json';

test('shows error UI on failed swap', () => {
  render(<SwapResult data={failedSwap.result} />);
  expect(screen.getByText(/failed/i)).toBeVisible();
});
```
