/**
 * Translates Solana/SPL/Jupiter program error codes into human-readable messages.
 * Keys are hex codes as they appear in error strings (e.g., "0x1", "0x1771").
 */

const HEX_ERROR_MAP = new Map<string, string>([
  // SPL Token Program
  ["0x0", "Not rent exempt"],
  ["0x1", "Insufficient funds"],
  ["0x2", "Invalid mint"],
  ["0x3", "Account not associated with mint"],
  ["0x4", "Owner mismatch"],
  ["0x5", "Token account insufficient balance"],
  ["0x6", "Invalid number of signers"],
  ["0x7", "Invalid number of required signers"],
  ["0x8", "Account already in use"],
  ["0x9", "Invalid account state"],
  ["0xa", "Account is frozen"],
  ["0xd", "Account not initialized"],

  // Jupiter / Anchor (6000+ range)
  ["0x1770", "Invalid program input"],
  ["0x1771", "Slippage tolerance exceeded"],
  ["0x1772", "Invalid token pair"],
  ["0x1774", "Amount too small"],
]);

const STRING_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  { pattern: /Blockhash not found/i, message: "Blockhash expired (handled automatically by Surfguard)" },
  { pattern: /insufficient funds for fee/i, message: "Not enough SOL for transaction fee" },
  { pattern: /Transaction too large/i, message: "Transaction exceeds size limit" },
  { pattern: /Invalid account owner/i, message: "Invalid account owner — restart Surfpool for a fresh fork" },
];

const INSTRUCTION_HEX_REGEX = /Error processing Instruction (\d+): custom program error: (0x[0-9a-fA-F]+)/;
const INSTRUCTION_TEXT_REGEX = /Error processing Instruction (\d+): (.+)/;

export interface TranslatedError {
  original: string;
  translated: string;
  instructionIndex?: number;
  hexCode?: string;
  humanMessage?: string;
}

export function translateError(errorMessage: string): TranslatedError {
  // Try hex code extraction first
  const hexMatch = errorMessage.match(INSTRUCTION_HEX_REGEX);
  if (hexMatch) {
    const instructionIndex = parseInt(hexMatch[1], 10);
    const hexCode = hexMatch[2].toLowerCase();
    const humanMessage = HEX_ERROR_MAP.get(hexCode);

    if (humanMessage) {
      return {
        original: errorMessage,
        translated: `${humanMessage} (${hexCode}) at Instruction ${instructionIndex}`,
        instructionIndex,
        hexCode,
        humanMessage,
      };
    }

    return {
      original: errorMessage,
      translated: `Unknown error (${hexCode}) at Instruction ${instructionIndex}`,
      instructionIndex,
      hexCode,
    };
  }

  // Try string pattern matches (before instruction text extraction)
  for (const { pattern, message } of STRING_PATTERNS) {
    if (pattern.test(errorMessage)) {
      return {
        original: errorMessage,
        translated: message,
        humanMessage: message,
      };
    }
  }

  // Try instruction text extraction (e.g., "Error processing Instruction 6: Invalid account owner")
  const textMatch = errorMessage.match(INSTRUCTION_TEXT_REGEX);
  if (textMatch) {
    const instructionIndex = parseInt(textMatch[1], 10);
    const errorText = textMatch[2];

    // Check if the error text matches any string pattern
    for (const { pattern, message } of STRING_PATTERNS) {
      if (pattern.test(errorText)) {
        return {
          original: errorMessage,
          translated: `${message} at Instruction ${instructionIndex}`,
          instructionIndex,
          humanMessage: message,
        };
      }
    }

    return {
      original: errorMessage,
      translated: `${errorText} at Instruction ${instructionIndex}`,
      instructionIndex,
    };
  }

  // No translation found — return as-is
  return {
    original: errorMessage,
    translated: errorMessage,
  };
}

export function getKnownErrorCodes(): Map<string, string> {
  return new Map(HEX_ERROR_MAP);
}
