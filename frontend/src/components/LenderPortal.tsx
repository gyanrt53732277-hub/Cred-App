import type { VerificationOutcome } from "../engine";
import { Card } from "./Card";
import { CheckIcon, LockIcon } from "./Icons";

type LenderPortalProps = {
  outcome: VerificationOutcome | null;
};

export function LenderPortal({ outcome }: LenderPortalProps) {
  return (
    <section className="lender-portal" aria-label="Lender verification portal">
      <div className="section-head">
        <p className="eyebrow">Lender portal</p>
        <h2>Verify a Result</h2>
        <p className="section-sub">
          A lender can confirm an applicant's eligibility result without ever seeing private
          financial inputs. Only the outcome below is shown.
        </p>
      </div>

      {outcome ? (
        <Card className="lender-verify" highlight>
          <div className="lender-verify-head">
            <span className={`lender-verify-icon ${outcome.eligible ? "ok" : "no"}`} aria-hidden>
              {outcome.eligible ? <CheckIcon size={18} /> : <LockIcon size={18} />}
            </span>
            <div>
              <h3>{outcome.eligible ? "Verified Eligible" : "Not Eligible"}</h3>
              <p>Result {outcome.resultId} for reference {outcome.lenderRef}</p>
            </div>
          </div>

          <dl className="lender-facts">
            <div className="lender-fact">
              <dt>Holder</dt>
              <dd className="mono">{outcome.holderAddressHash.slice(0, 10)}…</dd>
            </div>
            <div className="lender-fact">
              <dt>Income threshold met</dt>
              <dd>{outcome.incomeSatisfied ? "Yes" : "No"}</dd>
            </div>
            <div className="lender-fact">
              <dt>Clean-history condition</dt>
              <dd>{outcome.defaultRequirementSatisfied ? "Met" : "Not met"}</dd>
            </div>
            <div className="lender-fact">
              <dt>Computed by</dt>
              <dd>{outcome.computedBy}</dd>
            </div>
          </dl>

          <p className="lender-note">
            <LockIcon size={14} />
            <span>Private applicant income is never included in this view.</span>
          </p>
        </Card>
      ) : (
        <Card className="lender-empty">
          <p>Run a verification first, then verify its shareable result here.</p>
        </Card>
      )}
    </section>
  );
}