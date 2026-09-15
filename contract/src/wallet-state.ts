// ---------------------------------------------------------------------------
// Secret-free wallet-state persistence for the CrediFi Preprod deploy CLI.
//
// Stores each sub-wallet's serialized state (produced by the wallet SDK's own
// Serialization capability) in a single, versioned, atomic file OUTSIDE the
// Git repository / OneDrive, under the user's home directory:
//
//     ~/.credifi/wallet-state/preprod-v1.json
//
// The SDK serialization format embeds only derived PUBLIC keys, local zswap /
// unshielded / dust state, coin hashes and sync progress. It deliberately does
// NOT contain the mnemonic, raw seed, private keys or the private-state
// password, which continue to be provided from the environment on every run.
// No custom secret-storage format is invented here.
//
// Reading returns `null` (never throws) for a missing, corrupt, incompatible or
// unreadable file, so callers can fall back to a fresh sync with a warning.
// ---------------------------------------------------------------------------
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

export const PERSISTED_STATE_VERSION = 1;

export type PersistedWalletState = {
  version: number;
  /** Matches the deployed network id, e.g. "preprod". */
  networkId: string;
  /**
   * Non-secret, one-way SHA-256 fingerprint of the derived wallet identity
   * (the public unshielded deposit address). Uniquely identifies the seed that
   * produced the state WITHOUT storing the mnemonic, seed, private keys or the
   * private-state password. Guards against restoring state that was created
   * with a different seed/mnemonic.
   */
  seedHash: string;
  /** SDK `ShieldedWalletState.serialize()` / `ShieldedWallet.serializeState()` output. */
  shielded: string;
  /** SDK UnshieldedWallet serialized state. */
  unshielded: string;
  /** SDK DustWallet serialized state. */
  dust: string;
};

/** Directory for persisted wallet state, outside the repo / OneDrive. */
export function walletStateDir(): string {
  return path.join(os.homedir(), ".credifi", "wallet-state");
}

/** Versioned state file path for Preprod. */
export function walletStatePath(): string {
  return path.join(walletStateDir(), "preprod-v1.json");
}

/**
 * Reads and validates the persisted state file.
 *
 * Returns `null` when the file is absent, unreadable, corrupt, or is not the
 * supported version / network. Never throws; callers treat `null` as "no valid
 * persisted state" and fall back to a fresh sync.
 */
export function readPersistedState(file: string): PersistedWalletState | null {
  let raw: string;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedWalletState>;
    if (
      parsed?.version !== PERSISTED_STATE_VERSION ||
      typeof parsed.networkId !== "string" ||
      typeof parsed.seedHash !== "string" ||
      typeof parsed.shielded !== "string" ||
      typeof parsed.unshielded !== "string" ||
      typeof parsed.dust !== "string"
    ) {
      return null;
    }
    return parsed as PersistedWalletState;
  } catch {
    return null;
  }
}

/**
 * Returns true only when the persisted state's network, version AND seed
 * identity all match the current run. Used to decide whether to restore.
 * Pure and network-free, so it is unit-testable without the wallet SDK.
 */
export function isStateCompatible(
  state: PersistedWalletState | null,
  networkId: string,
  seedHash: string,
): boolean {
  return (
    state !== null &&
    state.version === PERSISTED_STATE_VERSION &&
    state.networkId === networkId &&
    state.seedHash === seedHash
  );
}

/** Atomically writes persisted state (tmp file + rename) so a crash can't corrupt it. */
export function writePersistedState(file: string, state: PersistedWalletState): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2), "utf8");
  fs.renameSync(tmp, file);
}
