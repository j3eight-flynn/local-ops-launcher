---
name: local-ops-launcher
description: Use when a user wants Codex to scan local macOS projects and generate a safe native menu-bar launcher workspace with diagnostics, fixed ports, and redacted support bundles.
---

# Local Ops Launcher

Use this skill when the user wants to turn local projects, localhost apps, Docker Compose tools, LaunchAgents, or desktop `.command` shortcuts into a reusable macOS menu-bar launcher.

## Safety Rules

- Never stop processes, delete shortcuts, install LaunchAgents, install login items, or start services during discovery.
- Discovery and generation write reviewable files only.
- Treat generated start/stop/repair scripts as drafts until the user approves them.
- Prefer fixed ports. Do not invent random fallback ports.
- Redact support/share output by default when content may leave the user's machine.

## Workflow

1. Inspect the target environment.
   - Check likely roots: `~/Documents`, `~/Desktop`, `~/Code`, and any user-provided paths.
   - Look for `package.json`, Docker Compose files, `.command` files, LaunchAgents, and live localhost listeners.

2. Run discovery.
   - Use `scripts/local-ops-launcher.mjs scan` or `scripts/scan-local-projects.mjs`.
   - Output goes to `.local-ops/discovery.json` unless `--output` is provided.
   - Discovery is non-destructive.

3. Generate a registry draft.
   - Use `scripts/local-ops-launcher.mjs generate-registry` or `scripts/generate-registry.mjs`.
   - Output goes to `.local-ops/launcher-projects.draft.json`.
   - Uncertain entries must be marked `Needs review`.

4. Validate before generating an app.
   - Use `scripts/local-ops-launcher.mjs validate` or `scripts/validate-registry.mjs`.
   - Duplicate local ports, invalid URLs, missing paths, and unsafe service types must fail.

5. Generate the launcher workspace.
   - Use `scripts/generate-launcher-workspace.mjs --registry <draft> --output <workspace>`.
   - The generated workspace is a SwiftPM/AppKit menu-bar app.

6. Build and verify generated workspace.
   - Run `swift build`.
   - Run generated registry tests and release check.

7. Optional Active Background integration.
   - Enable only when the user asks or when an Active Background directory is detected and the user wants visual status export.

## Common Commands

```sh
node scripts/local-ops-launcher.mjs scan --root ~/Documents --root ~/Desktop
node scripts/local-ops-launcher.mjs generate-registry --input .local-ops/discovery.json
node scripts/local-ops-launcher.mjs validate --registry .local-ops/launcher-projects.draft.json
node scripts/local-ops-launcher.mjs generate-workspace --registry .local-ops/launcher-projects.draft.json --output ~/Documents/LocalOpsLauncher
node scripts/local-ops-launcher.mjs redact --mode support --input support.txt --output support.redacted.txt
```

## Output Expectations

When finished, report:
- discovery count by kind;
- registry validation status;
- generated workspace path;
- build/test status if run;
- any actions intentionally left for user review.
