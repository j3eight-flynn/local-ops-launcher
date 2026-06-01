#!/usr/bin/env node
import { readFile, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { resolve } from "node:path";

const enabled = __ACTIVE_BACKGROUND_ENABLED__;
const activeBackgroundDir = resolve(homedir(), "Documents/Active Background");
const outputPath = resolve(activeBackgroundDir, "launcher-projects.shared.json");

if (!enabled) {
  console.log("Active Background export disabled for this generated workspace.");
  process.exit(0);
}

try {
  await stat(activeBackgroundDir);
} catch {
  console.log(`Active Background directory not found: ${activeBackgroundDir}`);
  process.exit(0);
}

const registry = JSON.parse(await readFile(resolve("launcher-projects.json"), "utf8"));
const shared = {
  generatedAt: new Date().toISOString(),
  source: resolve("launcher-projects.json"),
  projects: registry.map((project) => ({
    id: project.launcherId,
    name: project.shortName ?? project.name,
    fullName: project.name,
    color: project.activeBackgroundColor ?? "#58C8FF",
    projectPath: project.projectPath ?? null,
    hostedUrl: project.hostedUrl ?? null,
    localUrl: project.localUrl ?? null,
    healthUrl: project.healthUrl ?? project.localUrl ?? null,
    port: project.localUrl ? Number(new URL(project.localUrl).port || 0) || null : null,
    serviceType: project.serviceType ?? null,
    workspaceSets: project.workspaceSets ?? [],
    healthState: project.hostedUrl && project.preferredLaunch === "hosted" ? "hosted" : "unknown",
    focused: false,
    lastSeen: null
  }))
};

await writeFile(outputPath, JSON.stringify(shared, null, 2) + "\n");
console.log(`Exported ${shared.projects.length} project(s) to ${outputPath}`);
