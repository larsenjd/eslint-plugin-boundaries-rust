# eslint-plugin-boundries-rust

Rust-powered ESLint 9+ boundaries plugin with upstream parity testing against `eslint-plugin-boundaries`.

## Status

- ESLint 9+ flat config support
- Rule surface compatible with `boundaries/*` rule names
- Strict parity suite against upstream plugin for current fixture matrix
- TypeScript monorepo coverage: path aliases, workspace-style aliases, and project references
- Native prebuild release workflow (`.github/workflows/release-prebuilds.yml`) with source-build fallback via `postinstall`

## Install

```bash
pnpm add -D eslint-plugin-boundries-rust eslint-import-resolver-typescript
```

## Usage (ESLint 9 flat config)

```js
const boundaries = require("eslint-plugin-boundries-rust");

module.exports = [
  {
    files: ["**/*.ts"],
    plugins: { boundaries },
    settings: {
      "import/resolver": {
        typescript: {
          project: ["./tsconfig.json"]
        }
      },
      "boundaries/elements": [
        { type: "feature", mode: "file", pattern: "src/feature/*.ts" },
        { type: "shared", mode: "file", pattern: "src/shared/*.ts" }
      ]
    },
    rules: {
      "boundaries/element-types": [
        "error",
        {
          default: "allow",
          rules: [{ from: "feature", disallow: ["shared"] }]
        }
      ]
    }
  }
];
```

## Test commands

- `pnpm run test:impl`: implementation behavior suite
- `pnpm run test:parity`: upstream parity suite (non-blocking drift logs)
- `pnpm run test:parity:strict`: upstream parity hard gate
- `pnpm run test:smoke:pack`: pack/install smoke test for published artifact behavior

## Native distribution

- CI release job builds platform binaries and publishes platform packages via `napi prepublish`.
- Local fallback remains available: if no prebuilt package is available, `postinstall` builds from source (`napi build --cargo-cwd native --release`).
