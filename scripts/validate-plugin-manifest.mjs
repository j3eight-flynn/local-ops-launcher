#!/usr/bin/env node
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const manifestPath = resolve(root, ".codex-plugin/plugin.json");
const failures = [];

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const required = [
  ["name", "string"],
  ["version", "string"],
  ["description", "string"],
  ["skills", "string"]
];

for (const [key, type] of required) {
  if (typeof manifest[key] !== type || !manifest[key]) failures.push(`manifest.${key} missing or invalid`);
}
if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(manifest.name ?? "")) failures.push("manifest.name must be kebab-case and <=64 chars");
if (!/^\d+\.\d+\.\d+$/.test(manifest.version ?? "")) failures.push("manifest.version must be strict semver");
if (!manifest.author?.name) failures.push("manifest.author.name missing");
if (!manifest.interface?.displayName) failures.push("interface.displayName missing");
if (!manifest.interface?.shortDescription) failures.push("interface.shortDescription missing");
if (!manifest.interface?.longDescription) failures.push("interface.longDescription missing");
if (!manifest.interface?.developerName) failures.push("interface.developerName missing");
if (!manifest.interface?.category) failures.push("interface.category missing");
if (!Array.isArray(manifest.interface?.defaultPrompt)) failures.push("interface.defaultPrompt must be an array");
if (JSON.stringify(manifest).includes("[" + "TODO")) failures.push("manifest contains TODO placeholder");

async function pathExists(relativePath) {
  try {
    await stat(resolve(root, relativePath.replace(/^\.\//, "")));
    return true;
  } catch {
    return false;
  }
}

if (manifest.skills && !(await pathExists(manifest.skills))) failures.push(`skills path does not exist: ${manifest.skills}`);
for (const unsupported of ["hooks"]) {
  if (unsupported in manifest) failures.push(`unsupported manifest field present: ${unsupported}`);
}

for (const failure of failures) console.error(`FAIL ${failure}`);
console.log(`Plugin manifest validation: ${failures.length} failure(s).`);
process.exit(failures.length ? 1 : 0);
