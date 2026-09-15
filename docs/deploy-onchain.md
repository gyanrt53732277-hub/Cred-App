# CrediFi — On-Chain Deployment (Midnight Preprod)

> **Status: NOT DEPLOYED YET until a real `deployContract()` transaction succeeds.**
> This document describes the deployed infrastructure: the CLI now performs a
> REAL Preprod deployment when all preconditions are met **and** the operator
> explicitly sets `DEPLOY_CONFIRM=true`. Without that flag it only runs a safe
> readiness preflight and **never** submits a transaction or fabricates an address.

## How the deploy CLI is protected

`npm run deploy` is a **safe preflight by default**. It checks that everything
needed for a genuine deployment is present and prints a truthful report. It
**will not** submit anything unless you set:

```bash
DEPLOY_CONFIRM=true npm run deploy
```

A real deployment is an on-chain submission that costs **DUST**, so this
explicit confirmation is required. `verify` is always read-only.

## What a real deployment requires

1. **A running proof server** — `midnight_bn254` generates real ZK proofs. It
   runs via Docker:
   ```bash
   docker run -p 6300:6300 midnightntwrk/proof-server:8.1.0 midnight-proof-server -v
   ```
   CrediFi points the client at `http://127.0.0.1:6300` (`PROOF_SERVER_URL`).
2. **Compiled ZK artifacts** — generated under `contract/src/managed/credifi/`
   (`keys/`, `zkir/`, `contract/`) by `npm run contract:compile`.
3. **A reachable Preprod indexer** — `https://indexer.preprod.midnight.network/api/v4/graphql`.
4. **A funded Preprod wallet** whose credentials come **only from the
   environment** (never committed, never the legacy `DEPLOYER_SEED`).

## Credentials (environment only)

Copy `.env.preprod.example` to `.env.preprod` (git-ignored) and set:

| Variable | Meaning |
| --- | --- |
| `MIDNIGHT_PREPROD_SEED` | 64 hex chars (32 bytes) — set **one** of seed/mnemonic |
| `MIDNIGHT_PREPROD_MNEMONIC` | 24-word BIP-39 phrase — set **one** of seed/mnemonic |
| `PRIVATE_STATE_PASSWORD` | encrypts the private-state store (≥16 chars, ≥3 char classes) |
| `DEPLOY_CONFIRM` | exactly `true` to permit the real on-chain submission |

The wallet must hold **tNIGHT** (from the Preprod faucet) and be registered for
**tDUST** generation, otherwise submission fails with `Wallet.InsufficientFunds`.
The deploy CLI prints the wallet's unshielded address and balances, and can
register NIGHT for DUST automatically (this, too, is gated by `DEPLOY_CONFIRM`).

The legacy `DEPLOYER_SEED` sentence is **rejected outright** — if it is present
in the environment the CLI refuses to deploy, so it can never be mistaken for a
funded credential.

## Typical flow

1. Start the proof server (Docker) and confirm `http://127.0.0.1:6300/health`.
2. `npm run contract:compile` to ensure artifacts match the source.
3. Create `.env.preprod` from the example with your funded wallet + password.
4. **Safe preflight** (submit nothing):
   ```bash
   npm run deploy
   ```
5. When the report is all-OK, run the **real deployment**:
   ```bash
   DEPLOY_CONFIRM=true npm run deploy
   ```
6. On success the **real** contract address is written to:
   - `contract/src/config.ts` → `CONTRACT_ADDRESS`
   - `frontend/src/config.ts` → `CONTRACT_ADDRESS`
   - `docs/contract-address.txt`
   This only ever happens after `deployContract()` actually resolves.
7. `npm run verify` reads the on-chain state of the deployed address (read-only).

## Provider stack (implemented)

The deploy path wires all six Midnight providers against real Preprod endpoints
using `midnight-js-contracts` 4.1.1 / wallet-sdk 1.2.0:

- `privateStateProvider` — `levelPrivateStateProvider` (encrypted LevelDB)
- `publicDataProvider` — `indexerPublicDataProvider` (Preprod GraphQL + WS)
- `zkConfigProvider` — `NodeZkConfigProvider` (reads `keys/`, `zkir/`)
- `proofProvider` — `httpClientProofProvider` (local `:6300`)
- `walletProvider` + `midnightProvider` — `CrediFiWalletProvider` wrapping the
  synced `WalletFacade`

The contract is bound with `CompiledContract.make("credifi", Contract)`, the
CrediFi witnesses, and `withCompiledFileAssets`, matching the official
`midnight-js-contracts` 4.x guide.

## Not done here

- ❌ No `CONTRACT_ADDRESS` filled with a made-up value.
- ❌ No "deployed successfully" claim without a real `deployContract()` result.
- ❌ No wallet credential is hard-coded, printed, or committed.
- ❌ `DEPLOYER_SEED` is never used as a real credential.
