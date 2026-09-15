// ---------------------------------------------------------------------------
// Derived eligibility summaries for the CrediFi dashboard.
//
// The compiled contract only computes BINARY outcomes (eligible,
// incomeSatisfied, defaultRequirementSatisfied) and does NOT produce a numeric
// risk score. To stay honest we never invent a score; instead we derive a plain
// language category and a set of satisfied/unsatisfied requirement labels
// straight from the real outcome fields. Nothing here is fabricated.
// ---------------------------------------------------------------------------
import type { VerificationOutcome } from "../engine";

export type RiskCategory = "eligible" | "income-gap" | "history-gap" | "declined";

/**
 * Derives an honest eligibility category from the real contract outcome.
 * `eligible` already encodes `incomeSatisfied && (defaultRequirementSatisfied || !requireNoDefault)`,
 * so the category simply reflects which of the lender's requirements passed.
 */
export function deriveCategory(outcome: Pick<VerificationOutcome, "eligible" | "incomeSatisfied" | "defaultRequirementSatisfied" | "requireNoDefault">): RiskCategory {
  if (outcome.eligible) return "eligible";
  if (!outcome.incomeSatisfied && !outcome.defaultRequirementSatisfied && outcome.requireNoDefault) {
    return "declined";
  }
  if (!outcome.incomeSatisfied) return "income-gap";
  return "history-gap";
}

export function categoryLabel(category: RiskCategory): string {
  switch (category) {
    case "eligible":
      return "Eligible";
    case "income-gap":
      return "Income Threshold Not Met";
    case "history-gap":
      return "Clean-History Requirement Not Met";
    case "declined":
      return "Not Eligible";
  }
}

export function categoryTone(category: RiskCategory): "good" | "warn" | "bad" {
  switch (category) {
    case "eligible":
      return "good";
    case "income-gap":
    case "history-gap":
      return "warn";
    case "declined":
      return "bad";
  }
}

/** Flat list of the lender's requirements that were met (for the certificate). */
export function satisfiedLabels(outcome: Pick<VerificationOutcome, "incomeSatisfied" | "defaultRequirementSatisfied" | "requireNoDefault">): string[] {
  const labels: string[] = [];
  if (outcome.incomeSatisfied) labels.push("Income threshold met");
  if (outcome.defaultRequirementSatisfied || !outcome.requireNoDefault) labels.push("No prior-default condition met");
  return labels;
}

/** Flat list of the lender's requirements that were NOT met. */
export function unmetLabels(outcome: Pick<VerificationOutcome, "incomeSatisfied" | "defaultRequirementSatisfied" | "requireNoDefault">): string[] {
  const labels: string[] = [];
  if (!outcome.incomeSatisfied) labels.push("Income threshold not met");
  if (outcome.requireNoDefault && !outcome.defaultRequirementSatisfied) labels.push("Prior default on record");
  return labels;
}
