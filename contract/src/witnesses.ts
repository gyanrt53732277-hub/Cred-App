import { WitnessContext } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";
import { Ledger, Schnorr_SchnorrSignature } from "./managed/credifi/contract/index.js";

// ---------------------------------------------------------------------------
// CrediFi private state. Everything in here is PRIVATE and stays on the user's
// machine. It is fed into the ZK circuit at proving time via the witnesses and
// never crosses the public boundary (never written to a ledger field, never
// returned from an exported circuit).
// ---------------------------------------------------------------------------
export type CrediFiPrivateState = {
  // The user's exact monthly income (PRIVATE).
  readonly monthlyIncome: bigint;
  // 0n (no previous default) or 1n (previous default). (PRIVATE).
  readonly previousDefaultFlag: bigint;
  // Schnorr signature over the credential produced by a trusted issuer (PRIVATE).
  readonly credentialSignature: Schnorr_SchnorrSignature;
  // The id of the credential issuer that signed (PRIVATE witness input).
  readonly credentialIssuerId: bigint;
  // 32-byte secret driving the holder's derived identity (PRIVATE).
  readonly userSecretKey: Uint8Array;
};

export const createCrediFiPrivateState = (
  privateState: CrediFiPrivateState,
): CrediFiPrivateState => ({ ...privateState });

const TWO_248 = 452312848583266388373324160190187140051835877600158453279131187530910662656n;

export const witnesses = {
  getCredentialWitness: ({
    privateState,
  }: WitnessContext<Ledger, CrediFiPrivateState>): [
    CrediFiPrivateState,
    [bigint, bigint, Schnorr_SchnorrSignature, bigint],
  ] => [
    privateState,
    [
      privateState.monthlyIncome,
      privateState.previousDefaultFlag,
      privateState.credentialSignature,
      privateState.credentialIssuerId,
    ],
  ],
  getUserSecret: ({
    privateState,
  }: WitnessContext<Ledger, CrediFiPrivateState>): [CrediFiPrivateState, Uint8Array] => {
    if (!privateState.userSecretKey || privateState.userSecretKey.length !== 32) {
      throw new Error("getUserSecret: userSecretKey is missing or wrong length");
    }
    return [privateState, privateState.userSecretKey];
  },
  getSchnorrReduction: ({
    privateState,
  }: WitnessContext<Ledger, CrediFiPrivateState>, challengeHash: bigint): [
    CrediFiPrivateState,
    [bigint, bigint],
  ] => {
    const q = challengeHash / TWO_248;
    const r = challengeHash % TWO_248;
    return [privateState, [q, r]];
  },
};