export type LogLevel = "debug" | "info" | "success" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  success: 1,
  warn: 2,
  error: 3,
};

// ANSI color codes
const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";

const LEVEL_STYLE: Record<LogLevel, { prefix: string; color: string }> = {
  debug: { prefix: "DEBUG", color: DIM },
  info: { prefix: "  ➜  ", color: CYAN },
  success: { prefix: "  ✓  ", color: GREEN },
  warn: { prefix: " ⚠️  ", color: YELLOW },
  error: { prefix: "  ✗  ", color: RED },
};

export class Logger {
  constructor(private minLevel: LogLevel = "info") {}

  debug(msg: string, ...args: unknown[]): void {
    this.log("debug", msg, ...args);
  }

  info(msg: string, ...args: unknown[]): void {
    this.log("info", msg, ...args);
  }

  success(msg: string, ...args: unknown[]): void {
    this.log("success", msg, ...args);
  }

  warn(msg: string, ...args: unknown[]): void {
    this.log("warn", msg, ...args);
  }

  error(msg: string, ...args: unknown[]): void {
    this.log("error", msg, ...args);
  }

  private log(level: LogLevel, msg: string, ...args: unknown[]): void {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[this.minLevel]) return;
    const style = LEVEL_STYLE[level];
    const out = level === "error" ? console.error : console.log;
    out(`${style.color}${style.prefix}${RESET} ${msg}`, ...args);
  }

  // For bold highlighted output (headers, results)
  header(msg: string): void {
    console.log(`${BOLD}${msg}${RESET}`);
  }
}
