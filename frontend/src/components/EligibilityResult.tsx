import { useState } from "react";
import type { VerificationOutcome } from "../engine";
import { satisfiedLabels, unmetLabels } from "../lib/eligibility";
import { formatMoney } from "../lib/format";
import { CONTRACT_ADDRESS } from "../config";
import { Card } from "./Card";
import { Button } from "./Button";
import { CheckIcon, FileTextIcon, InfoIcon, LockIcon, ServerIcon, XIcon } from "./Icons";

type EligibilityResultProps = {
  outcome: VerificationOutcome;
  onRestart: () => void;
  onViewDashboard?: () => void;
  onGetCertificate?: () => void;
};

const shortAddress = (a: string) => `${a.slice(0, 12)}…${a.slice(-8)}`;

export function EligibilityResult({ outcome, onRestart, onViewDashboard, onGetCertificate }: EligibilityResultProps) {
  const [showOnChain, setShowOnChain] = useState(false);
  const eligible = outcome.eligible;
  const met = satisfiedLabels(outcome);
  const unmet = unmetLabels(outcome);
  const shownAt = new Date().toISOString();
  const completedLabel = new Date(shownAt)
    .toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="result-wrap">
      <p className="eyebrow">Eligibility Result</p>

      <div className={`result-hero ${eligible ? "is-eligible" : "is-declined"}`} role="status" aria-live="polite">
        <span className={`result-check-circle ${eligible ? "ok" : "no"}`} aria-hidden>
          {eligible ? <CheckIcon size={34} /> : <XIcon size={30} />}
        </span>
        <h3>{eligible ? "Eligible" : "Not Eligible"}</h3>
        <p>
          {eligible
            ? "You meet the lender's requirements."
            : "You don't meet all the required conditions."}
        </p>
      </div>

      {eligible && (
        <ul className="verified-steps" aria-label="What was verified">
          <li>
            <span className="verified-step-icon" aria-hidden>
              <CheckIcon size={13} />
            </span>
            Eligibility requirement satisfied
          </li>
          <li>
            <span className="verified-step-icon" aria-hidden>
              <CheckIcon size={13} />
            </span>
            Privacy-preserving verification completed
          </li>
          <li>
            <span className="verified-step-icon" aria-hidden>
              <CheckIcon size={13} />
            </span>
            Financial information was not publicly revealed
          </li>
        </ul>
      )}

      <Card className="requirement-match">
        <div className="rm-head">
          <h4>Your requirement</h4>
          <span className={`rm-result ${eligible ? "" : "no"}`}>{eligible ? "Met" : "Not met"}</span>
        </div>
        <ul className="rm-list">
          <li>
            <span>Minimum monthly income</span>
            <strong>{formatMoney(outcome.minimumIncome)}</strong>
          </li>
          {outcome.requireNoDefault && (
            <li>
              <span>No prior loan default</span>
              <strong>{outcome.defaultRequirementSatisfied ? "Yes" : "No"}</strong>
            </li>
          )}
          {outcome.lenderRef && (
            <li>
              <span>Lender reference</span>
              <strong>{outcome.lenderRef}</strong>
            </li>
          )}
        </ul>
      </Card>

      <div className="result-conditions">
        <h4>Verified conditions</h4>
        {met.length > 0 && (
          <ul className="check-list">
            {met.map((m) => (
              <li key={m} className="check-item ok">
                <span className="check-item-icon" aria-hidden>
                  <CheckIcon size={14} />
                </span>
                <span className="check-item-label">{m}</span>
              </li>
            ))}
          </ul>
        )}
        {unmet.length > 0 && (
          <ul className="check-list">
            {unmet.map((u) => (
              <li key={u} className="check-item no">
                <span className="check-item-icon" aria-hidden>
                  <XIcon size={14} />
                </span>
                <span className="check-item-label">{u}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Card className="verify-details">
        <div className="verify-details-head">
          <span className="verify-details-icon" aria-hidden>
            <ServerIcon size={18} />
          </span>
          <div>
            <h4>Verification details</h4>
            <p>Identity and status of this verification record.</p>
          </div>
        </div>
        <dl className="verify-facts">
          <div className="verify-fact">
            <dt>Verification ID</dt>
            <dd className="mono">{outcome.resultId}</dd>
          </div>
          <div className="verify-fact">
            <dt>Completed</dt>
            <dd>{completedLabel}</dd>
          </div>
          <div className="verify-fact">
            <dt>Proof status</dt>
            <dd>
              <span className="badge badge-verified">Privacy proof generated</span>
            </dd>
          </div>
          <div className="verify-fact">
            <dt>Network</dt>
            <dd>Midnight Preprod</dd>
          </div>
          <div className="verify-fact">
            <dt>Holder</dt>
            <dd className="mono">{shortAddress(outcome.holderAddressHash)}</dd>
          </div>
          <div className="verify-fact">
            <dt>Computed by</dt>
            <dd>{outcome.computedBy}</dd>
          </div>
        </dl>
      </Card>

      <Card className="privacy-status-card">
        <div className="privacy-status-head">
          <span className="privacy-status-icon" aria-hidden>
            <LockIcon size={20} />
          </span>
          <div>
            <p className="privacy-status-note">
              Your financial details remain private. Only the eligibility result is shared.
            </p>
          </div>
        </div>
      </Card>

      {showOnChain && (
        <div className="verify-onchain-note" role="note">
          <span className="verify-onchain-icon" aria-hidden>
            <InfoIcon size={18} />
          </span>
          <p>
            <strong>On-chain verification note.</strong> This result was computed with the official
            compiled CrediFi contract in-process (vanilla execution). A real on-chain proof requires
            a local proof server and a funded Midnight wallet. The deployed contract on Midnight
            Preprod is <span className="mono">{shortAddress(CONTRACT_ADDRESS)}</span> — we never
            fabricate on-chain data.
          </p>
        </div>
      )}

      <p className="result-meta">Reference {outcome.lenderRef} · Result {outcome.resultId}</p>

      <div className="card-foot row">
        {onGetCertificate && (
          <Button variant="primary" onClick={onGetCertificate} icon={<FileTextIcon size={15} />}>
            View Verification
          </Button>
        )}
        <Button
          variant="secondary"
          onClick={() => setShowOnChain((v) => !v)}
          icon={<ServerIcon size={15} />}
        >
          {showOnChain ? "Hide On-Chain Info" : "Verify On-Chain"}
        </Button>
        {onViewDashboard && (
          <Button variant="ghost" onClick={onViewDashboard}>
            Back to Dashboard
          </Button>
        )}
        <Button variant="ghost" onClick={onRestart}>
          Check Again
        </Button>
      </div>
    </div>
  );
}