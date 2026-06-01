import path from "node:path";
import type { AuditLogEntry } from "./types.js";
import { readJsonFile, writeJsonFile } from "./files.js";

export async function appendAuditLog(rootDir: string, entry: Omit<AuditLogEntry, "timestamp">): Promise<void> {
  const logPath = path.join(rootDir, "asset-forge", "asset-forge-log.json");
  const log = await readJsonFile<{ entries: AuditLogEntry[] }>(logPath, { entries: [] });
  log.entries.push({ timestamp: new Date().toISOString(), ...entry });
  await writeJsonFile(logPath, log);
}
