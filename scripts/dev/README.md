# Dev-only generators

## `build-kit-variants.js`

**One-time** scaffold that wrote the initial `kit/<role>/{a,b}.json` files from `design/refs/NOTES.md` composition rules.

- **Source of truth at runtime:** the JSON files under `kit/`. Nothing regenerates them at build or during `generateKitV1`.
- Re-run only if you intentionally want to overwrite kit geometry (destructive). Prefer editing `kit/**/*.json` by hand.
- Usage (dev only): `node scripts/dev/build-kit-variants.js`
