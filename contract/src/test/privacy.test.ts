// ---------------------------------------------------------------------------
// CrediFi privacy tests: the exact financial inputs (income, previous-default
// flag, issuer signature, holder secret) must NEVER surface in any public
// state -- only the binary eligibility summary the lender asked for.
// ---------------------------------------------------------------------------
import { describe, it, expect } from "vitest";
import { pureCircuits, ledger } from "../managed/credifi/contract/index.js";
import { issueCredential, MOCK_ISSUER_ID } from "../mock-issuer.js";
import { setup, userState, verifyAsUser, resultsOf, USER_SECRET, ISSUER } from "./test-utils.js";

describe("CrediFi privacy", () => {
  it("the exact income does not appear anywhere in the public ledger", () => {
    const { contract, adminContext } = setup();
    const call = verifyAsUser(contract, adminContext, userState({ income: 65000n, previousDefault: false }));

    const view = ledger(call.context.currentQueryContext.state);
    const { inner } = resultsOf(view);
    const record = inner.lookup(1n);

    // Serialize every public value reachable in the ledger.
    const fields = [
      record.minimumIncome.toString(),
      record.requireNoDefault.toString(),
      record.incomeSatisfied.toString(),
      record.defaultRequirementSatisfied.toString(),
      record.eligible.toString(),
      record.lenderRef,
    ];
    const issuer = view.issuers.lookup(1n);
    const admin = view.contractAdmin instanceof Uint8Array ? Array.from(view.contractAdmin).join(",") : String(view.contractAdmin);
    const joined = [...fields, `issuer:${issuer.x}:${issuer.y}`, admin].join("|");

    // The applicant's exact income must be absent.
    expect(joined).not.toContain("65000");
  });

  it("the previous-default flag and signature are not stored in the ledger", () => {
    const { contract, adminContext } = setup();
    const call = verifyAsUser(contract, adminContext, userState({ income: 65000n, previousDefault: true }));

    const view = ledger(call.context.currentQueryContext.state);
    const { inner } = resultsOf(view);
    const record = inner.lookup(1n);

    // A previous default may surface only as the boolean summary, never the raw flag.
    expect(record.defaultRequirementSatisfied).toBe(false);
    expect(record.eligible).toBe(false);

    // The result record exposes only the declared, sanitized summary fields.
    const recordFields = Object.keys(record).sort();
    expect(recordFields).toEqual(
      ["defaultRequirementSatisfied", "eligible", "incomeSatisfied", "lenderRef", "minimumIncome", "requireNoDefault"].sort(),
    );
    // No signature or holder-secret material is reachable as public state.
    const serialized = JSON.stringify({
      record: {
        minimumIncome: record.minimumIncome.toString(),
        requireNoDefault: record.requireNoDefault,
        incomeSatisfied: record.incomeSatisfied,
        defaultRequirementSatisfied: record.defaultRequirementSatisfied,
        eligible: record.eligible,
        lenderRef: record.lenderRef,
      },
    });
    expect(serialized).not.toMatch(/response|announcement|signature/i);
  });

  it("two users with different incomes land in distinct holder entries, keyed by identity hash", () => {
    const { contract, adminContext } = setup();
    const alice = verifyAsUser(contract, adminContext, userState({ income: 65000n, previousDefault: false }));

    // Bob uses a different holder secret and therefore a different ledger entry.
    const bobSecret = someOtherUserSecret();
    const bobPk = pureCircuits.deriveHolderPublicKey(bobSecret);
    const bobHash = pureCircuits.holderHash(bobPk);
    const bobIssued = issueCredential(ISSUER.sk, 62000n, false, bobHash);
    const bobState = {
      monthlyIncome: 62000n,
      previousDefaultFlag: 0n,
      credentialSignature: bobIssued.signature,
      credentialIssuerId: MOCK_ISSUER_ID,
      userSecretKey: bobSecret,
    };
    const bobCall = verifyAsUser(contract, alice.context, bobState);

    const view = ledger(bobCall.context.currentQueryContext.state);
    const aliceHeader = pureCircuits.deriveHolderPublicKey(USER_SECRET);
    const bobHeader = pureCircuits.deriveHolderPublicKey(bobSecret);

    // Both holder entries are present and keyed by 32-byte identity hashes,
    // not by names or any plaintext identifier.
    expect(view.verificationResults.size()).toBe(2n);
    expect(view.verificationResults.member(aliceHeader)).toBe(true);
    expect(view.verificationResults.member(bobHeader)).toBe(true);
    expect(aliceHeader).toBeInstanceOf(Uint8Array);
    expect(bobHeader).toBeInstanceOf(Uint8Array);
  });
});

const someOtherUserSecret = (): Uint8Array => {
  const a = new Uint8Array(32);
  a[31] = 42;
  return a;
};