# Local Ops Launcher Purpose

## Project Name

Local Ops Launcher

---

## Vision

Five years from now, Local Ops Launcher should make local AI-assisted project work feel calm, inspectable, and operationally sane. A Codex user with many local apps, localhost ports, Docker tools, LaunchAgents, generated assets, and support scripts should be able to turn that local sprawl into a safe, reviewable operations console instead of a pile of fragile shortcuts and half-remembered commands.

Success means local development environments become easier to understand, easier to launch, easier to debug, and safer to share with another human or Codex session. The project should help users trust their local project ecosystem without hiding how it works.

---

## Mission

Local Ops Launcher provides a reusable Codex plugin that scans local macOS projects, drafts a fixed-port launcher registry, validates paths and service behavior, generates a native Swift/AppKit menu-bar launcher workspace, and packages diagnostics and redacted support information for safe review.

The project should favor non-destructive discovery, explicit review, and clear local evidence over automation that surprises the user. It exists to help Codex users convert messy local project operations into a predictable, documented, auditable workflow.

Local Ops Launcher also includes framework-neutral Asset Forge support so marketplace, documentation, and project assets can be generated and reviewed through an approved-only asset pipeline without adding a web admin surface to this plugin package.

---

## Core Problem

AI-assisted local work often creates many small projects, demo apps, scripts, ports, generated artifacts, and desktop launchers. Over time, users lose track of which app owns which port, which command starts which service, which launcher is still valid, and which diagnostic information is safe to share.

The existing pain is practical and cumulative:

- local projects are scattered across folders and desktop shortcuts;
- localhost ports conflict or drift without clear ownership;
- `.command` files, Docker Compose stacks, package scripts, and LaunchAgents behave differently;
- support bundles can leak private paths, usernames, local URLs, or shell commands;
- generated launchers can become unsafe if they infer stop/restart behavior too aggressively;
- public plugin packaging can accidentally include private project state or machine-specific files;
- generated visual assets need a review path before becoming public-facing marketplace material.

The risk is not only inconvenience. A local ops tool that starts, stops, deletes, installs, or exposes information too casually can damage trust quickly. Local Ops Launcher exists to make the useful automation visible, bounded, and reversible.

---

## Users

### Primary Users

Primary users are Codex desktop users on macOS who manage multiple local apps, scripts, Docker services, LaunchAgents, and localhost tools.

They need a way to discover local projects, generate a launcher registry, validate fixed ports, create a menu-bar launcher, and package diagnostics without manually stitching every detail together. Success means they can launch and inspect their local work from one trusted place while keeping final control over starts, stops, installs, and sharing.

### Secondary Users

Secondary users are plugin reviewers, maintainers, collaborators, and support helpers who need to understand what the plugin does and whether it is safe.

They need clean docs, a public repository, privacy and security notes, reproducible checks, sanitized examples, marketplace assets, and redaction behavior. Success means they can audit the plugin without receiving private project lists, secrets, or machine-specific support data.

### Future Users

Future users may include teams using Codex across shared local workflows, maintainers building project-specific launcher templates, and users who want optional visual status surfaces such as Active Background.

They need extensible service models, stronger testing, clearer packaging conventions, and optional integrations that remain local-first. Success means the plugin can grow into a dependable local operations scaffold without turning into a hidden process manager or cloud dashboard.

---

## Desired Outcomes

- Reduce time spent finding and launching local projects.
- Reduce localhost port conflicts and unclear service ownership.
- Increase confidence that generated launcher workspaces are safe to review and run.
- Improve visibility into project paths, service types, health URLs, and diagnostics.
- Reduce private-path and command leakage in support bundles and public packages.
- Preserve user control over starts, stops, installs, login items, and shortcut cleanup.
- Make public plugin packaging repeatable through manifest validation, smoke tests, audits, and submission checks.
- Keep generated assets reviewable and approved-only before production or marketplace use.

---

## Product Principles

- Human judgment remains in control.
- Discovery must be non-destructive by default.
- Generated files must be reviewable before use.
- Fixed ports beat random fallback ports.
- Stop and restart behavior must never be invented for unknown services.
- Safety and privacy are product features, not afterthoughts.
- Local-first workflows should not require cloud sync.
- Diagnostics should explain what happened without requiring Terminal expertise.
- Public packages must not include private registries, local support bundles, secrets, or machine-specific paths.
- Approved assets are the production default; drafts stay out of production consumers.
- Simplicity beats clever automation.

---

## Anti-Goals

Local Ops Launcher must never become:

- a destructive process manager that stops or deletes resources without explicit approval;
- a cloud monitoring platform;
- a private project list bundled as a public plugin;
- a launcher that silently changes ports to hide conflicts;
- an installer that modifies LaunchAgents, login items, or desktop shortcuts without review;
- an opaque AI tool that hides generated commands or service decisions;
- a general-purpose asset generator that bypasses review and approval;
- a large web admin product inside a framework-neutral Codex plugin package;
- a complex workflow that requires extensive training before it is useful;
- an unmaintainable collection of shell-string behavior with no validation.

---

## Success Metrics

- Discovery produces useful project candidates without mutating user files.
- Registry validation catches duplicate ports, missing paths, invalid URLs, unsupported service types, and unsafe commands.
- Generated Swift/AppKit launcher workspaces build successfully in smoke tests.
- `scripts/submission-check.mjs` passes before release or sharing.
- Public package audit reports zero failures.
- Support bundle redaction removes private paths, usernames, local URLs, and command bodies in share mode.
- Asset Forge prompt-only smoke creates draft records without committing generated draft assets.
- Approved-asset helpers return only approved assets by default.
- GitHub-hosted public docs and marketplace asset URLs resolve successfully.
- Users can explain what the plugin will do before they run it.

---

## Ecosystem Relationships

Local Ops Launcher is an ecosystem product for Codex desktop users. It creates reusable local operations scaffolding rather than serving as one standalone application.

Relationships:

- Codex plugin system: exposes the Local Ops Launcher skill and plugin manifest.
- GitHub: public source repository, documentation home, and submission-ready package host.
- macOS/AppKit/SwiftPM: generated native menu-bar launcher workspace target.
- Local project ecosystem: scans project folders, package scripts, Docker files, `.command` utilities, LaunchAgents, and localhost listeners.
- Active Background: optional future/status export relationship; not required for core use.
- Asset Forge: framework-neutral asset service for generated/reviewed marketplace and documentation assets.
- OpenAI image generation: optional server-side provider only when environment variables are configured; API keys must not be exposed client-side or committed.

The project should remain local-first and should not require shared authentication, shared databases, or cloud infrastructure for its core workflow.

---

## Strategic Horizon

### Current Phase

Local Ops Launcher is a public GitHub-hosted Codex plugin candidate. It provides discovery, registry generation, validation, launcher workspace generation, diagnostics-oriented scripts, support-bundle redaction, package audits, submission checks, marketplace PNG assets, and framework-neutral Asset Forge support.

### Next Phase

The next phase should harden maintainability: add targeted tests for the copied Asset Forge TypeScript service, reduce token and package complexity where practical, keep public docs current, and refine release artifacts around the eventual official Codex Plugin Directory intake path.

### Future Phase

The future phase should make Local Ops Launcher a trusted local operations scaffold for broader teams: clearer service-controller templates, optional Active Background export, richer diagnostics, better sample fixtures, and more marketplace-ready examples while preserving the non-destructive local-first contract.

---

## Purpose Test

Every proposed feature must pass:

1. Does this support the mission?
2. Does this improve desired outcomes?
3. Does this align with product principles?
4. Does this avoid anti-goals?
5. Is this the simplest effective solution?

If three or more answers are "No," recommend against implementation.

---

## Maintenance Requirements

Review this file after:

- major feature additions;
- major pivots;
- new user groups;
- architecture changes;
- new business objectives;
- changes to Codex plugin marketplace requirements;
- changes to service start/stop/repair behavior;
- changes to Asset Forge generation or approval behavior.

Purpose may evolve, but the vision and mission should remain stable whenever possible.

---

## Draft Purpose And Assumptions

This purpose is inferred from the current repository documentation, plugin manifest, skill instructions, scripts, Asset Forge integration, public submission packet, and changelog.

Assumptions requiring owner review:

- The project should remain macOS-first because the generated launcher target is Swift/AppKit.
- The plugin should remain local-first and should not add cloud sync unless a future purpose review approves it.
- The public GitHub repository is the current public home until OpenAI exposes a self-serve public Plugin Directory submission path.
- Asset Forge should remain framework-neutral in this repo unless the project intentionally becomes a web app.
- Safety, privacy, and reviewability are more important than one-click automation.

---

## Final Rule

Never optimize for features.

Always optimize for purpose.

Features are temporary.

Purpose is enduring.
