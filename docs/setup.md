# CrediFi — Setup Guide

This guide details the environment used to build and run CrediFi. It documents
the verified local toolchain and how CI reproduces it.

## Verified toolchain

| Component           | Version                 | Notes                                             |
| ------------------- | ----------------------- | ------------------------------------------------- |
| Node.js             | v22.23.2                | project requires `>= 22`                          |
| npm                 | 10.9.8                  | workspaces (`contract`, `frontend`)               |
| Cargo               | 1.97.1                  | not required for the TS demo                      |
| git                 | 2.43.0                  |                                                   |
| `@midnight-ntwrk/compact-runtime` | `0.16.0`  | pinned — do not upgrade                         |
| Midnight JS packages | `4.1.1`                | pinned across all `@midnight-ntwrk/midnight-js-*` |
| `wallet-sdk`        | `1.2.0`                 | pinned                                           |
| Compact devtools    | `0.5.2`                 | the `compact` CLI wrapper                         |
| Compact compiler    | `0.31.1`                | `compactc`, language **0.22 – 0.23**              |

> Do **not** upgrade/downgrade `compact-runtime` (0.16.0) or the Midnight JS
> packages (4.1.1); the generated compact-runtime code and the compiled contract
> are version-sensitive.

## 1. Install Compact

```bash
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh

# macOS/Linux: add the binary to PATH
export PATH="$HOME/.compact/bin:$PATH"

# Install the compiler matching the contract's language version
compact update 0.31.1

# Verify
compact --version          # e.g. 0.5.2 (devtools)
compact compile --version  # e.g. 0.31.1 (compiler)
```

## 2. Install dependencies

```bash
npm install
```

This installs all workspaces and generates the root lockfile. The contract uses
the configured npm `overrides` / `resolutions` to keep `smoldot` stubbed and pin
`@midnight-ntwrk/ledger-v8`/`network-id`.

## 3. Compile the contract

```bash
npm run contract:compile
```

This runs `compact compile src/credifi.compact src/managed/credifi` in the
contract workspace. It regenerates:

- `contract/src/managed/credifi/contract/index.js` + `.d.ts` (JS bindings)
- `contract/src/managed/credifi/zkir/` (zero-knowledge circuit artifacts)

These are **git-ignored** and must exist before building/testing the frontend.

### Compact source notes

- `credifi.compact` uses `pragma language_version >= 0.22 && <= 0.23;`.
- Domain-separated persistent hashes use quoted string prefixes with exact byte
  sizes: `"credifi:holder:pk:v1"` (→ `Bytes<20>`) and `"credifi:admin:pk:v1"`
  (→ `Bytes<19>`).
- The ledger-map API available in this runtime is `size()`, `member()`,
  `lookup()` (no iteration), which the contract's `requestVerification` relies on.

## 4. Build & test

```bash
npm run build            # contract build + frontend build
npm run contract:test    # 17 contract tests (eligibility + privacy)
npm run frontend:test    # engine (node) + app smoke (jsdom) tests
npm run contract:typecheck
npx tsc --noEmit --project frontend/tsconfig.json
```

### Known local-environment test caveats

- **jsdom App tests are slow locally**: loading the jsdom environment can take
  ~88s on this machine, which can exceed Vitest's hardcoded 90s
  `WORKER_START_TIMEOUT`. The two App smoke tests have been verified to pass with
  a patched timeout and **pass on CI's fast filesystem**.
- **compact-runtime WASM in jsdom**: the WASM runtime rejects `Uint8Array`
  across the JS boundary inside jsdom's realm
  (`invalid type: JsValue(Uint8Array), expected byte array`). The full
  verification path is therefore covered by the **node-environment** engine tests
  (`frontend/src/test/engine.test.ts`), which run the real compiled contract.

## 5. Run the demo

```bash
npm run frontend:dev   # http://localhost:5173
```

The app connects a simulated wallet, accepts a financial credential, applies a
lender requirement, and runs the genuine compiled contract in-process to return
an eligibility verdict.

## CI

The GitHub Actions workflow (`.github/workflows/ci.yml`) reproduces this exact
sequence: install Compact devtools + compiler 0.31.1, `npm ci`, compile the
contract, then typecheck/test/build both workspaces. See
[Deployment](./deploy-onchain.md) for the on-chain prerequisites.
