# Test Report

Date: 2026-05-31

## Current Public Candidate

- Plugin: `local-ops-launcher`
- Version: `0.3.0`
- Artifact: `dist/local-ops-launcher.tar.gz`

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

- no PNG composer icon is configured.

This is acceptable for a local/repo marketplace candidate, but a future public directory intake may require visual assets.

Additional analyzer note:

- `plugin-eval analyze` should be re-run after the GitHub repository is public so URL fields can be checked against live destinations.
