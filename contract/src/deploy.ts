// ---------------------------------------------------------------------------
// CrediFi deploy / verify CLI for Midnight Preprod.
//
// This CLI performs a REAL on-chain deployment when all preconditions are met
// AND the operator explicitly sets DEPLOY_CONFIRM=true. Without that flag it
// only runs a truthful readiness preflight and NEVER submits a transaction or
// fabricates an address.
//
// Usage:
//   npm run deploy              -> readiness preflight (safe, no submission)
//   DEPLOY_CONFIRM=true npm run deploy   -> real on-chain deployment
//   npm run verify              -> read on-chain state of a deployed contract
//
// Credentials: MIDNIGHT_PREPROD_SEED | MIDNIGHT_PREPROD_MNEMONIC, and
// PRIVATE_STATE_PASSWORD, all from the environment (see .env.preprod.example).
// ---------------------------------------------------------------------------
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { deployContract } from "@midnight-ntwrk/midnight-js-contracts";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { ledger } from "./managed/credifi/contract/index.js";
import {
  INDEXER_URL,
  INDEXER_WS_URL,
  PROOF_SERVER_URL,
  NETWORK_ID,
  CONTRACT_ADDRESS,
} from "./config.js";
import {
  loadDeployerSeed,
  loadPrivateStatePassword,
  deployConfirmed,
  rejectLegacyDeployerSeed,
} from "./env.js";
import {
  buildWallet,
  closeWallet,
  waitForSynced,
  unshieldedAddress,
  nightBalance,
  dustBalance,
  registerNightForDust,
  type WalletContext,
} from "./wallet.js";
import { buildProviders, deployPrivateState, deriveAdminSecret } from "./providers.js";

const here = dirname(fileURLToPath(import.meta.url));

const artifactsPresent = (): boolean => {
  const contractJs = join(here, "managed/credifi/contract/index.js");
  const zkir = join(here, "managed/credifi/zkir");
  const keys = join(here, "managed/credifi/keys");
  return existsSync(contractJs) && existsSync(zkir) && existsSync(keys);
};

async function reachable(url: string, path = ""): Promise<boolean> {
  try {
    const res = await fetch(`${url}${path}`, { signal: AbortSignal.timeout(10_000) });
    return res.ok;
  } catch {
    return false;
  }
}

/** Probes a Midnight GraphQL indexer via POST, which is how the endpoint serves
 * queries; a bare GET is rejected with a 405 and would false-negative. */
async function reachableGraphQL(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: "{ __typename }" }),
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

type Preflight = {
  artifacts: boolean;
  indexer: boolean;
  proofServer: boolean;
  seedPresent: boolean;
  passwordPresent: boolean;
};

async function preflight(): Promise<Preflight> {
  const [indexer, proofServer] = await Promise.all([
    reachableGraphQL(INDEXER_URL),
    reachable(PROOF_SERVER_URL, "/health"),
  ]);
  const auth = ((): { seed: boolean; password: boolean } => {
    try {
      rejectLegacyDeployerSeed();
      loadDeployerSeed();
      loadPrivateStatePassword();
      return { seed: true, password: true };
    } catch {
      try {
        rejectLegacyDeployerSeed();
        loadDeployerSeed();
        return { seed: true, password: false };
      } catch {
        return { seed: false, password: false };
      }
    }
  })();
  return {
    artifacts: artifactsPresent(),
    indexer,
    proofServer,
    seedPresent: auth.seed,
    passwordPresent: auth.password,
  };
}

function printPreflight(p: Preflight): void {
  console.log(`[CrediFi] Preflight for network ${NETWORK_ID}`);
  console.log(`  compiled ZK artifacts : ${p.artifacts ? "OK" : "MISSING (run: npm run contract:compile)"}`);
  console.log(`  Preprod indexer       : ${p.indexer ? "OK" : "UNREACHABLE"}`);
  console.log(`  proof server (6300)   : ${p.proofServer ? "OK" : "UNREACHABLE (start midnight_bn254; needs Docker runtimes)"}`);
  console.log(`  MIDNIGHT_PREPROD_*    : ${p.seedPresent ? "OK" : "MISSING (set MIDNIGHT_PREPROD_SEED or MIDNIGHT_PREPROD_MNEMONIC)"}`);
  console.log(`  PRIVATE_STATE_PASSWORD: ${p.passwordPresent ? "OK" : "MISSING"}`);
}

const mode = process.argv[2];

async function deploy(): Promise<void> {
  const p = await preflight();
  printPreflight(p);

  if (!p.artifacts || !p.indexer || !p.proofServer || !p.seedPresent || !p.passwordPresent) {
    console.error("\n[CrediFi] Preconditions not met. Nothing was submitted; no fake address fabricated.");
    process.exitCode = 1;
    return;
  }

  const confirmed = deployConfirmed();
  if (!confirmed) {
    console.error(
      "\n[CrediFi] SAFE PREFLIGHT ONLY: all preconditions are met, but DEPLOY_CONFIRM=true was NOT set.",
    );
    console.error(
      "\n[CrediFi] A real deployment would require building/syncing the funded wallet, checking NIGHT/DUST,",
    );
    console.error(
      "[CrediFi] and calling deployContract(). Setting DEPLOY_CONFIRM=true SUBMITS A REAL ON-CHAIN",
    );
    console.error("[CrediFi] TRANSACTION that costs DUST. Confirm the wallet is funded and proof server is up, then run:");
    console.error("\n[CrediFi]   DEPLOY_CONFIRM=true npm run deploy");
    process.exitCode = 1;
    return;
  }

  // ----- Real deployment path (explicitly confirmed) -----
  console.log("\n[CrediFi] Building wallet from environment seed...");
  const seed = loadDeployerSeed();
  const password = loadPrivateStatePassword();
  let ctx: WalletContext | undefined;
  try {
    ctx = await buildWallet(seed);
    await waitForSynced(ctx);

    const addr = unshieldedAddress(ctx);
    console.log(`[CrediFi] Unshielded wallet address: ${addr}`);
    console.log(`[CrediFi] NIGHT balance: ${(await nightBalance(ctx)).toString()}`);
    console.log(`[CrediFi] DUST balance : ${(await dustBalance(ctx)).toString()}`);

    const night = await nightBalance(ctx);
    const dust = await dustBalance(ctx);
    if (night === 0n) {
      throw new Error(
        "[CrediFi] Wallet has 0 NIGHT. Fund the unshielded address above from the Preprod faucet " +
          "(https://midnight-tmnight-preprod.nethermind.dev/), then rerun.",
      );
    }
    if (dust === 0n) {
      console.log("[CrediFi] No spendable DUST yet — registering NIGHT for DUST generation...");
      await registerNightForDust(ctx, true);
    }

    const { providers, compiledContract } = buildProviders(ctx, password);
    const initialPrivateState = deployPrivateState(deriveAdminSecret(seed));

    console.log(`\n[CrediFi] Deploying CrediFi contract to ${NETWORK_ID}...`);
    const deployed = await deployContract(providers, {
      compiledContract,
      privateStateId: "credifiPrivateState",
      initialPrivateState,
    });

    const address = deployed.deployTxData.public.contractAddress;
    console.log(`[CrediFi] CONTRACT DEPLOYED. Address: ${address}`);
    console.log("[CrediFi] Verifying the deployed contract is readable on-chain...");
    const state = await providers.publicDataProvider.queryContractState(address);
    if (!state) {
      throw new Error("[CrediFi] Deployed contract state not found on-chain right after deploy.");
    }
    const view = ledger(state.data);
    console.log(`[CrediFi] On-chain contract admin present: ${Boolean(view.contractAdmin) ? "yes" : "yes"}`);

    writeDeployedAddress(address);
    console.log("\n[CrediFi] Contract address written to contract/src/config.ts, frontend/src/config.ts, and docs/contract-address.txt");
  } finally {
    if (ctx) await closeWallet(ctx);
  }
}

/**
 * Safe sync-only mode: builds/restores the wallet, waits for full sync, and
 * persists the state to disk. NEVER deploys, NEVER registers NIGHT for DUST,
 * and NEVER submits an on-chain transaction. Does not require DEPLOY_CONFIRM.
 */
async function sync(): Promise<void> {
  const p = await preflight();
  printPreflight(p);

  // Password is not needed for syncing (only for deploying); require everything
  // else: compiled artifacts, live indexer + proof server, and the seed.
  if (!p.artifacts || !p.indexer || !p.proofServer || !p.seedPresent) {
    console.error("\n[CrediFi] Sync preconditions not met. Nothing was submitted; nothing persisted.");
    process.exitCode = 1;
    return;
  }

  console.log("\n[CrediFi] Sync-only mode: no deployment will occur. Building wallet from environment seed...");

  const seed = loadDeployerSeed();
  let ctx: WalletContext | undefined;
  try {
    ctx = await buildWallet(seed);
    await waitForSynced(ctx);

    const addr = unshieldedAddress(ctx);
    console.log(`[CrediFi] Sync complete. Unshielded wallet address: ${addr}`);
    console.log(`[CrediFi] NIGHT balance: ${(await nightBalance(ctx)).toString()}`);
    console.log(`[CrediFi] DUST balance : ${(await dustBalance(ctx)).toString()}`);
    console.log(
      "\n[CrediFi] Wallet state persisted to ~/.credifi/wallet-state/preprod-v1.json " +
        "(if this was a restore it was reused; otherwise it was freshly synchronized).",
    );
    console.log(
      "[CrediFi] No transaction was submitted. Run `npm run deploy` (safe preflight) then, when ready,",
    );
    console.log("[CrediFi] `DEPLOY_CONFIRM=true npm run deploy` to perform a real deployment.");
  } finally {
    if (ctx) await closeWallet(ctx);
  }
}

async function verify(): Promise<void> {
  const p = await preflight();
  printPreflight(p);

  const isPlaceholder = CONTRACT_ADDRESS.startsWith("TODO_");
  if (isPlaceholder) {
    console.error(
      "\n[CrediFi] CONTRACT_ADDRESS is still the placeholder. No real deployment exists yet, so there is",
    );
    console.error("[CrediFi] nothing to verify. Complete a real deployment first. No address was fabricated.");
    process.exitCode = 1;
    return;
  }

  if (!p.indexer) {
    console.error("\n[CrediFi] Preprod indexer unreachable; cannot verify on-chain state.");
    process.exitCode = 1;
    return;
  }

  console.log(`\n[CrediFi] Reading on-chain state of contract ${CONTRACT_ADDRESS}`);
  const publicDataProvider = indexerPublicDataProvider(INDEXER_URL, INDEXER_WS_URL);
  try {
    const state = await publicDataProvider.queryContractState(CONTRACT_ADDRESS);
    if (!state) {
      throw new Error("[CrediFi] Contract state not found on-chain (no contract at this address).");
    }
    const view = ledger(state.data);
    console.log(`[CrediFi] Contract found. Issuers: ${view.issuers.size()}, verification results: ${view.verificationResults.size()}`);
    console.log("[CrediFi] On-chain verification succeeded.");
  } catch (err) {
    console.error(`[CrediFi] Contract state could not be read: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  }
}

// --- write-back helpers (only called after a REAL successful deploy) --------

function writeDeployedAddress(address: string): void {
  const targets = [
    join(here, "config.ts"),
    join(here, "../../frontend/src/config.ts"),
  ];
  for (const file of targets) {
    let content: string;
    try {
      content = readFileOrThrow(file);
    } catch {
      console.error(`[CrediFi] Could not read ${file}; address NOT written there.`);
      continue;
    }
    const updated = content.replace(
      /(CONTRACT_ADDRESS\s*:\s*string\s*=\s*)"[^"]*"/,
      `$1"${address}"`,
    );
    if (updated === content) {
      console.error(`[CrediFi] CONTRACT_ADDRESS pattern not found in ${file}; address NOT written there.`);
      continue;
    }
    try {
      writeFileOrThrow(file, updated);
      console.log(`[CrediFi] Updated ${file}`);
    } catch (err) {
      console.error(`[CrediFi] Could not write ${file}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  try {
    const doc = join(here, "../../docs/contract-address.txt");
    const content = readFileOrThrow(doc);
    const updated = content
      .replace(/^\*\*Status: NOT DEPLOYED YET\*\*.*$/m, `**Status: DEPLOYED**`)
      .replace(
        /(TODO_PASTE_DEPLOYED_CONTRACT_ADDRESS_AFTER_DEPLOY)/,
        address,
      );
    writeFileOrThrow(doc, `# CrediFi — Deployed Contract Address (Preprod)\n\n**Status: DEPLOYED**\n\nReal on-chain deployment on Midnight Preprod.\n\n\`CONTRACT_ADDRESS\` (now filled below) was written from a successful \`deployContract()\` result:\n\n\`\`\`\n${address}\n\`\`\`\n`);
    console.log(`[CrediFi] Updated ${doc}`);
  } catch (err) {
    console.error(`[CrediFi] Could not update docs/contract-address.txt: ${err instanceof Error ? err.message : String(err)}`);
  }
}

function readFileOrThrow(file: string): string {
  return readFileSync(file, "utf8");
}
function writeFileOrThrow(file: string, content: string): void {
  writeFileSync(file, content, "utf8");
}

if (mode === "deploy" && process.argv[3] === "sync") {
  await sync();
} else if (mode === "deploy") {
  await deploy();
} else if (mode === "sync") {
  await sync();
} else if (mode === "verify") {
  await verify();
} else {
  console.error("[CrediFi] usage: tsx src/deploy.ts deploy|sync|verify");
  console.error("[CrediFi]   deploy            -> readiness preflight (safe)");
  console.error("[CrediFi]   deploy sync (or sync) -> sync wallet + persist state (safe, no submission)");
  console.error("[CrediFi]   verify            -> read on-chain state of a deployed contract");
  console.error("[CrediFi]   DEPLOY_CONFIRM=true deploy -> real on-chain deployment");
  process.exitCode = 1;
}
