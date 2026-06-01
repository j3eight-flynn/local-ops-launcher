# Asset Forge

Local Ops Launcher includes the framework-neutral Asset Forge core service and CLI.

This repository is a Codex plugin package, not a Next.js or React app, so the integration intentionally does not install admin UI components, App Router templates, API routes, or auth middleware.

## Configuration

- Config: `asset-forge/asset-forge.config.json`
- Manifest: `public/assets/asset-manifest.json`
- Generated root: `public/assets/generated`
- Audit log: `asset-forge/asset-forge-log.json`

Production behavior stays approved-only by default:

```txt
ASSET_FORGE_APPROVED_ONLY=true
```

Generation requires server-side environment variables:

```txt
OPENAI_API_KEY=
ASSET_FORGE_ENABLED=true
ASSET_FORGE_GENERATION_ENABLED=true
ASSET_FORGE_ADMIN_TOKEN=
```

Do not commit real API keys or admin tokens.

## CLI

Create a prompt-only draft:

```sh
node scripts/asset-forge-cli.mjs request \
  --title "Marketplace icon concept" \
  --type item_icon \
  --purpose "Public plugin marketplace icon" \
  --description "Minimal local operations launcher symbol with project nodes and mint accent color."
```

List draft prompts:

```sh
node scripts/asset-forge-cli.mjs list --status draft_prompt_only
```

Approve an imported or generated asset:

```sh
node scripts/asset-forge-cli.mjs approve --id asset_...
```

## Production Use

Consumers should use approved assets only unless a review surface explicitly requests drafts. The copied TypeScript service exposes approved-asset helpers under `src/lib/asset-forge`.

