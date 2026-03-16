import type { Command } from "commander";
import { getConfigValue, isKnownConfigKey, listKnownKeys, readConfig, setConfigValue } from "../config/store.js";
import { Logger } from "../utils/logger.js";

export function registerConfigCommand(program: Command): void {
  const configCmd = program.command("config").description("Manage Surfguard configuration");

  configCmd
    .command("set <key> <value>")
    .description("Set a configuration value")
    .action(async (key: string, value: string) => {
      const logger = new Logger("info");

      if (!isKnownConfigKey(key)) {
        logger.error(`Unknown config key: "${key}"`);
        logger.info(`Known keys: ${listKnownKeys().join(", ")}`);
        process.exit(1);
      }

      await setConfigValue(key, value);
      logger.success(`${key} saved`);
    });

  configCmd
    .command("get <key>")
    .description("Get a configuration value")
    .action(async (key: string) => {
      const logger = new Logger("info");

      if (!isKnownConfigKey(key)) {
        logger.error(`Unknown config key: "${key}"`);
        logger.info(`Known keys: ${listKnownKeys().join(", ")}`);
        process.exit(1);
      }

      const value = await getConfigValue(key);
      if (value === undefined) {
        logger.info(`${key}: (not set)`);
      } else {
        // Redact sensitive values in output
        const display = key === "jupiter-api-key" ? redact(value) : value;
        logger.info(`${key}: ${display}`);
      }
    });

  configCmd
    .command("list")
    .description("List all configuration values")
    .action(async () => {
      const logger = new Logger("info");
      const config = await readConfig();
      const keys = listKnownKeys();

      if (keys.every((k) => config[k as keyof typeof config] === undefined)) {
        logger.info("No configuration values set.");
        logger.info(`Available keys: ${keys.join(", ")}`);
        return;
      }

      for (const key of keys) {
        const value = config[key as keyof typeof config];
        if (value === undefined) {
          console.log(`  ${key}: (not set)`);
        } else {
          const display = key === "jupiter-api-key" ? redact(value) : value;
          console.log(`  ${key}: ${display}`);
        }
      }
    });
}

function redact(value: string): string {
  if (value.length <= 8) return "****";
  return `${value.slice(0, 4)}****${value.slice(-4)}`;
}
