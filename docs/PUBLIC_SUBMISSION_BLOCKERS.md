# Public Submission Blockers

The plugin is packaged and validated as a local/repo marketplace candidate, but a public marketplace submission should confirm these items before final submission.

## Public URLs

The manifest uses the GitHub repository as the public home for:

- `interface.websiteURL`
- `interface.privacyPolicyURL`
- `interface.termsOfServiceURL`
- top-level `homepage`
- top-level `repository`

After the repository is created, confirm each URL resolves publicly.

## Public Listing Assets

The manifest includes PNG assets under `assets/`:

- `interface.composerIcon`: `./assets/icon.png`
- `interface.logo`: `./assets/logo.png`
- `interface.screenshots`: `./assets/screenshot-menu.png`

If the target marketplace requires specific dimensions or screenshots of a live Codex surface, regenerate these assets to match that spec.

## Official Intake Route

The current public OpenAI Codex plugin documentation describes personal and repo marketplaces, and marks the public Plugin Directory as coming soon. Keep this submission packet ready, but confirm OpenAI's official intake path before sending a final public submission.
