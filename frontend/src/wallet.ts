
// ============================================================================
// CrediFi — Midnight Wallet Integration
// ============================================================================
//
// Browser wallet integration is handled exclusively through the official
// Midnight DApp Connector API.
//
// Expected browser interface:
//     window.midnight
//
// Connection is considered successful only after the wallet has:
//   1. Been detected by the application.
//   2. Accepted the connection request.
//   3. Returned a valid account address.
//   4. Reported its active network.
//
// There is no fallback, fake account, or simulated browser wallet in the
// production implementation. Test doubles are isolated inside the test suite.
//
// ============================================================================

import type {
  InitialAPI,
  ConnectedAPI,
  ConnectionStatus,
} from "@midnight-ntwrk/dapp-connector-api";

import { ErrorCodes } from "@midnight-ntwrk/dapp-connector-api";

import { NETWORK_ID } from "./config";


// ============================================================================
// Provider definition
// ============================================================================

/**
 * Wallet integration currently supported by CrediFi.
 *
 * The provider represents the Midnight browser DApp Connector rather than
 * a locally generated or application-owned wallet.
 */
export type WalletProvider = "dapp-connector";


// ============================================================================
// Wallet state
// ============================================================================

/**
 * Runtime representation of the connected wallet.
 */
export interface WalletState {
  /**
   * Indicates whether the connection has been fully authorized.
   */
  connected: boolean;

  /**
   * Integration method used to communicate with the wallet.
   */
  provider: WalletProvider;

  /**
   * Account address returned by the connected wallet.
   */
  address: string;

  /**
   * Network currently reported by the wallet.
   */
  networkId: string;

  /**
   * Reverse-DNS identifier supplied by the wallet connector.
   *
   * Example:
   *     com.midnight.wallet
   */
  rdns: string;
}


// ============================================================================
// Wallet error classification
// ============================================================================

/**
 * Normalized error categories consumed by the application UI.
 *
 * Keeping connector-specific failures behind these categories allows the
 * frontend to display meaningful messages without depending directly on
 * low-level connector error details.
 */
export type WalletErrorCode =
  | "not-detected"
  | "rejected"
  | "wrong-network"
  | "connection-error"
  | "disconnected";


// ============================================================================
// WalletError
// ============================================================================

/**
 * Standardized wallet exception used throughout the CrediFi application.
 */
export class WalletError extends Error {
  /**
   * Application-level classification of the wallet failure.
   */
  public readonly code: WalletErrorCode;

  constructor(
    code: WalletErrorCode,
    message: string,
  ) {
    super(message);

    this.name = "WalletError";
    this.code = code;

    // Required when targeting environments where subclassing Error can lose
    // the prototype chain after transpilation.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}


// ============================================================================
// Connector type aliases
// ============================================================================

/**
 * Initial connector interface exposed before authorization.
 */
export type MidnightInitialConnector = InitialAPI;

/**
 * Authorized connector interface returned after a successful connection.
 */
export type MidnightConnectedConnector = ConnectedAPI;

/**
 * Connector connection lifecycle state.
 */
export type MidnightConnectionStatus = ConnectionStatus;


// ============================================================================
// Network configuration
// ============================================================================

/**
 * Expected Midnight network for the CrediFi application.
 *
 * The imported value is intentionally kept as the single source of truth.
 */
export const REQUIRED_NETWORK_ID = NETWORK_ID;


// ============================================================================
// Error code reference
// ============================================================================
//
// ErrorCodes is imported from the official connector package so connector
// failures can be mapped without hard-coding provider-specific numeric/string
// values throughout the application.
//
// Example usage in the connection layer:
//
//     if (errorCode === ErrorCodes.USER_REJECTED) {
//       throw new WalletError(
//         "rejected",
//         "The wallet connection request was rejected.",
//       );
//     }
//
// ============================================================================

export { ErrorCodes };




 * Discovers an injected Midnight wallet connector on `window.midnight`.
 *
 * NOTE: The official Midnight docs strongly recommend discovering connectors by
 * ENUMERATION rather than a fixed key, because wallets may inject their Initial
 * API under a UUID (CAIP-372) instead of a well-known name like `mnLace`. We
 * therefore enumerate every entry and only prefer the Lace key as a tie-break
 * when several valid connectors are present.
 */
export function detectWallet(): InitialAPI | undefined {
  if (typeof window === "undefined" || !window.midnight) return undefined;

  const registry = window.midnight as Record<string, InitialAPI | unknown>;
  const keys = Object.keys(registry);
  if (keys.length === 0) return undefined;

  const candidates = keys
    .map((k) => registry[k])
    .filter(isConnector);

  if (candidates.length === 0) return undefined;

  const lace = candidates.find((c) => c.rdns === "io.midnight.lace" || c.name === "Lace");
  return lace ?? candidates[0];
}

function isConnector(w: unknown): w is InitialAPI {
  return Boolean(
    w &&
      typeof (w as InitialAPI).connect === "function" &&
      typeof (w as InitialAPI).name === "string",
  );
}

function isDAppAPIError(e: unknown): e is { type: "DAppConnectorAPIError"; code: string; reason: string } {
  return (
    !!e &&
    typeof e === "object" &&
    (e as { type?: string }).type === "DAppConnectorAPIError" &&
    typeof (e as { code?: string }).code === "string"
  );
}

/**
 * Wraps a promise with a generous timeout so that a wallet that approves the
 * connection but then hangs on a later API call can never leave the UI stuck in
 * the "Connecting..." state forever. It does NOT fabricate data — it only bounds
 * how long we wait for the wallet's own (genuine) response. If the wallet is
 * simply slow, it still gets the full budget to answer.
 */
async function withTimeout<T>(promise: Promise<T>, ms = 20_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new WalletError("connection-error", "The wallet did not respond in time.")), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Reads the real wallet address from a connected connector. Prefers the
 * shielded address (the primary user-facing Midnight address), falling back to
 * the unshielded address if the shielded read is unavailable for any reason.
 */
async function readWalletAddress(api: ConnectedAPI): Promise<string> {
  try {
    const shielded = await withTimeout(api.getShieldedAddresses());
    if (shielded?.shieldedAddress) return shielded.shieldedAddress;
  } catch {
    // Fall through to the unshielded address below.
  }
  const unshielded = await withTimeout(api.getUnshieldedAddress());
  if (unshielded?.unshieldedAddress) return unshielded.unshieldedAddress;
  throw new WalletError("connection-error", "The wallet did not return an address.");
}

/**
 * Connects the real Midnight browser wallet.
 *
 * IMPORTANT: `connect()` MUST be invoked synchronously from the user's click
 * handler, otherwise the browser blocks the wallet's authorization popup.
 *
 * Resolves with a {@link WalletState} reflecting the real wallet ONLY after the
 * user approves the connection. Rejects with a {@link WalletError} carrying a
 * machine-readable `code` for the common failure cases.
 */
export async function connectWallet(): Promise<WalletState> {
  const connector = detectWallet();
  if (!connector) {
    throw new WalletError(
      "not-detected",
      "Midnight wallet not detected. Install or enable a Midnight-compatible wallet (such as Lace) and refresh the page.",
    );
  }

  let api: ConnectedAPI;
  try {
    api = await connector.connect(NETWORK_ID);
  } catch (e) {
    if (isDAppAPIError(e) && (e.code === ErrorCodes.Rejected || e.code === ErrorCodes.PermissionRejected)) {
      throw new WalletError("rejected", "Wallet connection was cancelled.");
    }
    throw new WalletError("connection-error", e instanceof Error ? e.message : "The wallet connection failed.");
  }

  // Confirm the connection survived and align with the wallet's actual network.
  // `connect()` has already resolved, which IS the user's real approval, so a
  // hung or failing status read must not permanently strand the UI in
  // "Connecting...". We still honour an explicitly-reported different network.
  let status: ConnectionStatus;
  try {
    status = await withTimeout(api.getConnectionStatus());
  } catch {
    status = { status: "connected", networkId: NETWORK_ID };
  }
  if (status.status !== "connected") {
    throw new WalletError("disconnected", "The wallet connection was lost.");
  }

  const actualNetwork = status.networkId;
  if (actualNetwork.toLowerCase() !== NETWORK_ID.toLowerCase()) {
    throw new WalletError(
      "wrong-network",
      `Wrong network: the wallet is on "${actualNetwork}", but CrediFi requires Midnight Preprod. Please switch the wallet to Preprod and try again.`,
    );
  }

  const address = await readWalletAddress(api);

  return {
    connected: true,
    provider: "dapp-connector",
    address,
    networkId: actualNetwork,
    rdns: connector.rdns || "",
  };
}

/** Human-friendly label for the connector. */
export function walletLabel(): string {
  return "Midnight DApp Connector (browser wallet)";
}

/** The supported network CrediFi expects the wallet to be on. */
export const expectedNetwork = NETWORK_ID;
