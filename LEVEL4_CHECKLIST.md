# CrediFi — Level 4 Builder Checklist

Status legend:
- **PASS** — verified complete
- **BLOCKED** — cannot proceed with current environment/resources
- **MANUAL ACTION REQUIRED** — needs a real human/resource action not automatically
  verifiable here (no results fabricated)

## Core MVP

| Item | Status | Evidence / Note |
| ---- | ------ | --------------- |
| Repository initialized on `main` | **PASS** | clean git history |
| npm workspace (contract + frontend) | **PASS** | root `package.json` workspaces |
| Compact contract compiles | **PASS** | `npm run contract:compile` regenerates managed bindings + zkir |
| Contract typechecks | **PASS** | `tsc --noEmit` |
| Contract tests | **PASS** | 17/17 (eligibility + privacy) |
| Contract build | **PASS** | `tsc` + copy managed artifacts |
| Frontend typecheck | **PASS** | `tsc --noEmit` |
| Frontend build | **PASS** | `vite build` (wasm + esnext) |
| Frontend engine tests | **PASS** | 7/7 (node env) |
| Frontend smoke tests | **PASS** | 2/2 (jsdom; see caveat in `docs/setup.md`) |
| 15 meaningful commits | **PASS** | verified via `git log` |

## CI/CD

| Item | Status | Evidence / Note |
| ---- | ------ | --------------- |
| `.github/workflows/ci.yml` exists | **PASS** | compiles contract, tests + builds both workspaces |
| CI run status | **MANUAL ACTION REQUIRED** | workflow authored; requires push to GitHub to observe a real run (no CI result fabricated) |

## Documentation

| Item | Status | Evidence / Note |
| ---- | ------ | --------------- |
| README (overview, problem, solution, architecture, setup, usage, testing, CI/CD, deployment, contract address, X profile, demo) | **PASS** | see `README.md` |
| `docs/setup.md` | **PASS** | toolchain + local caveats |
| `docs/architecture.md` | **PASS** | contract/witness/engine design |
| `docs/mvp-scope.md` | **PASS** | five attestation approaches |
| `docs/deploy-onchain.md` | **PASS** | on-chain procedure |

## Preprod deployment

| Item | Status | Evidence / Note |
| ---- | ------ | --------------- |
| Deployment on Midnight Preprod | **BLOCKED** | requires running proof server (`midnight_bn254`, needs Docker engine) + funded Preprod wallet + provider wiring |
| Real contract address set | **BLOCKED** | `CONTRACT_ADDRESS` remains placeholder (`TODO_PASTE_DEPLOYED_CONTRACT_ADDRESS_AFTER_DEPLOY`); no fake address recorded |

## External deliverables

| Item | Status | Evidence / Note |
| ---- | ------ | --------------- |
| X / Twitter profile | **MANUAL ACTION REQUIRED** | not yet created; no fabricated handle/URL |
| Demo video | **MANUAL ACTION REQUIRED** | not produced; no fabricated video URL |

## Final audit

| Item | Status | Evidence / Note |
| ---- | ------ | --------------- |
| Final Level 4 audit | **PENDING** | after the above manual actions complete |

---
Last updated: 2026-08-31. Statuses reflect the verified repository state and are
**never fabricated**.
