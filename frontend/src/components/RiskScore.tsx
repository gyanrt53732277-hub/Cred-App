import type { VerificationOutcome } from "../engine";
import { deriveCategory, categoryLabel, categoryTone, unmetLabels } from "../lib/eligibility";
import { Card } from "./Card";

type RiskScoreProps = {
  outcome: VerificationOutcome;
};

export function RiskScore({ outcome }: RiskScoreProps) {
  const category = deriveCategory(outcome);
  const unmet = unmetLabels(outcome);

  return (
    <Card className="risk-score" highlight>
      <div className="risk-score-head">
        <span className={`risk-score-badge tone-${categoryTone(category)}`} aria-hidden>
          <span className="risk-score-ring" />
        </span>
        <div>
          <p className="eyebrow">Eligibility assessment</p>
          <h3>{categoryLabel(category)}</h3>
        </div>
      </div>

      <div className="risk-score-body">
        <p>
          CrediFi does not calculate a numeric credit score; the contract returns a binary
          eligibility result from the real compiled circuit. This category is derived solely from
          that result.
        </p>
        {unmet.length > 0 && (
          <ul className="risk-unmet">
            {unmet.map((u) => (
              <li key={u}>{u}</li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
