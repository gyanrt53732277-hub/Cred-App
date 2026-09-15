// ---------------------------------------------------------------------------
// CrediFi web-app configuration.
// ---------------------------------------------------------------------------

export const NETWORK_ID = "preprod" as const;

/**
 * On-chain address of the deployed CrediFi contract on Midnight Preprod.
 * MANUAL ACTION REQUIRED: real value goes here after `npm run deploy` succeeds
 * (requires a running proof server). This is NEVER fabricated.
 */
export const CONTRACT_ADDRESS: string = "82f0731b0b4c5c81c44e0c14b21a2c1ee930a13109df422cf8b60bf954ee0c0b";

/**
 * Demo mode: the web app runs the official compiled CrediFi contract circuits
 * in-process (vanilla execution), which produces genuine eligibility results
 * from the real contract logic without needing a proof server or Lace wallet.
 * The UI clearly labels this so it is never mistaken for an on-chain proof.
 */
export const DEMO_MODE = true as const;

export const MOCK_ISSUER_NAME = "Mock Verified Financial Credential Issuer";
export const DEFAULT_LENDER_REF = "Midnight Lending Co";

export const DOCS_URLS = {
  sourceCode: "https://github.com/",
  midnight: "https://docs.midnight.network/",
  preprodIndexer: "https://indexer.preprod.midnight.network/api/v4/graphql",
};