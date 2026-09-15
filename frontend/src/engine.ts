// ---------------------------------------------------------------------------
// CrediFi verification engine (web).
//
// This executes the OFFICIAL COMPILED CrediFi contract circuits in-process
// (vanilla execution, same path as the contract unit tests). The eligibility
// decision is therefore computed by the real Midnight contract code, while the
// user's exact income and default flag stay witness-only (never serialized).
//
// On-chain submission (real ZK proof + Preprod transaction) requires a running
// proof server; that path is provided by the deploy CLI and is NOT fabricated
// here. The result object below deliberately carries no income anywhere.
// ---------------------------------------------------------------------------
import {
  CrediFi,
  witnesses,
  generateIssuerKeyPair,
  issueCredential,
  MOCK_ISSUER_ID,
  type CrediFiPrivateState,
} from "credifi-contract";
import * as RT from "@midnight-ntwrk/compact-runtime";

const { Contract, pureCircuits, ledger } = CrediFi;

const COIN = "0".repeat(64);
const ADDR = RT.sampleContractAddress();

export type FinancialCredential = {
  monthlyIncome: number; // PRIVATE witness
  previousDefault: boolean; // PRIVATE witness
};

export type LoanRequirement = {
  minimumIncome: number;
  requireNoDefault: boolean;
  lenderRef: string;
};

export type VerificationOutcome = {
  resultId: string;
  eligible: boolean;
  incomeSatisfied: boolean;
  defaultRequirementSatisfied: boolean;
  minimumIncome: number;
  requireNoDefault: boolean;
  lenderRef: string;
  holderAddressHash: string;
  computedBy: string; // human label for how the result was computed
};

/** Deterministic 32-byte holder secret derived from a wallet seed phrase. */
export function deriveHolderSecret(seed: string): Uint8Array {
  const bytes = new TextEncoder().encode(seed);
  const out = new Uint8Array(32);
  for (let i = 0; i < bytes.length; i++) out[i % 32] ^= bytes[i];
  return out;
}

const hex = (b: Iterable<number>): string => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");

export class CrediFiEngine {
  private readonly contract = new Contract(witnesses);
  private readonly issuer = generateIssuerKeyPair();
  private adminContext: RT.CircuitContext;
  private nextResultId = 1;

  constructor() {
    // Deploy the contract as the demo admin and register the mock issuer.
    // With vanilla execution this is instant padding — no network involved.
    const adminState = {
      monthlyIncome: 0n,
      previousDefaultFlag: 0n,
      credentialSignature: { announcement: { x: 0n, y: 0n }, response: 0n },
      credentialIssuerId: MOCK_ISSUER_ID,
      userSecretKey: new Uint8Array(32),
    };
    const ctor = this.contract.initialState(RT.createConstructorContext(adminState, COIN));
    const ctx = RT.createCircuitContext(ADDR, COIN, ctor.currentContractState, adminState);
    this.adminContext = this.contract.impureCircuits.registerIssuer(ctx, MOCK_ISSUER_ID, this.issuer.pk).context;
  }

  /** The registered mock issuer public key (as hex), for the "trusted issuers" panel. */
  get issuerPublicKey(): string {
    return `(${this.issuer.pk.x.toString()}, ${this.issuer.pk.y.toString()})`;
  }

  /**
   * Runs one full verification with the compiled contract circuit.
   *
   * The monthly income and previous-default flag are passed ONLY as circuit
   * witnesses; the returned outcome is the binary summary the lender asked for.
   */
  verify(
    credential: FinancialCredential,
    requirement: LoanRequirement,
    holderSecretSeed: string,
  ): VerificationOutcome {
    const holderSecret = deriveHolderSecret(holderSecretSeed);
    const holderPk = pureCircuits.deriveHolderPublicKey(holderSecret);
    const userHash = pureCircuits.holderHash(holderPk);
    const issued = issueCredential(
      this.issuer.sk,
      BigInt(credential.monthlyIncome),
      credential.previousDefault,
      userHash,
    );

    const state: CrediFiPrivateState = {
      monthlyIncome: BigInt(credential.monthlyIncome),
      previousDefaultFlag: credential.previousDefault ? 1n : 0n,
      credentialSignature: issued.signature,
      credentialIssuerId: MOCK_ISSUER_ID,
      userSecretKey: holderSecret,
    };

    const call = this.contract.impureCircuits.requestVerification(
      { ...this.adminContext, currentPrivateState: state },
      BigInt(requirement.minimumIncome),
      requirement.requireNoDefault,
      requirement.lenderRef,
    );

    const view = ledger(call.context.currentQueryContext.state);
    const inner = view.verificationResults.lookup(holderPk);
    const record = inner.lookup(BigInt(this.nextResultId));
    if (!record) {
      throw new Error(`CrediFi engine: verification record ${this.nextResultId} not found in ledger`);
    }

    // Keep the ledger fresh for subsequent verifications in the same session.
    this.adminContext = call.context;

    return {
      resultId: `#${this.nextResultId++}`,
      eligible: record.eligible,
      incomeSatisfied: record.incomeSatisfied,
      defaultRequirementSatisfied: record.defaultRequirementSatisfied,
      minimumIncome: Number(record.minimumIncome),
      requireNoDefault: record.requireNoDefault,
      lenderRef: record.lenderRef,
      holderAddressHash: hex(holderPk),
      computedBy: "Compiled CrediFi contract (in-process vanilla execution)",
    };
  }
}

export { MOCK_ISSUER_ID };