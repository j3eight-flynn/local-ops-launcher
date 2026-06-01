# Changelog

## 0.3.0 - 2026-05-31

- Prepared public submission candidate metadata.
- Added privacy, security, support, marketplace checklist, submission packet, and test report docs.
- Added public-package audit for private paths, project names, secrets, and required docs.
- Added one-command submission check covering manifest validation, safety tests, smoke tests, public audit, and packaging.
- Updated packaging to run the public audit before producing the tarball.
- Added explicit public submission blocker tracking for required public URLs and optional PNG listing assets.
- Added GitHub repository metadata, MIT license file, public terms doc, and source-friendly `.gitignore`.
- Added PNG marketplace icon, logo, and generic screenshot assets.

## 0.2.0 - 2026-05-31

- Added one-command CLI wrapper.
- Added plugin packaging script.
- Added plugin manifest validator fallback for environments where the scaffold validator is unavailable.
- Added negative safety tests for duplicate ports, unsafe commands, and share redaction.
- Added Active Background enabled template smoke coverage.
- Hardened discovery output directory creation.

## 0.1.0 - 2026-05-31

- Initial personal plugin scaffold.
- Added discovery, registry generation, validation, redaction, generated Swift launcher template, and smoke tests.
