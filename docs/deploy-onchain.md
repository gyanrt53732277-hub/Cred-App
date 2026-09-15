# CrediFi — Midnight Preprod Deployment Guide

## Deployment State

**Current state:** Deployment is performed only after a genuine `deployContract()` transaction completes successfully.

The deployment CLI is intentionally designed with a **preflight-first workflow**. Running the command normally performs validation only. A real transaction is submitted exclusively when the operator explicitly enables deployment with:

```bash
DEPLOY_CONFIRM=true npm run deploy
```

No contract address is generated, stored, or reported unless the blockchain deployment actually succeeds.

---

## Deployment Safety

The default behavior of:

```bash
npm run deploy
```

is non-destructive.

Before submitting anything, the CLI validates the required infrastructure, compiled artifacts, wallet configuration, network connectivity, and deployment prerequisites.

A transaction is allowed only when:

```bash
DEPLOY_CONFIRM=true
```

is explicitly provided.

Because an actual Preprod deployment consumes **DUST**, this additional confirmation acts as a deliberate authorization step.

The verification command remains read-only:

```bash
npm run verify
```

---

## Required Infrastructure

A successful deployment depends on the following components.

### 1. Midnight Proof Server

CrediFi requires a running `midnight_bn254` proof service to produce the required zero-knowledge proofs.

Start it with:

```bash
docker run -p 6300:6300 midnightntwrk/proof-server:8.1.0 midnight-proof-server -v
```

The application expects the service at:

```text
http://127.0.0.1:6300
```

through the `PROOF_SERVER_URL` configuration.

You can check its health endpoint before deployment:

```text
http://127.0.0.1:6300/health
```

### 2. ZK Compilation Artifacts

The deployment requires generated proving artifacts under:

```text
contract/src/managed/credifi/
```

The relevant directories are:

```text
keys/
zkir/
contract/
```

Regenerate them with:

```bash
npm run contract:compile
```

### 3. Preprod Indexer

The deployment process connects to the Midnight Preprod indexer:

```text
https://indexer.preprod.midnight.network/api/v4/graphql
```

### 4. Funded Deployment Wallet

A valid Preprod wallet must be supplied through environment variables.

Credentials are never embedded in the source code or committed to the repository.

The deployment wallet must have the required **tNIGHT** balance and be configured for **tDUST** generation.

---

## Environment Configuration

Create the deployment environment from the provided template:

```text
.env.preprod.example
        ↓
.env.preprod
```

The resulting `.env.preprod` file is ignored by Git.

### Supported Variables

| Variable                    | Purpose                                             |
| --------------------------- | --------------------------------------------------- |
| `MIDNIGHT_PREPROD_SEED`     | 64-character hexadecimal seed representing 32 bytes |
| `MIDNIGHT_PREPROD_MNEMONIC` | 24-word BIP-39 recovery phrase                      |
| `PRIVATE_STATE_PASSWORD`    | Password used to encrypt the private-state database |
| `DEPLOY_CONFIRM`            | Must equal `true` to authorize an actual deployment |

Only **one** wallet credential method should be configured:

```text
MIDNIGHT_PREPROD_SEED
```

or:

```text
MIDNIGHT_PREPROD_MNEMONIC
```

Both must not be supplied simultaneously.

The private-state password must contain at least 16 characters and use at least three character categories.

---

## Wallet & DUST Requirements

Before submitting a transaction, verify that the deployment wallet:

* Has sufficient **tNIGHT**
* Has an available unshielded address
* Is registered for **tDUST** generation
* Can cover the DUST required for deployment

If these requirements are not satisfied, the deployment can fail with:

```text
Wallet.InsufficientFunds
```

The CLI reports the wallet's unshielded address and current balances during the readiness checks.

NIGHT registration for DUST generation may also be performed automatically, but this operation is protected by the same explicit:

```bash
DEPLOY_CONFIRM=true
```

authorization.

---

## Credential Protection

CrediFi does **not** use the legacy:

```text
DEPLOYER_SEED
```

configuration.

If `DEPLOYER_SEED` is detected in the environment, the deployment process rejects the configuration rather than treating it as a valid wallet credential.

This prevents an outdated credential from accidentally being used for a real deployment.

---

# Deployment Procedure

## Step 1 — Start the Proof Server

Launch the Midnight proof server:

```bash
docker run -p 6300:6300 midnightntwrk/proof-server:8.1.0 midnight-proof-server -v
```

Then confirm that:

```text
http://127.0.0.1:6300/health
```

is responding correctly.

---

## Step 2 — Rebuild Contract Artifacts

Compile the contract before deployment:

```bash
npm run contract:compile
```

This ensures that the generated ZK artifacts correspond to the current contract source.

---

## Step 3 — Configure the Wallet

Create:

```text
.env.preprod
```

from:

```text
.env.preprod.example
```

Then provide your own funded Preprod wallet credentials and private-state password.

---

## Step 4 — Run the Safe Preflight

Start with:

```bash
npm run deploy
```

At this stage, the CLI only performs readiness checks.

**No blockchain transaction is submitted.**

---

## Step 5 — Authorize the Real Deployment

Only after every preflight check passes should the operator execute:

```bash
DEPLOY_CONFIRM=true npm run deploy
```

This explicitly enables the real on-chain submission.

---

## Step 6 — Record the Contract Address

When `deployContract()` completes successfully, the resulting contract address is written to:

```text
contract/src/config.ts
frontend/src/config.ts
docs/contract-address.txt
```

The address is **never generated or populated before a successful deployment result is received**.

---

## Step 7 — Verify the Deployment

Run:

```bash
npm run verify
```

The verification process reads the deployed contract's on-chain state without submitting a transaction.

---

# Midnight Provider Architecture

The deployment implementation connects the CrediFi application to the Midnight Preprod network through the following provider stack:

| Provider         | Implementation              | Responsibility                           |
| ---------------- | --------------------------- | ---------------------------------------- |
| Private State    | `levelPrivateStateProvider` | Encrypted local LevelDB state            |
| Public Data      | `indexerPublicDataProvider` | Preprod GraphQL and WebSocket data       |
| ZK Configuration | `NodeZkConfigProvider`      | Loads `keys/` and `zkir/` artifacts      |
| Proof            | `httpClientProofProvider`   | Communicates with local proof server     |
| Wallet           | `CrediFiWalletProvider`     | Connects the synced wallet               |
| Midnight         | `CrediFiWalletProvider`     | Handles Midnight transaction interaction |

The deployment uses:

```text
midnight-js-contracts 4.1.1
wallet-sdk 1.2.0
```

The CrediFi contract is initialized using:

```text
CompiledContract.make("credifi", Contract)
```

along with the required CrediFi witnesses and:

```text
withCompiledFileAssets
```

This follows the provider and compiled-contract structure expected by the Midnight JS Contracts 4.x workflow.

---

# Deployment Integrity Rules

The following safeguards are intentionally enforced:

* ✅ The default deployment command performs a preflight.
* ✅ Real deployment requires explicit `DEPLOY_CONFIRM=true`.
* ✅ `deployContract()` must genuinely succeed before an address is recorded.
* ✅ No fabricated contract address is accepted.
* ✅ Wallet credentials remain environment-based.
* ✅ Private credentials are not hard-coded into the repository.
* ✅ The legacy `DEPLOYER_SEED` variable is rejected.
* ✅ `npm run verify` performs read-only verification.
* ✅ DUST-consuming operations require explicit deployment authorization.

**CrediFi treats deployment as a real blockchain operation rather than a simulated or documentation-only process.**
