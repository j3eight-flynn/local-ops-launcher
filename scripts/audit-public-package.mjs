#!/usr/bin/env node
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const failures = [];
const warnings = [];
const absoluteUserPathNeedle = "/" + "Users/";
const placeholderNeedle = "[" + "TODO";

const forbiddenPathFragments = [
  "/" + "Documents/Codex/",
  "please" + "-look-at-all-of-the"
];

const customForbiddenTerms = (process.env.LOCAL_OPS_FORBIDDEN_TERMS ?? "")
  .split(",")
  .map((term) => term.trim())
  .filter(Boolean);
const secretPattern = new RegExp(
  [
    "OPENAI",
    "ANTHROPIC",
    "SUPABASE"
  ].map((prefix) => `${prefix}_API_KEY`).join("|") + "|SUPABASE" + "_SERVICE_ROLE|DATABASE" + "_URL="
);

const requiredFiles = [
  ".codex-plugin/plugin.json",
  "README.md",
  "CHANGELOG.md",
  "docs/PRIVACY.md",
  "docs/SECURITY.md",
  "docs/TERMS.md",
  "docs/SUPPORT.md",
  "docs/PUBLIC_MARKETPLACE_CHECKLIST.md",
  "docs/PUBLIC_SUBMISSION_BLOCKERS.md",
  "docs/SUBMISSION_PACKET.md",
  "docs/TEST_REPORT.md",
  "skills/local-ops-launcher/SKILL.md",
  "scripts/scan-local-projects.mjs",
  "scripts/generate-registry.mjs",
  "scripts/generate-launcher-workspace.mjs",
  "scripts/validate-registry.mjs",
  "scripts/redact-support-bundle.mjs"
];

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const rel = relative(root, fullPath);
    if (entry.isDirectory()) {
      if ([".git", "dist", "node_modules"].includes(entry.name)) continue;
      files.push(...await walk(fullPath));
    } else if (entry.isFile()) {
      files.push(rel);
    }
  }
  return files;
}

for (const file of requiredFiles) {
  if (!(await exists(join(root, file)))) failures.push(`required file missing: ${file}`);
}

const files = await walk(root);
for (const rel of files) {
  const fullPath = join(root, rel);
  const text = await readFile(fullPath, "utf8").catch(() => "");
  if (!text) continue;

  if (text.includes(placeholderNeedle)) failures.push(`placeholder TODO found in ${rel}`);
  if (text.includes(absoluteUserPathNeedle)) failures.push(`absolute user path found in ${rel}`);
  for (const fragment of forbiddenPathFragments) {
    if (text.includes(fragment)) failures.push(`private path fragment "${fragment}" found in ${rel}`);
  }
  for (const term of customForbiddenTerms) {
    if (text.includes(term)) failures.push(`custom forbidden term found in ${rel}`);
  }
  if (secretPattern.test(text)) {
    failures.push(`possible secret reference found in ${rel}`);
  }
}

const manifest = JSON.parse(await readFile(join(root, ".codex-plugin/plugin.json"), "utf8"));
if (manifest.interface?.privacyPolicyURL || manifest.interface?.termsOfServiceURL || manifest.homepage || manifest.repository) {
  warnings.push("public URLs are present; verify they point to live public resources before submission");
}
if (!manifest.interface?.websiteURL) {
  warnings.push("no public websiteURL in manifest; acceptable for local candidate, but public marketplace may require one");
}
if (!manifest.interface?.composerIcon) {
  warnings.push("no composerIcon configured; public marketplace may request PNG visual assets");
}

for (const warning of warnings) console.warn(`WARN ${warning}`);
for (const failure of failures) console.error(`FAIL ${failure}`);
console.log(`Public package audit: ${failures.length} failure(s), ${warnings.length} warning(s).`);
process.exit(failures.length ? 1 : 0);
