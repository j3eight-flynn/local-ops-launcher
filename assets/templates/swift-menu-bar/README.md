# __APP_NAME__

A generated native macOS menu-bar launcher for local projects.

## Build

```sh
swift build
./scripts/build-app-bundle.sh
open "dist/__APP_NAME__.app"
```

## Validate

```sh
./scripts/test-launcher-registry.sh
./scripts/release-check.sh
```

Generated at `__GENERATED_AT__`.
