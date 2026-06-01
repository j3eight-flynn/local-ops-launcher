#!/usr/bin/env node
import { mkdtemp, mkdir, readFile, writeFile, chmod } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const pluginRoot = resolve(new URL("..", import.meta.url).pathname);
const work = await mkdtemp(join(tmpdir(), "local-ops-launcher-test-"));
const appDir = join(work, "Example App");
const dockerDir = join(work, "Docker Tool");
const desktop = join(work, "Desktop");
await mkdir(appDir, { recursive: true });
await mkdir(dockerDir, { recursive: true });
await mkdir(desktop, { recursive: true });
await writeFile(join(appDir, "package.json"), JSON.stringify({ name: "example-app", scripts: { dev: "next dev --port 3456" } }, null, 2));
await writeFile(join(dockerDir, "compose.yml"), "services:\n  web:\n    image: nginx\n");
await writeFile(join(desktop, "Example Utility.command"), "#!/bin/zsh\necho utility\n");
await chmod(join(desktop, "Example Utility.command"), 0o755);

await execFileAsync("node", [join(pluginRoot, "scripts/scan-local-projects.mjs"), "--root", work, "--output", join(work, "discovery.json"), "--max-depth", "3"]);
await execFileAsync("node", [join(pluginRoot, "scripts/generate-registry.mjs"), "--input", join(work, "discovery.json"), "--output", join(work, "registry.json")]);
await execFileAsync("node", [join(pluginRoot, "scripts/validate-registry.mjs"), "--registry", join(work, "registry.json")]);

const registry = JSON.parse(await readFile(join(work, "registry.json"), "utf8"));
if (!registry.some((project) => project.serviceType === "screen" && project.localUrl === "http://127.0.0.1:3456")) {
  throw new Error("screen project with detected port was not generated");
}
if (!registry.some((project) => project.serviceType === "docker")) {
  throw new Error("docker project was not generated");
}
if (!registry.some((project) => project.serviceType === "utility")) {
  throw new Error("utility project was not generated");
}

await writeFile(join(work, "support.txt"), `${process.env.HOME}/Secret\n"startCommand": "cd '${process.env.HOME}/Secret' && npm run dev"\nhttp://127.0.0.1:3456\n`);
await execFileAsync("node", [join(pluginRoot, "scripts/redact-support-bundle.mjs"), "--mode", "share", "--input", join(work, "support.txt"), "--output", join(work, "support.redacted.txt")]);
const redacted = await readFile(join(work, "support.redacted.txt"), "utf8");
if (redacted.includes(process.env.HOME) || redacted.includes("npm run dev") || redacted.includes("http://127.0.0.1:3456")) {
  throw new Error("redaction did not remove private content");
}

await execFileAsync("node", [join(pluginRoot, "scripts/generate-launcher-workspace.mjs"), "--registry", join(work, "registry.json"), "--output", join(work, "Generated Launcher"), "--app-name", "Generated Launcher"]);
await execFileAsync("swift", ["build"], { cwd: join(work, "Generated Launcher") });
await execFileAsync("node", [join(pluginRoot, "scripts/generate-launcher-workspace.mjs"), "--registry", join(work, "registry.json"), "--output", join(work, "Generated Launcher AB"), "--app-name", "Generated Launcher AB", "--active-background"]);
const abExport = await readFile(join(work, "Generated Launcher AB", "scripts", "export-active-background-registry.mjs"), "utf8");
if (!abExport.includes("const enabled = true;")) {
  throw new Error("Active Background enabled template was not rendered");
}
console.log(`Plugin smoke test passed in ${work}`);
