import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";

let rl: ReturnType<typeof createInterface> | null = null;

function getReadline(): ReturnType<typeof createInterface> {
  if (!rl) {
    rl = createInterface({ input: stdin, output: stdout });
  }
  return rl;
}

export async function ask(question: string, defaultValue?: string): Promise<string> {
  const suffix = defaultValue ? ` (${defaultValue})` : "";
  const answer = await getReadline().question(`  ? ${question}${suffix}: `);
  const trimmed = answer.trim();
  if (!trimmed && defaultValue !== undefined) return defaultValue;
  return trimmed;
}

export async function askRequired(question: string): Promise<string> {
  let answer = "";
  while (!answer) {
    answer = await ask(question);
    if (!answer) {
      console.log("    Value is required.");
    }
  }
  return answer;
}

export function closePrompt(): void {
  if (rl) {
    rl.close();
    rl = null;
  }
}
