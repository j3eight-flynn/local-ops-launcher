# Privacy

Local Ops Launcher is designed as a local-first Codex plugin. It scans files and processes on the user's Mac only when the user asks Codex to run the plugin workflow.

## Data Access

The plugin may inspect:

- project folders selected by the user or common local roots such as Documents, Desktop, and Code;
- `package.json`, Docker Compose files, Dockerfiles, `.command` files, and LaunchAgent plist files;
- localhost port listeners through system tools such as `lsof`;
- generated launcher registries and diagnostic files in the user-owned workspace.

## Data Storage

Discovery output, draft registries, generated launchers, and support bundles are written to local files chosen by the workflow. The plugin does not create a cloud account, upload files, or sync data to a remote service.

## Redaction Modes

Support bundle redaction supports three modes:

- `local`: keeps full local paths and commands for the user's own machine.
- `support`: removes home-directory details while preserving enough technical context for troubleshooting.
- `share`: removes private paths, usernames, local URLs, and shell command bodies.

Use `share` before posting diagnostics in public issues, forums, plugin reviews, or marketplace submissions.

## Destructive Actions

The plugin does not start, stop, install, delete, or move user resources during discovery, registry generation, validation, packaging, or support-bundle redaction. Generated launcher workspaces may contain optional scripts, but those scripts require a later explicit user action.

