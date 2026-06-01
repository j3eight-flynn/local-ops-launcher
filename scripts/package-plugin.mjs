#!/usr/bin/env node
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = resolve(new URL("..", import.meta.url).pathname);
const dist = resolve(root, "dist");
const archive = resolve(dist, "local-ops-launcher.tar.gz");

await mkdir(dist, { recursive: true });
await execFileAsync("node", [resolve(root, "scripts/audit-public-package.mjs")]);
await execFileAsync("/usr/bin/tar", [
  "--exclude", "dist",
  "-czf",
  archive,
  "-C",
  resolve(root, ".."),
  "local-ops-launcher"
]);
console.log(`Packaged plugin -> ${archive}`);
