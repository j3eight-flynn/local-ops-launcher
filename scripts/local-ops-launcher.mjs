#!/usr/bin/env node
import { execFile } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const command = process.argv[2] ?? "help";
const rest = process.argv.slice(3);

const scripts = {
  scan: "scan-local-projects.mjs",
  "generate-registry": "generate-registry.mjs",
  "generate-workspace": "generate-launcher-workspace.mjs",
  validate: "validate-registry.mjs",
  redact: "redact-support-bundle.mjs",
  test: "test-plugin.mjs"
};

function usage() {
  console.log(`Local Ops Launcher

Usage:
  local-ops-launcher.mjs scan [--root <path>] [--output <file>]
  local-ops-launcher.mjs generate-registry [--input <discovery>] [--output <registry>]
  local-ops-launcher.mjs validate --registry <registry>
  local-ops-launcher.mjs generate-workspace --registry <registry> --output <workspace>
  local-ops-launcher.mjs redact --mode local|support|share --input <file> --output <file>
  local-ops-launcher.mjs test

All commands are non-destructive. Generated scripts remain drafts until reviewed.`);
}

if (command === "help" || command === "--help" || command === "-h") {
  usage();
  process.exit(0);
}

const script = scripts[command];
if (!script) {
  usage();
  process.exit(64);
}

try {
  const child = await execFileAsync("node", [join(root, "scripts", script), ...rest], {
    maxBuffer: 1024 * 1024 * 20
  });
  if (child.stdout) process.stdout.write(child.stdout);
  if (child.stderr) process.stderr.write(child.stderr);
} catch (error) {
  if (error.stdout) process.stdout.write(error.stdout);
  if (error.stderr) process.stderr.write(error.stderr);
  process.exit(error.code || 1);
}
