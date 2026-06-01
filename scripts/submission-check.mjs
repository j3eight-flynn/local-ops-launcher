#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = resolve(new URL("..", import.meta.url).pathname);
const checks = [
  {
    name: "manifest",
    command: "node",
    args: ["scripts/validate-plugin-manifest.mjs"]
  },
  {
    name: "negative safety",
    command: "node",
    args: ["scripts/test-negative-cases.mjs"]
  },
  {
    name: "sanitized registry",
    command: "node",
    args: ["scripts/validate-registry.mjs", "--registry", "assets/sanitized-example-registry.json", "--allow-missing-paths"]
  },
  {
    name: "plugin smoke",
    command: "node",
    args: ["scripts/test-plugin.mjs"]
  },
  {
    name: "public package audit",
    command: "node",
    args: ["scripts/audit-public-package.mjs"]
  },
  {
    name: "package",
    command: "node",
    args: ["scripts/package-plugin.mjs"]
  }
];

for (const check of checks) {
  process.stdout.write(`\n== ${check.name} ==\n`);
  try {
    const { stdout, stderr } = await execFileAsync(check.command, check.args, {
      cwd: root,
      maxBuffer: 1024 * 1024 * 20
    });
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
  } catch (error) {
    if (error.stdout) process.stdout.write(error.stdout);
    if (error.stderr) process.stderr.write(error.stderr);
    console.error(`Submission check failed at: ${check.name}`);
    process.exit(error.code || 1);
  }
}

const packageList = await execFileAsync("/usr/bin/tar", ["-tzf", "dist/local-ops-launcher.tar.gz"], {
  cwd: root,
  maxBuffer: 1024 * 1024 * 5
});
const archiveContents = packageList.stdout.split("\n").filter(Boolean);
const forbiddenArchiveEntries = archiveContents.filter((entry) => entry.includes("/dist/") || entry.includes("/.git/"));
if (forbiddenArchiveEntries.length) {
  console.error("Archive contains forbidden entries:");
  for (const entry of forbiddenArchiveEntries) console.error(`- ${entry}`);
  process.exit(1);
}

const manifest = JSON.parse(await readFile(resolve(root, ".codex-plugin/plugin.json"), "utf8"));
console.log(`\nSubmission check passed for ${manifest.name} ${manifest.version}.`);
console.log("Archive: dist/local-ops-launcher.tar.gz");

