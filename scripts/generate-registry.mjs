#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, resolve } from "node:path";

const args = process.argv.slice(2);
let input = ".local-ops/discovery.json";
let output = ".local-ops/launcher-projects.draft.json";

for (let index = 0; index < args.length; index += 1) {
  if (args[index] === "--input") input = args[++index];
  else if (args[index] === "--output") output = args[++index];
}

function expand(path) {
  return path?.replace(/^~/, homedir());
}

function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64) || "local-app";
}

function title(value) {
  return String(value)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function colorFor(index) {
  const colors = ["#42F5B3", "#58C8FF", "#FFB000", "#B58CFF", "#A7FF38", "#FF5A7A"];
  return colors[index % colors.length];
}

const discovery = JSON.parse(await readFile(resolve(expand(input)), "utf8"));
const groups = new Map();
for (const candidate of discovery.candidates ?? []) {
  if (candidate.kind === "listener") continue;
  const key = candidate.projectPath ?? candidate.path;
  const group = groups.get(key) ?? [];
  group.push(candidate);
  groups.set(key, group);
}

const projects = [];
let displayOrder = 1;
for (const [projectPath, candidates] of groups) {
  const command = candidates.find((candidate) => candidate.kind === "command");
  const agent = candidates.find((candidate) => candidate.kind === "launchAgent");
  const docker = candidates.find((candidate) => candidate.kind === "docker-compose") ?? candidates.find((candidate) => candidate.kind === "dockerfile");
  const node = candidates.find((candidate) => candidate.kind === "node");
  const baseName = command?.name ?? node?.name ?? docker?.name ?? agent?.name ?? basename(projectPath);
  const launcherId = slug(baseName);
  const port = node?.port ?? docker?.port ?? agent?.port ?? null;
  const serviceType = command ? "utility" : agent ? "launchAgent" : docker ? "docker" : node ? "screen" : "hostedOnly";
  const packageManager = node?.packageManager ?? "npm";
  const script = node?.suggestedScript ?? "dev";
  const localUrl = port ? `http://127.0.0.1:${port}` : null;
  const startCommand =
    serviceType === "screen" ? `cd '${projectPath}' && ${packageManager} run ${script}` :
    serviceType === "docker" ? `cd '${projectPath}' && docker compose up -d` :
    serviceType === "launchAgent" ? `launchctl kickstart -k gui/$(id -u)/${agent.label}` :
    null;

  projects.push({
    name: title(baseName),
    shortName: title(baseName),
    category: serviceType === "utility" ? "Utilities" : "Local Apps",
    launcherId,
    serviceType,
    projectPath: command ? dirname(command.path) : projectPath,
    localUrl,
    healthUrl: localUrl,
    launcherCommandPath: command?.path ?? undefined,
    startCommand: startCommand ?? undefined,
    repairCommand: startCommand ?? undefined,
    preferredLaunch: localUrl || command ? "local" : "hosted",
    workspaceSets: [],
    activeBackgroundColor: colorFor(displayOrder - 1),
    iconSymbol: serviceType === "docker" ? "shippingbox" : serviceType === "utility" ? "gearshape" : "app",
    displayOrder,
    reviewStatus: port || command ? "Ready for review" : "Needs review"
  });
  displayOrder += 1;
}

await mkdir(dirname(resolve(expand(output))), { recursive: true });
await writeFile(resolve(expand(output)), JSON.stringify(projects, null, 2) + "\n");
console.log(`Generated ${projects.length} registry draft entr${projects.length === 1 ? "y" : "ies"} -> ${output}`);
