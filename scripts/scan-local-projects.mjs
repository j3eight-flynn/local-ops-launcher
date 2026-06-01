#!/usr/bin/env node
import { execFile } from "node:child_process";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const args = process.argv.slice(2);
const roots = [];
let output = ".local-ops/discovery.json";
let maxDepth = 4;

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === "--root") roots.push(resolve(expand(args[++index])));
  else if (arg === "--output") output = args[++index];
  else if (arg === "--max-depth") maxDepth = Number(args[++index] ?? maxDepth);
}

if (!roots.length) {
  for (const candidate of ["Documents", "Desktop", "Code"].map((entry) => join(homedir(), entry))) {
    if (await exists(candidate)) roots.push(candidate);
  }
}

const candidates = [];
const seen = new Set();

function expand(path) {
  return path?.replace(/^~/, homedir());
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function add(candidate) {
  const key = `${candidate.kind}:${candidate.path}:${candidate.projectPath ?? ""}`;
  if (seen.has(key)) return;
  seen.add(key);
  candidates.push(candidate);
}

function detectPort(text) {
  const patterns = [
    /--port\s+(\d{2,5})/,
    /-p\s+(\d{2,5})/,
    /PORT=(\d{2,5})/,
    /localhost:(\d{2,5})/,
    /127\.0\.0\.1:(\d{2,5})/
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return Number(match[1]);
  }
  return null;
}

async function walk(dir, depth) {
  if (depth > maxDepth) return;
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (["node_modules", ".git", ".next", "dist", "build", "Library"].includes(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(path, depth + 1);
      continue;
    }

    if (entry.name === "package.json") {
      try {
        const pkg = JSON.parse(await readFile(path, "utf8"));
        const scriptText = Object.values(pkg.scripts ?? {}).join("\n");
        add({
          kind: "node",
          name: pkg.name ?? basename(dir),
          path,
          projectPath: dir,
          packageManager: (await exists(join(dir, "pnpm-lock.yaml"))) ? "pnpm" : (await exists(join(dir, "yarn.lock"))) ? "yarn" : "npm",
          scripts: Object.keys(pkg.scripts ?? {}),
          suggestedScript: pkg.scripts?.dev ? "dev" : pkg.scripts?.start ? "start" : null,
          port: detectPort(scriptText),
          confidence: pkg.scripts?.dev || pkg.scripts?.start ? "high" : "medium"
        });
      } catch {}
    } else if (["docker-compose.yml", "docker-compose.yaml", "compose.yml", "compose.yaml"].includes(entry.name)) {
      add({ kind: "docker-compose", name: basename(dir), path, projectPath: dir, confidence: "high" });
    } else if (entry.name === "Dockerfile") {
      add({ kind: "dockerfile", name: basename(dir), path, projectPath: dir, confidence: "medium" });
    } else if (entry.name.endsWith(".command")) {
      add({ kind: "command", name: entry.name.replace(/\.command$/, ""), path, projectPath: dir, confidence: "high" });
    }
  }
}

async function scanLaunchAgents() {
  const dir = join(homedir(), "Library/LaunchAgents");
  let entries = [];
  try {
    entries = await readdir(dir);
  } catch {
    return;
  }
  for (const entry of entries.filter((name) => name.endsWith(".plist"))) {
    const path = join(dir, entry);
    const text = await readFile(path, "utf8").catch(() => "");
    add({
      kind: "launchAgent",
      name: entry.replace(/\.plist$/, ""),
      path,
      projectPath: null,
      label: entry.replace(/\.plist$/, ""),
      port: detectPort(text),
      confidence: "medium"
    });
  }
}

async function scanListeningPorts() {
  try {
    const { stdout } = await execFileAsync("/usr/sbin/lsof", ["-nP", "-iTCP", "-sTCP:LISTEN"]);
    for (const line of stdout.split("\n").slice(1)) {
      const match = line.match(/^(\S+)\s+(\d+)\s+\S+.*TCP\s+(?:127\.0\.0\.1|localhost|\[::1\]):(\d+)/);
      if (!match) continue;
      add({
        kind: "listener",
        name: `${match[1]}:${match[3]}`,
        path: "",
        projectPath: null,
        process: match[1],
        pid: Number(match[2]),
        port: Number(match[3]),
        confidence: "low"
      });
    }
  } catch {}
}

for (const root of roots) await walk(root, 0);
await scanLaunchAgents();
await scanListeningPorts();

const discovery = {
  schemaVersion: "0.1",
  generatedAt: new Date().toISOString(),
  roots,
  candidates
};

await mkdir(dirname(resolve(expand(output))), { recursive: true });
await writeFile(resolve(expand(output)), JSON.stringify(discovery, null, 2) + "\n");
console.log(`Discovered ${candidates.length} candidate(s) -> ${output}`);
