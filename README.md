# CrediFi — Privacy-Preserving Loan Eligibility & Risk Verification on Midnight


🐦 **Follow the build:** https://x.com/CrediFiApp

CrediFi is a **Level 4 Midnight Builder** project. It lets a user prove to a
lender that a *verified* financial credential satisfies a lending requirement —
**income ≥ minimumIncome** and **no previous default** — without ever revealing
the exact income or the private financial history.

The eligibility evaluation runs entirely inside a **zero-knowledge circuit**.
Only the *outcome* (which requirements were satisfied and whether the user is
eligible) is written to the ledger. The exact income and the previous-default
flag are **witness-only** and never cross the private/public boundary.

> **Deployment status:** **DEPLOYED — LIVE on Midnight Preprod.** Contract:
> `82f0731b0b4c5c81c44e0c14b21a2c1ee930a13109df422cf8b60bf954ee0c0b`
> (finalized in block `2418897`). See
> [Preprod deployment](#preprod-deployment--contract-address) for the on-chain
> explorer link and details.

---

## Demo video

> **Level 4 reviewers:** watch the CrediFi demo walkthrough here:
>
> [▶ Watch the CrediFi Demo](https://youtu.be/Iemfqh_MUbs)
>
> *(Demo walkthrough of the CrediFi loan-eligibility flow.)*

---

## Problem statement

Lending decisions depend on sensitive financial facts — income, credit history,
and whether an applicant has previously defaulted. Sharing this data directly
with a lender is invasive and creates large attack surface: the very facts a
user needs to keep private are the ones a lender asks for.

CrediFi addresses the question: *how can a lender verify loan eligibility and
risk without the applicant having to reveal their exact income or private
financial history?*

Borrowers deserve mainstream financial services — access to credit — without
surrendering their most sensitive data to every lender they apply to.

## Solution

CrediFi lets an applicant prove to a lender that a **verified** financial
credential satisfies a lending requirement using a **zero-knowledge proof** on
the Midnight Network. The evaluation (income ≥ threshold, no prior default) runs
entirely **inside the ZK circuit** on private witnesses. The lender can verify
with confidence that the signed credential came from a trusted issuer and meets
the criteria, while the applicant reveals **only** a yes/no eligibility summary.

- Built in [Compact](https://docs.midnight.network/compact), Midnight's
  privacy-preserving smart-contract language.
- Credentials are signed by a trusted issuer with Schnorr signatures over
  Jubjub and verified in-circuit (tamper-evident + non-replayable).
- Only binary outcome flags are written to the ledger; the exact income and
  default flag never cross the private/public boundary.

---

## Highlights

- **Private-by-design contract** written in [Compact](https://docs.midnight.network/compact),
  verified by 17 contract tests proving both the eligibility matrix **and** that
  witness inputs stay off-ledger.
- **Schnorr attestations over Jubjub** signed by a deterministic mock credential
  issuer and verified **inside the ZK circuit** (`schnorr.compact`).
- **Tamper-evident binding**: each credential is cryptographically bound to the
  holder's derived identity, so signatures cannot be replayed or reused.
- **Admin-guarded governance**: only the contract admin can register/remove
  trusted issuers (enforced in-circuit).
- **Demo web app** that runs the **official compiled contract** in-process to
  produce genuine results — no fabricated outcomes.
- **CI/CD** (.github/workflows) that compiles the contract, regenerates ZK
  bindings, and runs all tests/builds on every push.

---

## Tech stack

- **Smart contract:** [Compact](https://docs.midnight.network/compact)
  (`credifi.compact` + `schnorr.compact`), compiled to ZK IR with the Compact
  devtools (0.31.1).
- **Contract SDK:** `@midnight-ntwrk/compact-runtime`,
  `midnight-js-contracts`, `wallet-sdk` — wired to the Midnight Preprod indexer
  and RPC.
- **Cryptography:** Schnorr signatures over Jubjub, verified in-circuit.
- **Backend runtime:** Node.js ≥ 22, TypeScript.
- **Frontend:** React + Vite demo web app running the compiled contract
  in-process.
- **CI/CD:** GitHub Actions (`.github/workflows/ci.yml`).

---

## Repository layout

```
.
├── package.json               # npm workspaces + top-level scripts
├── contract/                  # Midnight smart contract (Compact)
│   ├── src/
│   │   ├── credifi.compact    # main CrediFi contract
│   │   ├── schnorr.compact    # Schnorr verification module
│   │   ├── witnesses.ts       # private-state witnesses
│   │   ├── mock-issuer.ts     # deterministic mock credential issuer
│   │   ├── config.ts          # Preprod runtime config
│   │   ├── deploy.ts          # honest deploy/verify preflight CLI
│   │   └── test/              # eligibility + privacy unit tests
│   └── tsconfig*.json
├── frontend/                  # React + Vite demo web app
│   └── src/
│       ├── engine.ts          # runs the compiled contract in-process
│       ├── App.tsx            # demo dashboard UI
│       ├── wallet.ts          # simulated wallet connectivity
│       └── test/              # engine + app smoke tests
├── docs/                      # setup, architecture, deployment
└── .github/workflows/ci.yml   # CI pipeline
```

> `contract/src/managed/` holds automatically generated Compact bindings and ZK
> artifacts and is **git-ignored** — regenerate with `npm run contract:compile`.

---

## Prerequisites

- **Node.js ≥ 22** and npm
- The **Compact devtools + compiler** (see [Installation](https://docs.midnight.network/getting-started/installation)):
  ```bash
  curl --proto '=https' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh
  compact update 0.31.1   # match the contract language version
  ```
- For **on-chain** deployment only: a running proof server (Docker +
  `midnight_bn254`) and a funded Preprod wallet.

---

## Getting started

```bash
# 1. Install workspace dependencies
npm install

# 2. Compile the Compact contract (regenerates managed bindings + zkir)
npm run contract:compile

# 3. Run the contract tests (17 tests: eligibility + privacy)
npm run contract:test

# 4. Build both packages
npm run build

# 5. Run the frontend engine tests
npm run frontend:test

# 6. Start the demo web app
npm run frontend:dev
```

### Top-level scripts

| Script                   | Description                                          |
| ------------------------ | ---------------------------------------------------- |
| `npm run contract:compile` | Compile `contract.compact` into `src/managed`      |
| `npm run contract:test`    | Run the contract unit tests                        |
| `npm run contract:build`   | Build the contract package (tsc + copies artifacts) |
| `npm run frontend:test`    | Run the frontend engine + app tests                |
| `npm run frontend:build`   | Build the web app for production                   |
| `npm run build`            | Build both packages                                |
| `npm run deploy`           | Preflight for Preprod deployment (readiness report) |
| `npm run verify`           | Preflight + deploy-status report                   |

---

## How the privacy works

1. A trusted credential issuer signs the user's financial data
   (`monthlyIncome`, `previousDefault`, `holderHash`) with a Schnorr signature
   over Midnight's native Jubjub curve.
2. The user connects a wallet, supplies their (private) credential, and requests
   verification against a lender-defined requirement.
3. Inside the Midnight ZK circuit, CrediFi checks the issuer is registered and
   the signature is valid, then evaluates **income ≥ minimumIncome** and the
   no-default requirement — all on **private witnesses**.
4. Only the **binary eligibility summary** (boolean flags + the lender's own
   threshold) is disclosed and stored in the ledger, keyed by the holder's
   derived, unlinkable identity hash.

A user's exact income is never serialized into any ledger field, result record,
or proof. This is enforced and proven by the contract privacy tests.

---

## Documentation

- [Setup guide](./docs/setup.md) — detailed environment setup
- [Architecture](./docs/architecture.md) — contract, witnesses, engine design
- [MVP scope](./docs/mvp-scope.md) — the five attestation approaches delivered
- [Deployment (Preprod)](./docs/deploy-onchain.md) — how a real on-chain
  deployment is performed (proof-server prerequisites, wallet, wiring)

---

## Roadmap / deferred

- ~~**Real on-chain deployment** on Preprod~~ — **DONE:** contract live on
  Preprod at `82f0731b0b4c5c81c44e0c14b21a2c1ee930a13109df422cf8b60bf954ee0c0b`;
  `CONTRACT_ADDRESS` is set in the configs (see
  [Preprod deployment](#preprod-deployment--contract-address)).
- **Lace wallet** integration for genuine on-chain submissions.
- Issuer runs as a trusted **backend service** (the mock issuer's deterministic
  secret is simulation-only and must never live in client code).

---

## Testing

The core guarantees — correctness **and** privacy — are verified continuously:

- **Contract tests (17)** in `contract/src/test/`:
  - `eligibility.test.ts` — the full eligibility matrix, multi-lender records,
    issuer authentication, and admin governance.
  - `privacy.test.ts` — proves the exact income, default flag, and signature
    material never appear in any serialized public state, and that distinct
    users are keyed by 32-byte identity hashes.
- **Frontend engine tests (7)** in `frontend/src/test/engine.test.ts` — re-run
  the same matrix through the actual compiled contract in a node environment
  (needed because the WASM runtime does not run inside jsdom), plus a privacy
  guarantee on the returned outcome shape.
- **App smoke tests (2)** in `frontend/src/test/App.test.tsx` — the dashboard
  renders all sections and the simulated wallet connects.

```bash
npm run contract:test   # 17 tests
npm run frontend:test   # engine + app smoke tests
```

## CI/CD

A GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push to
`main` and pull request:

[![CI](https://github.com/gyanrt53732277-hub/credifi-midnight-level4/actions/workflows/ci.yml/badge.svg)](https://github.com/gyanrt53732277-hub/credifi-midnight-level4/actions/workflows/ci.yml)

1. Installs the pinned Compact devtools + compiler (0.31.1).
2. `npm ci`, then compiles the Compact contract to regenerate the managed
   bindings and zkir artifacts.
3. Runs contract typecheck / test / build.
4. Runs frontend typecheck / build / test.

This mirrors the validated local toolchain so every change is verified against
real compiled contract artifacts.

## Demo

Run the local, in-browser demo of the official compiled contract:

```bash
npm run frontend:dev   # http://localhost:5173
```

The dashboard guides you through **connect wallet → financial credential →
lender requirement → outcome**, computing genuine eligibility results from the
real compiled circuit (the exact income stays witness-only). See
[▶ Demo video](#demo-video) for the walkthrough.

## Preprod deployment & contract address

**Status: DEPLOYED.** The CrediFi contract is live on Midnight **Preprod** and
was verified on-chain (contract state readable through the Preprod indexer;
contract admin present). It was deployed with a single
`DEPLOY_CONFIRM=true npm run deploy` run — the address below comes from the real
`deployContract()` result, never fabricated.

| Field                  | Value |
| ---------------------- | ------------------------------------------------------------ |
| Network                | Midnight **Preprod** |
| Contract address       | `82f0731b0b4c5c81c44e0c14b21a2c1ee930a13109df422cf8b60bf954ee0c0b` |
| Deployment transaction | `60f0ddeed366d71c9de496c538ceedc79be695c73ab7841874824cdf46351943` |
| Finalized block        | `2418897` |
| Deployment status      | **DEPLOYED** |

**Explorer:** [View the deployed CrediFi contract on the Midnight Preprod explorer](https://preprod.midnightexplorer.com/contracts/82f0731b0b4c5c81c44e0c14b21a2c1ee930a13109df422cf8b60bf954ee0c0b)

### Deployment screenshot

![CrediFi deployed on Midnight Preprod](./screenshots/preprod-deployment.png)

`CONTRACT_ADDRESS` was written to `contract/src/config.ts` and
`frontend/src/config.ts`, and the address recorded in `docs/contract-address.txt`,
only after the on-chain read-back of the deployed contract state succeeded.

## X (Twitter) profile

🐦 **Follow the build:** https://x.com/CrediFiApp
(also linked at the top of this README).

---

## Honesty note

This repository does **not** fabricate deployment results. A genuine Preprod
deployment now exists, and `CONTRACT_ADDRESS` (in `contract/src/config.ts` and
`frontend/src/config.ts`) plus `docs/contract-address.txt` contain the real
address taken from the successful `deployContract()` result after on-chain
verification. All results shown by the demo are computed by the **real compiled
contract**, not mocked.

## License

Private project — internal use for the Midnight Builder Level 4 milestone.
