// @vitest-environment node
// ---------------------------------------------------------------------------
// Eligibility summary helpers: derived directly from the contract outcome, so
// no fabricated numeric risk score is ever introduced.
// ---------------------------------------------------------------------------
import { describe, it, expect } from "vitest";
import {
  deriveCategory,
  categoryLabel,
  categoryTone,
  satisfiedLabels,
  unmetLabels,
} from "../lib/eligibility";

describe("deriveCategory", () => {
  it("returns eligible for a fully eligible outcome", () => {
    expect(
      deriveCategory({ eligible: true, incomeSatisfied: true, defaultRequirementSatisfied: true, requireNoDefault: true }),
    ).toBe("eligible");
  });

  it("returns income-gap when only income is unsatisfied", () => {
    expect(
      deriveCategory({ eligible: false, incomeSatisfied: false, defaultRequirementSatisfied: true, requireNoDefault: true }),
    ).toBe("income-gap");
  });

  it("returns history-gap when only the clean-history condition is unsatisfied", () => {
    expect(
      deriveCategory({ eligible: false, incomeSatisfied: true, defaultRequirementSatisfied: false, requireNoDefault: true }),
    ).toBe("history-gap");
  });

  it("returns declined when both requirements fail under a clean-history rule", () => {
    expect(
      deriveCategory({ eligible: false, incomeSatisfied: false, defaultRequirementSatisfied: false, requireNoDefault: true }),
    ).toBe("declined");
  });

  it("does not treat a prior default as a gap when the lender allows it", () => {
    // eligible despite default because requireNoDefault is false
    expect(
      deriveCategory({ eligible: true, incomeSatisfied: true, defaultRequirementSatisfied: false, requireNoDefault: false }),
    ).toBe("eligible");
  });
});

describe("labels", () => {
  it("labels categories and tones consistently", () => {
    expect(categoryLabel("eligible")).toBe("Eligible");
    expect(categoryLabel("income-gap")).toMatch(/Income/);
    expect(categoryLabel("history-gap")).toMatch(/History/);
    expect(categoryTone("eligible")).toBe("good");
    expect(categoryTone("income-gap")).toBe("warn");
    expect(categoryTone("history-gap")).toBe("warn");
    expect(categoryTone("declined")).toBe("bad");
  });

  it("collects satisfied and unmet requirement labels from the outcome", () => {
    const outcome = { incomeSatisfied: false, defaultRequirementSatisfied: false, requireNoDefault: true };
    expect(satisfiedLabels(outcome)).toEqual([]);
    expect(unmetLabels(outcome)).toHaveLength(2);
  });

  it("treats an allowed previous default as satisfied", () => {
    const outcome = { incomeSatisfied: true, defaultRequirementSatisfied: false, requireNoDefault: false };
    expect(satisfiedLabels(outcome)).toContain("No prior-default condition met");
    expect(unmetLabels(outcome)).toEqual([]);
  });
});