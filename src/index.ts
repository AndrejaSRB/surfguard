#!/usr/bin/env node

import { Command } from "commander";
import { registerCiCommand } from "./commands/ci.js";
import { registerConfigCommand } from "./commands/config.js";
import { registerDiffCommand } from "./commands/diff.js";
import { registerExportCommand } from "./commands/export.js";
import { registerFixtureCommand } from "./commands/fixture.js";
import { registerInitCommand } from "./commands/init.js";
import { registerListCommand } from "./commands/list.js";
import { registerRunCommand } from "./commands/run.js";

const program = new Command();

program
  .name("surfguard")
  .version("0.1.0")
  .description(
    "Test your DeFi flows under different conditions, diff the results, catch regressions before production.",
  );

registerRunCommand(program);
registerDiffCommand(program);
registerExportCommand(program);
registerListCommand(program);
registerCiCommand(program);
registerFixtureCommand(program);
registerConfigCommand(program);
registerInitCommand(program);

program.parse();
