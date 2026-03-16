import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { FlowResult } from "../flows/types.js";
import { generateRunId } from "../utils/id.js";
import type { RunArtifact } from "./types.js";

export class RunManager {
  constructor(private dataDir: string) {}

  async save(result: FlowResult): Promise<RunArtifact> {
    await mkdir(this.dataDir, { recursive: true });

    const artifact: RunArtifact = {
      id: generateRunId(),
      result,
      createdAt: new Date().toISOString(),
    };

    const filePath = resolve(this.dataDir, `${artifact.id}.json`);
    await writeFile(filePath, JSON.stringify(artifact, null, 2), "utf-8");
    return artifact;
  }

  async load(runId: string): Promise<RunArtifact> {
    const filePath = resolve(this.dataDir, `${runId}.json`);
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as RunArtifact;
  }

  async list(): Promise<string[]> {
    try {
      const files = await readdir(this.dataDir);
      return files
        .filter((f) => f.endsWith(".json"))
        .map((f) => f.replace(".json", ""))
        .sort();
    } catch {
      return [];
    }
  }
}
