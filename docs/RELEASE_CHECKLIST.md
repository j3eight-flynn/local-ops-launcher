# Release Checklist

Run before sharing the plugin:

```sh
node ~/plugins/local-ops-launcher/scripts/validate-plugin-manifest.mjs
node ~/plugins/local-ops-launcher/scripts/test-plugin.mjs
node ~/plugins/local-ops-launcher/scripts/test-negative-cases.mjs
node ~/plugins/local-ops-launcher/scripts/validate-registry.mjs --registry ~/plugins/local-ops-launcher/assets/sanitized-example-registry.json --allow-missing-paths
node ~/plugins/local-ops-launcher/scripts/package-plugin.mjs
```

Review `dist/local-ops-launcher.tar.gz` before distribution.
