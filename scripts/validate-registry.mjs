#!/usr/bin/env node
import { access, readFile, stat } from "node:fs/promises";
import { constants } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

const args = process.argv.slice(2);
let registryPath = ".local-ops/launcher-projects.draft.json";
let allowMissingPaths = false;

for (let index = 0; index < args.length; index += 1) {
  if (args[index] === "--registry") registryPath = args[++index];
  else if (args[index] === "--allow-missing-paths") allowMissingPaths = true;
}

const supported = new Set(["screen", "docker", "screen+docker", "launchAgent", "utility", "hostedOnly"]);
const unsafePattern = /\b(rm\s+-rf|shutdown|reboot|mkfs|diskutil\s+erase|killall\s+\S+)\b/i;
const failures = [];
const warnings = [];
const ports = new Map();
const ids = new Set();

function expand(path) {
  return path?.replace(/^~/, homedir());
}

async function exists(path) {
  try {
    await stat(expand(path));
    return true;
  } catch {
    return false;
  }
}

async function executable(path) {
  try {
    await access(expand(path), constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function validUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

const projects = JSON.parse(await readFile(resolve(expand(registryPath)), "utf8"));
for (const project of projects) {
  const label = project.shortName ?? project.name ?? "<unnamed>";
  if (!project.name) failures.push(`${label}: missing name`);
  if (!project.launcherId) failures.push(`${label}: missing launcherId`);
  if (ids.has(project.launcherId)) failures.push(`${label}: duplicate launcherId ${project.launcherId}`);
  ids.add(project.launcherId);

  if (!supported.has(project.serviceType)) failures.push(`${label}: unsupported serviceType ${project.serviceType}`);
  if (project.projectPath && !(await exists(project.projectPath)) && !allowMissingPaths) failures.push(`${label}: missing projectPath ${project.projectPath}`);
  if (project.launcherCommandPath) {
    if (!(await exists(project.launcherCommandPath)) && !allowMissingPaths) failures.push(`${label}: missing launcherCommandPath ${project.launcherCommandPath}`);
    else if ((await exists(project.launcherCommandPath)) && !(await executable(project.launcherCommandPath))) failures.push(`${label}: launcherCommandPath is not executable`);
  }

  for (const key of ["hostedUrl", "localUrl", "healthUrl"]) {
    if (project[key] && !validUrl(project[key])) failures.push(`${label}: invalid ${key} ${project[key]}`);
  }

  if (project.localUrl) {
    const port = new URL(project.localUrl).port;
    if (port) {
      const previous = ports.get(port);
      if (previous) failures.push(`${label}: duplicate local port ${port} also used by ${previous}`);
      ports.set(port, label);
    }
  }

  for (const key of ["startCommand", "stopCommand", "repairCommand"]) {
    if (project[key] && unsafePattern.test(project[key])) failures.push(`${label}: unsafe ${key}`);
  }

  if (project.reviewStatus === "Needs review") warnings.push(`${label}: marked Needs review`);
  if (project.serviceType !== "utility" && !project.localUrl && !project.hostedUrl) warnings.push(`${label}: no URL configured`);
}

for (const warning of warnings) console.log(`WARN ${warning}`);
for (const failure of failures) console.error(`FAIL ${failure}`);
console.log(`Registry validation: ${projects.length} projects, ${failures.length} failure(s), ${warnings.length} warning(s).`);
process.exit(failures.length ? 1 : 0);
