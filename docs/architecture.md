# CrediFi — Architecture

An overview of how CrediFi keeps private financial data off-ledger while still
proving eligibility to a lender.

## Components

```
┌──────────────────────────── frontier ────────────────────────────┐
│                                                                  │
│  frontend/src/engine.ts        contract/src                    │
│  ┌─────────────────────────┐   ┌─────────────────────────────┐  │
│  │ CrediFiEngine           │──▶│ witnesses.ts (private state)│  │
│  │  runs compiled circuits │   └──────────────┬──────────────┘  │
│  │  in-process (vanilla)   │                  │                 │
│  └────────────┬────────────┘                  ▼                 │
│               │                    ┌─────────────────────────┐  │
│  frontend/    │                    │ compiled CrediFi        │  │
│  App.tsx ─────┤                    │ contract (credifi.compact│ │
│  wallet.ts    │                    │  + schnorr.compact)      │ │
│               │                    │  -- ZK circuit --        │  │
│  └────────────┼────────────────────┴─────────────────────────┘  │
│               │                       │                         │
│               │  mock-issuer.ts ──────┘ (signs credentials)     │
└───────────────┼─────────────────────────────────────────────────┘
                │
                ▼
      Midnight Preprod ledger
      (only binary outcomes stored)
```

- **`contract/src/credifi.compact`** — the smart contract. Defines the private
  witnesses, holder/admin key derivation, the `requestVerification` circuit, and
  admin-guarded issuer governance.
- **`contract/src/schnorr.compact`** — a module providing Schnorr verification
  over Midnight's native Jubjub curve, imported and re-exported by CrediFi.
- **`contract/src/witnesses.ts`** — the private-state type and the plugin
  witnesses that feed private inputs into the compiled circuit at proving time.
- **`contract/src/mock-issuer.ts`** — a **deterministic, browser-safe** mock of a
  trusted credential issuer that signs credentials with Schnorr over Jubjub,
  with a challenge hash string-compatible with the compiled circuit.
- **`frontend/src/engine.ts`** — `CrediFiEngine` instantiates the official
  compiled contract and runs verification in-process (vanilla execution), so the
  demo produces **genuine** eligibility results from real contract logic.
- **`frontend/src/App.tsx`** — the demo dashboard: connect wallet → credential →
  lender requirement → outcome.

## Ledger state (public)

```text
contractAdmin:         AdminPublicKey
issuers:               Map<Uint<16>, JubjubPoint>
verificationResults:   Map<Bytes<32>, Map<Uint<16>, VerificationResult>>
```

`VerificationResult` stores only **binary** decisions:

```text
minimumIncome:             Uint<16>   (the lender's own threshold — public)
requireNoDefault:          Boolean
incomeSatisfied:           Boolean
defaultRequirementSatisfied: Boolean
eligible:                  Boolean
lenderRef:                 Opaque<string>
```

No income value, default flag, signature, or secret is ever stored here.

## Private witnesses

```text
getCredentialWitness(): [monthlyIncome, previousDefaultFlag, signature, issuerId]
getUserSecret():        Bytes<32>
```

These run on the user's machine and never cross the public boundary. The
`requestVerification` circuit:

1. derives the holder public key from the secret,
2. verifies the issuer is registered and the Schnorr signature binds the
   credential to this specific holder (tamper-evidence + no replay),
3. evaluates `income >= minimumIncome` and the no-default requirement **in the
   circuit**,
4. discloses and stores only the binary `VerificationResult`.

## Governance

`registerIssuer` / `removeIssuer` assert `contractAdmin == deriveAdminPublicKey(getUserSecret())`
in-circuit, so only the holder of the admin secret can manage trusted issuers.

## Privacy guarantee

The contract privacy tests serialize every public value reachable in the ledger
and assert the exact income and signature material are absent, and that distinct
users are keyed by 32-byte identity hashes rather than plaintext identifiers.

## On-chain path

Real on-chain submission needs a **proof server** (Docker + `midnight_bn254`)
and a funded Preprod wallet, and wiring the provider stack (wallet provider,
midnight provider, effect-style compiled contract binding) required by
`midnight-js-contracts 4.x`. See [Deployment](./deploy-onchain.md). Until then
the demo runs the compiled contract in-process and the deploy CLI reports true
readiness rather than a fabricated address.
