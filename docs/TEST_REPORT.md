# Test Report

Date: 2026-05-31

## Current Public Candidate

- Plugin: `local-ops-launcher`
- Version: `0.3.0`
- Artifact: `dist/local-ops-launcher.tar.gz`
- Public repository: `https://github.com/j3eight-flynn/local-ops-launcher`

## Required Checks

Run before submission:

```sh
node scripts/submission-check.mjs
```

The submission check validates:

- plugin manifest;
- negative safety cases;
- sanitized example registry;
- generated Swift launcher smoke test;
- public package audit;
- package archive creation;
- archive contents.

## Latest Result

Passed on 2026-05-31.

Summary:

- manifest validation: passed;
- negative safety tests: passed;
- sanitized registry validation: passed;
- generated Swift launcher smoke test: passed;
- public package audit: passed with 0 failures and 2 expected public-listing warnings;
- package creation: passed;
- archive inspection: passed.

Warnings:

- public URLs are present and should be checked against live destinations before submission.

Marketplace assets:

- `assets/icon.png`
- `assets/logo.png`
- `assets/screenshot-menu.png`

GitHub URL checks:

- repository: `200`
- privacy policy: `200`
- terms: `200`

Plugin analyzer:

- `plugin-eval analyze`: 95/100, grade A, 0 failures.
- Remaining warning: deferred token budget is above the baseline because the plugin includes substantial templates, docs, and visual assets.
