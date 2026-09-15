// ---------------------------------------------------------------------------
// CrediFi correctness tests: the eligibility matrix, multi-verification
// behaviour, issuer authentication, and admin governance. These exercise the
// REAL compiled circuit logic off-chain (vanilla execution).
// ---------------------------------------------------------------------------
import { describe, it, expect } from "vitest";
import * as RT from "@midnight-ntwrk/compact-runtime";
import { Contract, pureCircuits, ledger } from "../managed/credifi/contract/index.js";
import { signMessage } from "../mock-issuer.js";
import {
  ADMIN_SECRET,
  MINIMUM_INCOME,
  LENDER_REF,
  USER_SECRET,
  setup,
  userState,
  adminPrivateState,
  verifyAsUser,
  resultsOf,
  COIN,
  ADDR,
  ISSUER,
  key,
} from "./test-utils.js";
import { witnesses } from "../witnesses.js";

describe("CrediFi eligibility matrix", () => {
  it("case 1: income >= threshold and no default -> ELIGIBLE", () => {
    const { contract, adminContext } = setup();
    const call = verifyAsUser(contract, adminContext, userState({ income: 65000n, previousDefault: false }));

    const view = ledger(call.context.currentQueryContext.state);
    const { inner } = resultsOf(view);
    expect(inner.size()).toBe(1n);
    const record = inner.lookup(1n);
    expect(record.incomeSatisfied).toBe(true);
    expect(record.defaultRequirementSatisfied).toBe(true);
    expect(record.eligible).toBe(true);
    expect(record.minimumIncome).toBe(MINIMUM_INCOME);
    expect(record.requireNoDefault).toBe(true);
    expect(record.lenderRef).toBe(LENDER_REF);
  });

  it("case 2: income below the threshold -> NOT ELIGIBLE", () => {
    const { contract, adminContext } = setup();
    const call = verifyAsUser(contract, adminContext, userState({ income: 45000n, previousDefault: false }));

    const view = ledger(call.context.currentQueryContext.state);
    const { inner } = resultsOf(view);
    const record = inner.lookup(1n);
    expect(record.incomeSatisfied).toBe(false);
    expect(record.defaultRequirementSatisfied).toBe(true);
    expect(record.eligible).toBe(false);
  });

  it("case 3: previous default with requireNoDefault -> NOT ELIGIBLE", () => {
    const { contract, adminContext } = setup();
    const call = verifyAsUser(contract, adminContext, userState({ income: 65000n, previousDefault: true }));

    const view = ledger(call.context.currentQueryContext.state);
    const { inner } = resultsOf(view);
    const record = inner.lookup(1n);
    expect(record.incomeSatisfied).toBe(true);
    expect(record.defaultRequirementSatisfied).toBe(false);
    expect(record.eligible).toBe(false);
  });

  it("case 4: both conditions failing -> NOT ELIGIBLE", () => {
    const { contract, adminContext } = setup();
    const call = verifyAsUser(contract, adminContext, userState({ income: 10000n, previousDefault: true }));

    const view = ledger(call.context.currentQueryContext.state);
    const { inner } = resultsOf(view);
    const record = inner.lookup(1n);
    expect(record.incomeSatisfied).toBe(false);
    expect(record.defaultRequirementSatisfied).toBe(false);
    expect(record.eligible).toBe(false);
  });

  it("requireNoDefault=false still rejects a below-threshold income", () => {
    const { contract, adminContext } = setup();
    const call = verifyAsUser(contract, adminContext, userState({ income: 30000n, previousDefault: true }), 50000n, false);

    const view = ledger(call.context.currentQueryContext.state);
    const { inner } = resultsOf(view);
    expect(inner.lookup(1n).eligible).toBe(false);
  });

  it("requireNoDefault=false accepts an applicant with a past default but sufficient income", () => {
    const { contract, adminContext } = setup();
    const call = verifyAsUser(contract, adminContext, userState({ income: 60000n, previousDefault: true }), 50000n, false);

    const view = ledger(call.context.currentQueryContext.state);
    const { inner } = resultsOf(view);
    expect(inner.lookup(1n).eligible).toBe(true);
  });

  it("supports many simultaneous verifications with distinct result ids", () => {
    const { contract, adminContext } = setup();
    const first = verifyAsUser(contract, adminContext, userState({ income: 65000n, previousDefault: false }));
    const second = verifyAsUser(
      contract,
      first.context,
      userState({ income: 60000n, previousDefault: false }),
      60000n,
      true,
      "Second Lender",
    );

    const view = ledger(second.context.currentQueryContext.state);
    const { inner } = resultsOf(view);
    expect(inner.size()).toBe(2n);
    expect(inner.lookup(1n).eligible).toBe(true);
    expect(inner.lookup(2n).minimumIncome).toBe(60000n);
    expect(inner.lookup(2n).lenderRef).toBe("Second Lender");
  });
});

describe("CrediFi issuer authentication", () => {
  it("rejects a verification signed by an unregistered issuer", () => {
    const { contract, adminContext } = setup();
    const forged = { ...userState({ income: 65000n, previousDefault: false }), credentialIssuerId: 99n };
    expect(() =>
      contract.impureCircuits.requestVerification({ ...adminContext, currentPrivateState: forged }, MINIMUM_INCOME, true, LENDER_REF),
    ).toThrow("Credential issuer is not registered");
  });

  it("rejects a credential whose claimed income differs from the signed one", () => {
    const { contract, adminContext } = setup();
    const signed = userState({ income: 65000n, previousDefault: false });
    const tampered = { ...signed, monthlyIncome: 63000n };
    expect(() =>
      contract.impureCircuits.requestVerification({ ...adminContext, currentPrivateState: tampered }, MINIMUM_INCOME, true, LENDER_REF),
    ).toThrow("Invalid attestation signature");
  });

  it("rejects replaying a signature under a different holder identity", () => {
    const { contract, adminContext } = setup();
    const state = userState({ income: 65000n, previousDefault: false });
    const otherUser = { ...state, userSecretKey: key(9) };
    expect(() =>
      contract.impureCircuits.requestVerification({ ...adminContext, currentPrivateState: otherUser }, MINIMUM_INCOME, true, LENDER_REF),
    ).toThrow("Invalid attestation signature");
  });

  it("rejects a credential signed by a key that is NOT the registered issuer", () => {
    const { contract, adminContext } = setup();
    // An attacker signs with their own (unregistered) key but claims the registered issuer id.
    const attackerSk = BigInt("0x" + "13b4" + "99f0" + "dead");
    const holderPk = pureCircuits.deriveHolderPublicKey(USER_SECRET);
    const userHash = pureCircuits.holderHash(holderPk);
    const signature = signMessage(attackerSk, [65000n, 0n, userHash]);
    const forged = { ...userState({ income: 65000n, previousDefault: false }), credentialSignature: signature };
    expect(() =>
      contract.impureCircuits.requestVerification({ ...adminContext, currentPrivateState: forged }, MINIMUM_INCOME, true, LENDER_REF),
    ).toThrow("Invalid attestation signature");
  });
});

describe("CrediFi admin governance", () => {
  it("only the admin (holder of the contract admin secret) can register issuers", () => {
    const contract = new Contract(witnesses);
    const ctor = contract.initialState(RT.createConstructorContext(adminPrivateState(), COIN));
    const ctx = RT.createCircuitContext(ADDR, COIN, ctor.currentContractState, adminPrivateState());
    const attacker = { ...ctx, currentPrivateState: userState({ income: 65000n, previousDefault: false }) };
    expect(() => contract.impureCircuits.registerIssuer(attacker, 77n, ISSUER.pk)).toThrow(
      "Only the contract admin can manage issuers",
    );
  });

  it("admin can remove an issuer, after which verifications fail", () => {
    const { contract, adminContext } = setup();
    const removed = contract.impureCircuits.removeIssuer(adminContext, 1n);
    expect(() =>
      contract.impureCircuits.requestVerification(
        { ...removed.context, currentPrivateState: userState({ income: 65000n, previousDefault: false }) },
        MINIMUM_INCOME,
        true,
        LENDER_REF,
      ),
    ).toThrow("Credential issuer is not registered");
  });
});

describe("CrediFi derived identities", () => {
  it("holder keys are deterministic and domain-separated from admin keys", () => {
    expect(pureCircuits.deriveHolderPublicKey(USER_SECRET)).toEqual(pureCircuits.deriveHolderPublicKey(USER_SECRET));
    expect(pureCircuits.deriveAdminPublicKey(ADMIN_SECRET)).not.toEqual(pureCircuits.deriveHolderPublicKey(ADMIN_SECRET));
    expect(pureCircuits.holderHash(pureCircuits.deriveHolderPublicKey(USER_SECRET))).toEqual(
      pureCircuits.holderHash(pureCircuits.deriveHolderPublicKey(USER_SECRET)),
    );
  });
});