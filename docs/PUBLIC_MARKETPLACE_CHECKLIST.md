# Public Marketplace Checklist

Use this checklist before submitting Local Ops Launcher to a public Codex plugin marketplace or reviewer.

## Required

- [ ] Manifest has strict semver, accurate display metadata, and no placeholder fields.
- [ ] Real public HTTPS URLs resolve for website, privacy policy, terms, homepage, and repository.
- [ ] README explains the user workflow and non-destructive defaults.
- [ ] Privacy, security, support, release checklist, and submission packet docs are present.
- [ ] Plugin package contains no private project registries, local support bundles, secrets, or machine-specific paths.
- [ ] `node scripts/submission-check.mjs` passes.
- [ ] `dist/local-ops-launcher.tar.gz` is rebuilt from the current tree.
- [ ] The generated launcher smoke test builds a SwiftPM/AppKit workspace.

## Reviewer Notes

- This plugin is local-only and does not require authentication.
- This plugin does not bundle a user-specific project registry.
- This plugin creates drafts and generated workspaces only after explicit user prompts.
- Generated launcher scripts remain reviewable and user-owned.

## Optional Before Public Listing

- Add PNG icon, logo, and screenshots if the target marketplace accepts visual assets.
- Add a signed release tag matching the manifest version.
