#!/usr/bin/env node
import { chmod, cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const pluginRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const templateRoot = resolve(pluginRoot, "assets/templates/swift-menu-bar");
const args = process.argv.slice(2);
let registryPath = ".local-ops/launcher-projects.draft.json";
let outputPath = "";
let appName = "Local Ops Launcher";
let activeBackground = false;

for (let index = 0; index < args.length; index += 1) {
  if (args[index] === "--registry") registryPath = args[++index];
  else if (args[index] === "--output") outputPath = args[++index];
  else if (args[index] === "--app-name") appName = args[++index];
  else if (args[index] === "--active-background") activeBackground = true;
}

if (!outputPath) {
  console.error("Usage: generate-launcher-workspace.mjs --registry <registry.json> --output <workspace>");
  process.exit(64);
}

function expand(path) {
  return path?.replace(/^~/, homedir());
}

const output = resolve(expand(outputPath));
const registry = JSON.parse(await readFile(resolve(expand(registryPath)), "utf8"));
await mkdir(output, { recursive: true });
await cp(templateRoot, output, { recursive: true });

const replacements = {
  "__APP_NAME__": appName,
  "__BUNDLE_IDENTIFIER__": `local.codex.${appName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
  "__GENERATED_AT__": new Date().toISOString(),
  "__ACTIVE_BACKGROUND_ENABLED__": activeBackground ? "true" : "false"
};

async function replaceFile(path) {
  let text = await readFile(path, "utf8");
  for (const [key, value] of Object.entries(replacements)) text = text.replaceAll(key, value);
  await writeFile(path, text);
}

for (const file of [
  "README.md",
  "Package.swift",
  "Sources/ProjectLauncher/main.swift",
  "scripts/build-app-bundle.sh",
  "scripts/test-launcher-registry.sh",
  "scripts/release-check.sh",
  "scripts/export-active-background-registry.mjs",
  "docs/OPERATOR_GUIDE.md",
  "launcher-registry-meta.json"
]) {
  await replaceFile(resolve(output, file));
}

await writeFile(resolve(output, "launcher-projects.json"), JSON.stringify(registry, null, 2) + "\n");
await writeFile(resolve(output, "launcher-workspace-sets.json"), JSON.stringify([
  {
    name: "Daily",
    projectIds: registry.map((project) => project.launcherId).filter(Boolean),
    launchMode: "localDev",
    openOrder: registry.map((project) => project.launcherId).filter(Boolean),
    startLocalServices: true
  }
], null, 2) + "\n");

if (!activeBackground) {
  await writeFile(resolve(output, "ACTIVE_BACKGROUND_DISABLED.txt"), "Active Background export was not enabled for this generated workspace.\n");
}

for (const script of ["scripts/build-app-bundle.sh", "scripts/test-launcher-registry.sh", "scripts/release-check.sh", "scripts/export-active-background-registry.mjs"]) {
  await chmod(resolve(output, script), 0o755);
}

console.log(`Generated ${appName} workspace -> ${output}`);
