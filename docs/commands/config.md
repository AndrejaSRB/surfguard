# surfguard config

Manage Surfguard configuration stored in `~/.surfguard/config.json`.

## Commands

### `surfguard config set <key> <value>`

Set a configuration value.

```bash
surfguard config set jupiter-api-key abc123def456
# ✓ jupiter-api-key saved

surfguard config set rpc-url http://localhost:9000
# ✓ rpc-url saved
```

### `surfguard config get <key>`

Get a configuration value. Sensitive values are redacted.

```bash
surfguard config get jupiter-api-key
# ➜ jupiter-api-key: abc1****f456

surfguard config get rpc-url
# ➜ rpc-url: http://localhost:9000
```

### `surfguard config list`

List all configuration values.

```bash
surfguard config list
#   jupiter-api-key: abc1****f456
#   rpc-url: http://localhost:9000
```

## Available Keys

| Key | Description | Required |
|---|---|---|
| `jupiter-api-key` | Jupiter API key for swap quotes. Get one at https://portal.jup.ag | Yes (for swap flow) |
| `rpc-url` | Surfpool RPC endpoint | No (defaults to `http://localhost:8899`) |

## Resolution Order

Values are resolved in this priority order:

1. CLI flag (e.g., `--rpc-url`)
2. Environment variable (`JUPITER_API_KEY`, `SURFGUARD_RPC_URL`)
3. Config file (`~/.surfguard/config.json`)
4. Default value (where applicable)
