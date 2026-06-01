#!/usr/bin/env node
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const pluginRoot = resolve(new URL("..", import.meta.url).pathname);
const work = await mkdtemp(join(tmpdir(), "local-ops-launcher-negative-"));
const badRegistry = join(work, "bad-registry.json");

const projects = [
  {
    name: "A",
    launcherId: "a",
    serviceType: "screen",
    projectPath: work,
    localUrl: "http://127.0.0.1:4444",
    startCommand: "npm run dev"
  },
  {
    name: "B",
    launcherId: "b",
    serviceType: "screen",
    projectPath: work,
    localUrl: "http://127.0.0.1:4444",
    startCommand: "rm -rf ~"
  }
];
await writeFile(badRegistry, JSON.stringify(projects, null, 2));

let failed = false;
try {
  await execFileAsync("node", [join(pluginRoot, "scripts/validate-registry.mjs"), "--registry", badRegistry]);
} catch {
  failed = true;
}
if (!failed) throw new Error("duplicate port and unsafe command registry unexpectedly passed");

const support = join(work, "support.txt");
const redacted = join(work, "support.redacted.txt");
await writeFile(support, `${process.env.HOME}/Private\npath=${process.env.HOME}/Private\nstopCommand='rm -rf nope'\nhttp://localhost:4444`);
await execFileAsync("node", [join(pluginRoot, "scripts/redact-support-bundle.mjs"), "--mode", "share", "--input", support, "--output", redacted]);
const text = await readFile(redacted, "utf8");
if (text.includes(process.env.HOME) || text.includes("rm -rf") || text.includes("http://localhost:4444")) {
  throw new Error("share redaction leaked private content");
}

console.log(`Negative safety tests passed in ${work}`);
