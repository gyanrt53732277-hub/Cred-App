// Shared helpers for the CrediFi contract test suite.
import * as RT from "@midnight-ntwrk/compact-runtime";
import { Contract, pureCircuits, type Ledger } from "../managed/credifi/contract/index.js";
import { CrediFiPrivateState, witnesses } from "../witnesses.js";
import { generateIssuerKeyPair, issueCredential, MOCK_ISSUER_ID } from "../mock-issuer.js";

export const COIN = "0".repeat(64);
export const ADDR = RT.sampleContractAddress();

export const key = (n: number): Uint8Array => {
  const a = new Uint8Array(32);
  a[31] = n;
  return a;
};

export const ADMIN_SECRET = key(1);
export const USER_SECRET = key(2);

export const MINIMUM_INCOME = 50000n;
export const LENDER_REF = "Midnight Lending Co";

export const ISSUER = generateIssuerKeyPair();

export function adminPrivateState(): CrediFiPrivateState {
  return {
    monthlyIncome: 0n,
    previousDefaultFlag: 0n,
    credentialSignature: { announcement: { x: 0n, y: 0n }, response: 0n },
    credentialIssuerId: MOCK_ISSUER_ID,
    userSecretKey: ADMIN_SECRET,
  };
}

export type UserCredential = { income: bigint; previousDefault: boolean };

/** Builds a user private state with a freshly signed credential over the exact claim. */
export function userState(credential: UserCredential): CrediFiPrivateState {
  const holderPk = pureCircuits.deriveHolderPublicKey(USER_SECRET);
  const userHash = pureCircuits.holderHash(holderPk);
  const issued = issueCredential(ISSUER.sk, credential.income, credential.previousDefault, userHash);
  return {
    monthlyIncome: credential.income,
    previousDefaultFlag: credential.previousDefault ? 1n : 0n,
    credentialSignature: issued.signature,
    credentialIssuerId: MOCK_ISSUER_ID,
    userSecretKey: USER_SECRET,
  };
}

/** Deploys the contract as admin and registers the mock issuer. */
export function setup() {
  const contract = new Contract(witnesses);
  const ctor = contract.initialState(RT.createConstructorContext(adminPrivateState(), COIN));
  const ctx = RT.createCircuitContext(ADDR, COIN, ctor.currentContractState, adminPrivateState());
  const registered = contract.impureCircuits.registerIssuer(ctx, MOCK_ISSUER_ID, ISSUER.pk);
  return { contract, adminContext: registered.context };
}

export function verifyAsUser(
  contract: Contract,
  adminContext: RT.CircuitContext,
  state: CrediFiPrivateState,
  minimumIncome: bigint = MINIMUM_INCOME,
  requireNoDefault: boolean = true,
  lenderRef: string = LENDER_REF,
) {
  return contract.impureCircuits.requestVerification(
    { ...adminContext, currentPrivateState: state },
    minimumIncome,
    requireNoDefault,
    lenderRef,
  );
}

export function resultsOf(view: Ledger) {
  const holderPk = pureCircuits.deriveHolderPublicKey(USER_SECRET);
  return { inner: view.verificationResults.lookup(holderPk), holderPk };
}