// @vitest-environment node
// ---------------------------------------------------------------------------
// CrediFi web engine tests: the same eligibility matrix exercised through the
// frontend engine (which runs the official compiled contract in-process), plus
// a privacy guarantee on the returned outcome shape.
// ---------------------------------------------------------------------------
import { describe, it, expect } from "vitest";
import { CrediFiEngine, deriveHolderSecret } from "../engine";

describe("CrediFiEngine (compiled contract execution)", () => {
  it("declares a high-income, no-default applicant ELIGIBLE", () => {
    const engine = new CrediFiEngine();
    const outcome = engine.verify(
      { monthlyIncome: 65000, previousDefault: false },
      { minimumIncome: 50000, requireNoDefault: true, lenderRef: "TestBank" },
      "holder-seed-a",
    );
    expect(outcome.eligible).toBe(true);
    expect(outcome.incomeSatisfied).toBe(true);
    expect(outcome.defaultRequirementSatisfied).toBe(true);
    expect(outcome.lenderRef).toBe("TestBank");
    expect(outcome.minimumIncome).toBe(50000);
  });

  it("declares a low-income applicant NOT ELIGIBLE", () => {
    const engine = new CrediFiEngine();
    const outcome = engine.verify(
      { monthlyIncome: 30000, previousDefault: false },
      { minimumIncome: 50000, requireNoDefault: true, lenderRef: "TestBank" },
      "holder-seed-b",
    );
    expect(outcome.eligible).toBe(false);
    expect(outcome.incomeSatisfied).toBe(false);
  });

  it("declares a prior-default applicant NOT ELIGIBLE when required", () => {
    const engine = new CrediFiEngine();
    const outcome = engine.verify(
      { monthlyIncome: 60000, previousDefault: true },
      { minimumIncome: 50000, requireNoDefault: true, lenderRef: "TestBank" },
      "holder-seed-c",
    );
    expect(outcome.eligible).toBe(false);
    expect(outcome.defaultRequirementSatisfied).toBe(false);
  });

  it("accepts a prior-default applicant when the lender does NOT require clean history", () => {
    const engine = new CrediFiEngine();
    const outcome = engine.verify(
      { monthlyIncome: 60000, previousDefault: true },
      { minimumIncome: 50000, requireNoDefault: false, lenderRef: "TestBank" },
      "holder-seed-d",
    );
    expect(outcome.eligible).toBe(true);
  });

  it("tracks multiple verifications with distinct result ids", () => {
    const engine = new CrediFiEngine();
    const first = engine.verify(
      { monthlyIncome: 60000, previousDefault: false },
      { minimumIncome: 50000, requireNoDefault: true, lenderRef: "Bank A" },
      "holder-seed-e",
    );
    const second = engine.verify(
      { monthlyIncome: 62000, previousDefault: false },
      { minimumIncome: 55000, requireNoDefault: true, lenderRef: "Bank B" },
      "holder-seed-e",
    );
    expect(first.resultId).toBe("#1");
    expect(second.resultId).toBe("#2");
    expect(second.eligible).toBe(true);
    expect(first.lenderRef).toBe("Bank A");
    expect(second.lenderRef).toBe("Bank B");
  });
});

describe("CrediFiEngine privacy of outcomes", () => {
  it("never serializes the exact income into the outcome", () => {
    const engine = new CrediFiEngine();
    const outcome = engine.verify(
      { monthlyIncome: 65325, previousDefault: false },
      { minimumIncome: 50000, requireNoDefault: true, lenderRef: "Bank" },
      "privacy-seed",
    );
    const text = JSON.stringify(outcome);
    expect(text).not.toContain("65325");
    // Only the threshold appears, and only because the lender declared it.
    expect(text).toContain("50000");
    expect(text).not.toMatch(/previousDefaultFlag|monthlyIncome/i);
  });
});

describe("deriveHolderSecret", () => {
  it("is deterministic and yields 32 bytes", () => {
    const a = deriveHolderSecret("same-seed");
    const b = deriveHolderSecret("same-seed");
    expect(a).toHaveLength(32);
    expect(a).toEqual(b);
  });
});