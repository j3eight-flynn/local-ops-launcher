#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { homedir, userInfo } from "node:os";
import { resolve } from "node:path";

const args = process.argv.slice(2);
let input = "";
let output = "";
let mode = "support";

for (let index = 0; index < args.length; index += 1) {
  if (args[index] === "--input") input = args[++index];
  else if (args[index] === "--output") output = args[++index];
  else if (args[index] === "--mode") mode = args[++index];
}

if (!input || !output) {
  console.error("Usage: redact-support-bundle.mjs --mode local|support|share --input <file> --output <file>");
  process.exit(64);
}

let text = await readFile(resolve(input), "utf8");
if (mode !== "local") {
  const home = homedir().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const username = userInfo().username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  text = text.replace(new RegExp(home, "g"), "~");
  text = text.replace(new RegExp(username, "g"), "<user>");
}

if (mode === "support" || mode === "share") {
  text = text.replace(/(startCommand|stopCommand|repairCommand|lastActionCommand)=?["': ]+.+/g, "$1=<redacted-command>");
  text = text.replace(/"((?:start|stop|repair)Command)"\s*:\s*"[^"]+"/g, "\"$1\": \"<redacted-command>\"");
}

if (mode === "share") {
  text = text.replace(/https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?[^\s"',)]*/g, "<local-url>");
  text = text.replace(/"projectPath"\s*:\s*"[^"]+"/g, "\"projectPath\": \"<redacted-path>\"");
  text = text.replace(/path=[^|\n]+/g, "path=<redacted-path>");
}

await writeFile(resolve(output), text);
console.log(`Wrote redacted ${mode} bundle -> ${output}`);
