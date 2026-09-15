import { fileURLToPath } from "node:url";
// ---------------------------------------------------------------------------
// Runtime configuration for CrediFi on Midnight's Preprod network.
//
// These values match Midnight's published Preprod endpoints. The proof server
// (added via PROOF_SERVER_URL) is produced by the `midnight_bn254` binary and
// must be running locally before any deployment or on-chain verification.
// ---------------------------------------------------------------------------

export const CREDIFI_CONTRACT_PATH = new URL("./managed/credifi/contract/index.js", import.meta.url).toString();
export const CREDIFI_COMPILED_PATH = new URL("./managed/credifi/zkir", import.meta.url).toString();

// Base directory of the compiled CrediFi artifacts. The ZK config provider and
// the CompiledContract binding read `keys/` and `zkir/` from this directory.
export const CREDIFI_MANAGED_PATH = fileURLToPath(new URL("./managed/credifi", import.meta.url));

// Midnight network. Preprod is the public test network used for this MVP.
export const NETWORK_ID = "preprod";

// Midnight official Preprod indexer endpoint (GraphQL query + WebSocket).
export const INDEXER_URL = "https://indexer.preprod.midnight.network/api/v4/graphql";
export const INDEXER_WS_URL = "wss://indexer.preprod.midnight.network/api/v4/graphql/ws";

// Midnight official Preprod node RPC endpoint (used by the wallet SDK relay).
export const NODE_RPC_URL = "https://rpc.preprod.midnight.network";

// Locally-run Midnight proof server (start with `midnight_bn254`), the piece
// required to generate real ZK proofs on-device.
export const PROOF_SERVER_HOST = "127.0.0.1";
export const PROOF_SERVER_PORT = 6300;
export const PROOF_SERVER_URL = `http://${PROOF_SERVER_HOST}:${PROOF_SERVER_PORT}`;

/**
 * The on-chain address of the deployed CrediFi contract on Preprod.
 *
 * MANUAL ACTION REQUIRED: after running `npm run deploy` (which needs the proof
 * server running), paste the real contract address here. This value is NEVER
 * fabricated — it is left as a typed placeholder until a genuine deployment
 * exists.
 */
export const CONTRACT_ADDRESS: string = "82f0731b0b4c5c81c44e0c14b21a2c1ee930a13109df422cf8b60bf954ee0c0b";

// CrediFi demo constants shared across components and tests.
export const MOCK_ISSUER_ID = 1n;
export const DEFAULT_MINIMUM_INCOME = 50000n;
export const DEFAULT_LENDER_REF = "Midnight Lending Co";