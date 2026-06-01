# Support

Local Ops Launcher is an advanced local-operations scaffold for macOS Codex users.

## Before Asking For Help

Run:

```sh
node scripts/submission-check.mjs
```

For generated launcher workspaces, run the generated workspace's release check:

```sh
./scripts/release-check.sh
```

## Sharing Diagnostics

Use the redaction script before sharing diagnostic output:

```sh
node scripts/redact-support-bundle.mjs --mode share --input support.txt --output support.share.txt
```

Use `support` mode when sharing with a trusted maintainer who needs port, service type, and status details. Use `share` mode for public channels.

## Known Boundaries

- macOS only for the generated native menu-bar app.
- The plugin generates local files and scripts; it does not host, deploy, or cloud-sync generated launchers.
- Active Background integration is optional and file-based.

