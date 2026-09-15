import type { VerificationOutcome } from "../engine";
import { formatMoney } from "../lib/format";
import { Card } from "./Card";
import { CheckIcon, ShieldIcon } from "./Icons";

type VerificationHistoryProps = {
  history: VerificationOutcome[];
};

export function VerificationHistory({ history }: VerificationHistoryProps) {
  if (history.length === 0) {
    return (
      <section className="history-section" aria-label="Verification history">
        <div className="section-head">
          <p className="eyebrow">History</p>
          <h2>Verification History</h2>
          <p className="section-sub">Your previous eligibility checks and their results.</p>
        </div>
        <Card className="history-empty">
          <p>No verifications yet. Complete the guided flow to create your first result.</p>
        </Card>
      </section>
    );
  }

  return (
    <section className="history-section" aria-label="Verification history">
      <div className="section-head">
        <p className="eyebrow">History</p>
        <h2>Verification History</h2>
        <p className="section-sub">
          {history.length} check{history.length === 1 ? "" : "s"} recorded in this session.
        </p>
      </div>

      <div className="history-list" role="list">
        {[...history].reverse().map((h, i) => {
          const number = history.length - i;
          return (
            <Card key={`${h.resultId}-${i}`} className="history-row" role="listitem">
              <div className="history-icon" aria-hidden>
                {h.eligible ? <CheckIcon size={18} /> : <ShieldIcon size={18} />}
              </div>
              <div className="history-main">
                <div className="history-top">
                  <span className="history-id">Verification #{number}</span>
                  <span className={`history-state ${h.eligible ? "ok" : "no"}`}>
                    {h.eligible ? "Eligible" : "Not eligible"}
                  </span>
                </div>

                <dl className="history-facts">
                  <div className="history-fact">
                    <dt>Requirement</dt>
                    <dd>
                      Min income {formatMoney(h.minimumIncome)}
                      {h.requireNoDefault ? " · no prior default" : ""}
                    </dd>
                  </div>
                  <div className="history-fact">
                    <dt>Result</dt>
                    <dd>{h.eligible ? "Eligible" : "Not eligible"}</dd>
                  </div>
                  <div className="history-fact">
                    <dt>Status</dt>
                    <dd>{h.eligible ? "Verified" : "Declined"}</dd>
                  </div>
                </dl>

                <details className="history-details">
                  <summary>Technical details</summary>
                  <p>
                    Reference {h.lenderRef || "—"} · Result {h.resultId} · Holder{" "}
                    <span className="mono">{h.holderAddressHash.slice(0, 10)}…</span>
                  </p>
                  <p>{h.computedBy}</p>
                </details>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}