# Submission Packet

## Plugin

- Name: `local-ops-launcher`
- Display name: Local Ops Launcher
- Version: `0.3.0`
- Category: Productivity
- Platform: macOS for generated menu-bar launcher workspaces
- Authentication: none
- Public repository: `https://github.com/j3eight-flynn/local-ops-launcher`
- Marketplace assets:
  - `assets/icon.png`
  - `assets/logo.png`
  - `assets/screenshot-menu.png`

## One-Line Summary

Local Ops Launcher helps Codex users scan local projects and generate a safe native macOS menu-bar launcher with fixed ports, diagnostics, and redacted support bundles.

## Reviewer Description

Local Ops Launcher is a local-first Codex plugin for users who have many small local apps, Docker tools, LaunchAgents, `.command` launchers, and localhost services. It provides a reviewable workflow:

1. scan selected local roots;
2. draft a launcher registry;
3. validate paths, ports, URLs, service types, and command safety;
4. generate a SwiftPM/AppKit menu-bar launcher workspace;
5. run smoke tests and package checks;
6. redact support bundles for safe sharing.

The plugin does not ship a private project list and does not perform destructive actions by default.

## Safety Claims

- Discovery and validation are read-only.
- Generated files are written only to user-owned paths requested by the workflow.
- The plugin does not delete desktop shortcuts.
- The plugin does not install LaunchAgents or login items.
- The plugin does not start or stop services during plugin discovery, registry generation, or package checks.
- Stop commands are not inferred for unknown processes.
- Share-mode redaction removes private paths, local URLs, and shell command bodies.

## Package Artifact

After running the release check:

```sh
node scripts/submission-check.mjs
```

the submission archive is:

```text
dist/local-ops-launcher.tar.gz
```

## Validation Evidence

Record the latest command output in `docs/TEST_REPORT.md` before submission.

Required commands:

```sh
node scripts/validate-plugin-manifest.mjs
node scripts/test-negative-cases.mjs
node scripts/validate-registry.mjs --registry assets/sanitized-example-registry.json --allow-missing-paths
node scripts/test-plugin.mjs
node scripts/audit-public-package.mjs
node scripts/package-plugin.mjs
node scripts/submission-check.mjs
```

## Open Items For Marketplace Owner

- Confirm any required visual-asset dimensions or screenshot content rules.
- Confirm whether marketplace packaging should be tarball-based, repository-based, or direct local plugin import.
- Confirm whether local-only plugins need additional macOS permission disclosures.
- Official public Plugin Directory publishing is marked as coming soon in the Codex plugin docs, so use this packet for workspace sharing, repo marketplace review, or future public intake once OpenAI exposes the submission path.
- See `docs/PUBLIC_SUBMISSION_BLOCKERS.md` before final public submission.
