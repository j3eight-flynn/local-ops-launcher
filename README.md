# Local Ops Launcher

Local Ops Launcher is a Codex plugin for turning local projects, localhost apps, Docker tools, LaunchAgents, and `.command` utilities into a safe native macOS menu-bar launcher.

## Workflow

```sh
node scripts/local-ops-launcher.mjs scan --root ~/Documents --root ~/Desktop
node scripts/local-ops-launcher.mjs generate-registry --input .local-ops/discovery.json
node scripts/local-ops-launcher.mjs validate --registry .local-ops/launcher-projects.draft.json
node scripts/local-ops-launcher.mjs generate-workspace --registry .local-ops/launcher-projects.draft.json --output ~/Documents/LocalOpsLauncher
```

## Safety

- Discovery and generation are review-first.
- No services are started or stopped by plugin scripts.
- No shortcuts or LaunchAgents are deleted or installed automatically.
- Support bundles can be redacted with `local`, `support`, or `share` privacy modes.
- Asset Forge is installed as a framework-neutral asset service for marketplace and documentation assets. See `docs/ASSET_FORGE.md`.

## Install From GitHub

Codex plugin discovery is marketplace-based. Clone the repository into your plugins folder, add it to a personal or workspace marketplace, then restart Codex.

```sh
mkdir -p ~/plugins
git clone https://github.com/j3eight-flynn/local-ops-launcher ~/plugins/local-ops-launcher
```

Example personal marketplace entry:

```json
{
  "name": "local-ops-launcher",
  "source": {
    "source": "local",
    "path": "./plugins/local-ops-launcher"
  },
  "policy": {
    "installation": "AVAILABLE",
    "authentication": "ON_INSTALL"
  },
  "category": "Productivity"
}
```

## Validation

```sh
node ~/plugins/local-ops-launcher/scripts/validate-plugin-manifest.mjs
node ~/plugins/local-ops-launcher/scripts/test-plugin.mjs
node ~/plugins/local-ops-launcher/scripts/test-negative-cases.mjs
node ~/plugins/local-ops-launcher/scripts/package-plugin.mjs
```

## Public Release Candidate

Before sharing or submitting the plugin, run the full public submission check:

```sh
node scripts/submission-check.mjs
```

The check validates the manifest, safety behavior, sanitized example registry, generated Swift launcher smoke test, redaction behavior, public-package audit, and packaged tarball.

Public-facing documentation is in `docs/`:

- `PRIVACY.md`
- `SECURITY.md`
- `SUPPORT.md`
- `PUBLIC_MARKETPLACE_CHECKLIST.md`
- `SUBMISSION_PACKET.md`
- `PUBLIC_SUBMISSION_BLOCKERS.md`
- `TEST_REPORT.md`
