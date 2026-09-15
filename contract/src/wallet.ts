// ---------------------------------------------------------------------------
// Real Midnight Preprod wallet initialization for the CrediFi deploy CLI.
//
// Builds a synced `WalletFacade` (shielded + unshielded + DUST sub-wallets)
// from a raw seed derived via env.ts, mirroring the official Midnight docs.
// All wallet credentials come from the environment and are never printed.
// ---------------------------------------------------------------------------
import { WebSocket } from "ws";
import * as Rx from "rxjs";
import { createHash } from "node:crypto";
import {
  HDWallet,
  Roles,
  WalletFacade,
  ShieldedWallet,
  DustWallet,
  UnshieldedWallet,
  createKeystore,
  PublicKey,
  NoOpTransactionHistoryStorage,
  DustAddress,
  MidnightBech32m,
} from "@midnight-ntwrk/wallet-sdk";
import * as ledger from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { unshieldedToken } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { setNetworkId, getNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import {
  NETWORK_ID,
  INDEXER_URL,
  INDEXER_WS_URL,
  NODE_RPC_URL,
  PROOF_SERVER_URL,
} from "./config.js";
import {
  PERSISTED_STATE_VERSION,
  isStateCompatible,
  readPersistedState,
  walletStatePath,
  writePersistedState,
  type PersistedWalletState,
} from "./wallet-state.js";

// Make WebSocket available to the wallet SDK's indexer connection in Node.
(globalThis as any).WebSocket = WebSocket;

export type WalletContext = {
  wallet: WalletFacade;
  shieldedSecretKeys: ledger.ZswapSecretKeys;
  dustSecretKey: ledger.DustSecretKey;
  unshieldedKeystore: ReturnType<typeof createKeystore>;
};

const PROD = "production";

/** Derives the three key roles (Zswap, NightExternal, Dust) from a seed. */
export function deriveKeys(seed: Uint8Array): Record<number, Uint8Array> {
  const hd = HDWallet.fromSeed(seed);
  if (hd.type !== "seedOk") {
    throw new Error(`[CrediFi] HDWallet.fromSeed failed: ${String(hd.error)}`);
  }
  const result = hd.hdWallet
    .selectAccount(0)
    .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
    .deriveKeysAt(0);
  hd.hdWallet.clear();
  if (result.type !== "keysDerived") {
    throw new Error("[CrediFi] Key derivation failed.");
  }
  return result.keys;
}

/**
 * Non-secret, one-way fingerprint of the wallet's identity derived from the
 * seed. Uses the PUBLIC unshielded deposit address (safe to share) so the same
 * seed always yields the same fingerprint, but the mnemonic/seed/private keys
 * can never be recovered from (or entered into) the persisted state.
 */
export function walletIdentityFingerprint(keystore: ReturnType<typeof createKeystore>): string {
  return createHash("sha256").update(String(keystore.getBech32Address())).digest("hex");
}

function buildConfigs() {
  const shieldedConfig = {
    networkId: getNetworkId(),
    indexerClientConnection: {
      indexerHttpUrl: INDEXER_URL,
      indexerWsUrl: INDEXER_WS_URL,
    },
    provingServerUrl: new URL(PROOF_SERVER_URL),
    relayURL: new URL(NODE_RPC_URL.replace(/^http/, "ws")),
  };
  const unshieldedConfig = {
    networkId: getNetworkId(),
    indexerClientConnection: {
      indexerHttpUrl: INDEXER_URL,
      indexerWsUrl: INDEXER_WS_URL,
    },
    txHistoryStorage: new NoOpTransactionHistoryStorage(),
  };
  const dustConfig = {
    ...shieldedConfig,
    costParameters: {
      additionalFeeOverhead: 300_000_000_000_000n,
      feeBlocksMargin: 5,
    },
  };
  return { shieldedConfig, unshieldedConfig, dustConfig };
}

async function initFacade(
  opts: {
    shieldedSecretKeys: ledger.ZswapSecretKeys;
    dustSecretKey: ledger.DustSecretKey;
    unshieldedKeystore: ReturnType<typeof createKeystore>;
    persisted: PersistedWalletState | null;
  },
): Promise<WalletFacade> {
  const { shieldedConfig, unshieldedConfig, dustConfig } = buildConfigs();
  const cfg: any = { ...shieldedConfig, ...unshieldedConfig, ...dustConfig };

  const makeFactories = (restore: PersistedWalletState | null) => ({
    shielded: (c: any) =>
      restore
        ? ShieldedWallet(c).restore(restore.shielded)
        : ShieldedWallet(c).startWithSecretKeys(opts.shieldedSecretKeys),
    unshielded: (c: any) =>
      restore
        ? UnshieldedWallet(c).restore(restore.unshielded)
        : UnshieldedWallet(c).startWithPublicKey(PublicKey.fromKeyStore(opts.unshieldedKeystore)),
    dust: (c: any) =>
      restore
        ? DustWallet(c).restore(restore.dust)
        : DustWallet(c).startWithSecretKey(opts.dustSecretKey, ledger.LedgerParameters.initialParameters().dust),
  });

  // Prefer restoring a previously persisted (fully synced) state so we resume
  // from the last applied index instead of replaying the whole Preprod ledger.
  if (opts.persisted) {
    try {
      return await WalletFacade.init({
        configuration: cfg,
        ...makeFactories(opts.persisted),
      });
    } catch (err) {
      // If the persisted state fails to deserialize / is incompatible with this
      // SDK version, do NOT silently use it: warn and fall back to fresh sync.
      console.log(
        `[CrediFi] Persisted wallet state is invalid/incompatible; starting fresh sync... ` +
          `(detail: ${sanitizeError(err)})`,
      );
    }
  }
  return WalletFacade.init({
    configuration: cfg,
    ...makeFactories(null),
  });
}

/** Best-effort sanitized error description (never includes secrets). */
function sanitizeError(err: unknown): string {
  try {
    if (err instanceof Error) return err.message;
    return String(err);
  } catch {
    return "(unknown)";
  }
}

/**
 * Builds a WalletFacade from the given seed bytes, connects it to Preprod, and
 * returns the context needed for transaction balancing and submission.
 *
 * Restores a persisted, fully-synced wallet state when a valid one exists
 * (so subsequent runs resume instead of replaying the entire Preprod ledger
 * from genesis); otherwise it performs a normal fresh sync. Never stores or
 * prints the seed / secret keys.
 *
 * @param seed The raw wallet seed (from MIDNIGHT_PREPROD_SEED / MNEMONIC).
 */
export async function buildWallet(seed: Uint8Array): Promise<WalletContext> {
  setNetworkId(NETWORK_ID);

  const keys = deriveKeys(seed);
  const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(keys[Roles.Zswap]);
  const dustSecretKey = ledger.DustSecretKey.fromSeed(keys[Roles.Dust]);
  const unshieldedKeystore = createKeystore(keys[Roles.NightExternal], getNetworkId());

  const stateFile = walletStatePath();
  const persisted = readPersistedState(stateFile);
  const fingerprint = walletIdentityFingerprint(unshieldedKeystore);
  const useRestored = isStateCompatible(persisted, NETWORK_ID, fingerprint);
  if (useRestored) {
    console.log("[CrediFi] Restoring persisted Preprod wallet state...");
  } else if (persisted !== null) {
    console.log(
      "[CrediFi] Persisted wallet state is invalid/incompatible " +
        "(network/version/identity mismatch); starting fresh sync...",
    );
  } else {
    console.log("[CrediFi] No persisted wallet state found; starting initial sync...");
  }

  const wallet = await initFacade({
    shieldedSecretKeys,
    dustSecretKey,
    unshieldedKeystore,
    persisted: useRestored ? persisted : null,
  });

  await wallet.start(shieldedSecretKeys, dustSecretKey);

  return { wallet, shieldedSecretKeys, dustSecretKey, unshieldedKeystore };
}

/** Waits until all three sub-wallets report a connected state. */
export async function waitForConnected(ctx: WalletContext): Promise<void> {
  await Rx.firstValueFrom(
    ctx.wallet.state().pipe(
      Rx.filter(
        (s: any) =>
          s.shielded?.state?.progress?.isConnected &&
          s.unshielded?.state?.progress?.isConnected &&
          s.dust?.state?.progress?.isConnected,
      ),
    ),
  );
}

/**
 * Serializes the three sub-wallets' current state via the SDK's own
 * secret-free Serialization capability and writes it to the versioned file.
 * Only called after a fully successful sync, never with partial state.
 */
async function persistWalletState(ctx: WalletContext): Promise<void> {
  const serialized: PersistedWalletState = {
    version: PERSISTED_STATE_VERSION,
    networkId: NETWORK_ID,
    seedHash: walletIdentityFingerprint(ctx.unshieldedKeystore),
    shielded: await (ctx.wallet as any).shielded.serializeState(),
    unshielded: await (ctx.wallet as any).unshielded.serializeState(),
    dust: await (ctx.wallet as any).dust.serializeState(),
  };
  try {
    writePersistedState(walletStatePath(), serialized);
    console.log("[CrediFi] Persisted wallet state successfully.");
  } catch (err) {
    // Persistence is best-effort; never fail the deploy because saving failed.
    console.log(`[CrediFi] WARNING: could not persist wallet state (${sanitizeError(err)}); continuing.`);
  }
}

/**
 * Waits for the wallet to fully sync against the Preprod indexer, then persists
 * the freshly-synced state so subsequent runs resume from the last applied
 * index instead of replaying the whole Preprod ledger from genesis.
 *
 * The first run of a fresh wallet performs a full historical (genesis) sync,
 * which on Preprod can take a long time and, without any output, looks stuck.
 * This function keeps the exact same waiting semantics as the SDK (it awaits
 * `waitForSyncedState()`) and adds lightweight, observability-only progress
 * logging so the CLI makes it clear the wallet is still syncing. It does NOT
 * change sync behaviour or add any expensive polling.
 *
 * Note: persistence happens only AFTER a fully successful sync. Mid-sync
 * checkpoint persistence was evaluated and deliberately NOT added: serializing
 * during active sync is SDK-safe, but on Preprod the DUST sub-wallet is the
 * long-pole, so a mid-sync checkpoint would only persist a partial
 * (un-synced) wallet and would not avoid the remaining DUST replay on restore.
 * Persisting only the fully-synced state is the safest supported behavior.
 */
export async function waitForSynced(ctx: WalletContext): Promise<void> {
  console.log("[CrediFi] wallet sync started (initial Preprod ledger synchronization in progress)");

  // Sample the current facade state every few seconds purely to log progress
  // across ALL THREE sub-wallets (shielded, dust and unshielded have separate,
  // independent sync progress that fan in to the facade's waitForSyncedState).
  // `ctx.wallet.state()` returns a snapshot observable, so this is cheap and
  // does not touch the sync pipeline.
      const timer = setInterval(() => {
    void (async () => {
      const s: any = await Rx.firstValueFrom(ctx.wallet.state());

      const shielded = s?.shielded;
      const shieldedProgress =
        shielded?.progress ?? (shielded?.state as any)?.progress;
      const dust = s?.dust;
      const dustProgress = dust?.progress ?? (dust?.state as any)?.progress;
      const unshielded = s?.unshielded;
      const unshieldedProgress =
        unshielded?.progress ?? (unshielded?.state as any)?.progress;

      console.log(
        `[CrediFi] wallet sync still in progress ` +
          `(shielded appliedIndex=${shieldedProgress?.appliedIndex} ` +
          `highestRelevant=${shieldedProgress?.highestRelevantIndex} ` +
          `connected=${shieldedProgress?.isConnected} | ` +
          `dust appliedIndex=${dustProgress?.appliedIndex} ` +
          `highestRelevant=${dustProgress?.highestRelevantIndex} ` +
          `connected=${dustProgress?.isConnected} | ` +
          `unshielded appliedId=${unshieldedProgress?.appliedId} ` +
          `highestTransactionId=${unshieldedProgress?.highestTransactionId} ` +
          `connected=${unshieldedProgress?.isConnected})`,
      );
    })().catch(() => {}); // observability only — never disrupt the sync
  }, 10_000);
  // NEW: Persist a mid-sync checkpoint every 3 minutes so that
  // progress is not lost if the process stops (Ctrl+C, crash, or sleep).
  // serializeState() is safe to call while the wallet is actively syncing.
  // This allows the wallet to resume from the latest saved checkpoint.
  const checkpointTimer = setInterval(() => {
    void persistWalletState(ctx)
      .then(() => console.log("[CrediFi] (checkpoint) mid-sync progress saved"))
      .catch(() => {});
  }, 3 * 60_000);

  try {
    await ctx.wallet.waitForSyncedState();
  } finally {
    clearInterval(timer);
    clearInterval(checkpointTimer);
  }
  console.log("[CrediFi] wallet sync completed");

  // Final persist after a fully successful sync.
  await persistWalletState(ctx);
}
/** Prints the unshielded deposit address (used with the Preprod faucet). */
export function unshieldedAddress(ctx: WalletContext): string {
  return String(ctx.unshieldedKeystore.getBech32Address());
}

/** Current unshielded NIGHT balance, in the smallest denomination. */
export async function nightBalance(ctx: WalletContext): Promise<bigint> {
  const state = await Rx.firstValueFrom(ctx.wallet.state());
  return state.unshielded?.balances?.[unshieldedToken().raw] ?? 0n;
}

/** Current spendable DUST balance, in the smallest denomination. */
export async function dustBalance(ctx: WalletContext): Promise<bigint> {
  const state = await Rx.firstValueFrom(ctx.wallet.state());
  return state.dust && typeof state.dust.balance === "function"
    ? state.dust.balance(new Date())
    : 0n;
}

/**
 * Registers unregistered NIGHT UTXOs for DUST generation and submits the
 * registration transaction. Refuses to do so unless DEPLOY_CONFIRM=true.
 */
export async function registerNightForDust(
  ctx: WalletContext,
  confirmDeploy: boolean,
): Promise<boolean> {
  if (!confirmDeploy) {
    throw new Error(
      "[CrediFi] DUST registration is a real on-chain submission. Refusing without DEPLOY_CONFIRM=true.",
    );
  }
  await waitForSynced(ctx);
  const state = await ctx.wallet.waitForSyncedState();
  const unregistered = (state.unshielded?.availableCoins ?? []).filter(
    (coin: any) => coin.meta?.registeredForDustGeneration !== true,
  );
  if (unregistered.length === 0) {
    console.log("[CrediFi] All NIGHT is already registered for DUST generation.");
    return false;
  }
  const target = String(DustAddress.encodePublicKey(getNetworkId(), state.dust.publicKey));
  const dustReceiver = MidnightBech32m.parse(target).decode(DustAddress, getNetworkId());
  const recipe = await ctx.wallet.registerNightUtxosForDustGeneration(
    unregistered,
    ctx.unshieldedKeystore.getPublicKey(),
    (payload: Uint8Array) => ctx.unshieldedKeystore.signData(payload),
    dustReceiver,
  );
  const finalized = await ctx.wallet.finalizeRecipe(recipe);
  await ctx.wallet.submitTransaction(finalized);
  console.log("[CrediFi] Submitted NIGHT -> DUST registration transaction.");
  return true;
}

/** Stops the wallet background services. */
export async function closeWallet(ctx: WalletContext): Promise<void> {
  if (ctx?.wallet) {
    try {
      await ctx.wallet.stop();
    } catch {
      // ignore clean-up errors
    }
  }
}

export function isProd(): boolean {
  return process.env.NODE_ENV === PROD;
}
