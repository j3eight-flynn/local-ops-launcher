# Security

Local Ops Launcher handles local project paths, shell command suggestions, localhost ports, and generated macOS launcher code. The project is intentionally conservative because those surfaces can affect a user's development machine.

## Security Model

- Discovery is read-only.
- Registry generation creates draft JSON for review.
- Validators reject duplicate ports, unsupported service types, invalid URLs, missing paths in strict mode, and dangerous shell command fragments.
- Stop commands are never invented for unknown services.
- Generated launchers use fixed ports and do not silently choose random fallback ports.
- Desktop shortcuts and LaunchAgents are never removed or installed automatically.

## Reporting Issues

For public release, report security-sensitive issues privately to the publisher before posting public details. Include a redacted support bundle in `share` mode whenever possible.

## Maintainer Checklist

Before publishing a release:

- run `node scripts/submission-check.mjs`;
- inspect the generated tarball with `tar -tzf dist/local-ops-launcher.tar.gz`;
- verify no private paths, project registries, secrets, or machine-specific support bundles are included;
- confirm the manifest version and changelog match the release.

