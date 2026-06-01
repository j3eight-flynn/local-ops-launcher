#!/bin/zsh
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
node -e '
const fs = require("fs");
const projects = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
const ids = new Set();
const ports = new Map();
let failures = 0;
for (const project of projects) {
  if (!project.name || !project.launcherId) { console.error(`FAIL missing name/id`); failures++; }
  if (ids.has(project.launcherId)) { console.error(`FAIL duplicate id ${project.launcherId}`); failures++; }
  ids.add(project.launcherId);
  if (project.localUrl) {
    const port = new URL(project.localUrl).port;
    if (port && ports.has(port)) { console.error(`FAIL duplicate port ${port}`); failures++; }
    if (port) ports.set(port, project.name);
  }
}
console.log(`Registry test: ${projects.length} projects, ${failures} failure(s).`);
process.exit(failures ? 1 : 0);
' "$ROOT_DIR/launcher-projects.json"
