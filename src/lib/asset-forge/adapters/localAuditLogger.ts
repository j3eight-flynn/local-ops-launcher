import { randomUUID } from "node:crypto";
import path from "node:path";
import type { AuditLogEntry, AuditLogger } from "../types.js";
import { readJsonFile, writeJsonFile } from "../files.js";

export class LocalAuditLogger implements AuditLogger {
  constructor(private readonly rootDir: string) {}

  async log(entry: Omit<AuditLogEntry, "timestamp">): Promise<void> {
    const logPath = path.join(this.rootDir, "asset-forge", "asset-forge-log.json");
    const log = await readJsonFile<{ entries: AuditLogEntry[] }>(logPath, { entries: [] });
    log.entries.push({
      id: entry.id ?? `audit_${randomUUID()}`,
      timestamp: new Date().toISOString(),
      ...entry,
    });
    await writeJsonFile(logPath, log);
  }
}
