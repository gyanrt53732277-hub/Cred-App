import { Card } from "./Card";
import { LockIcon, CheckIcon } from "./Icons";

type PrivacyDashboardProps = {
  credentialsPresent: boolean;
  outcomePresent: boolean;
};

export function PrivacyDashboard({ credentialsPresent, outcomePresent }: PrivacyDashboardProps) {
  return (
    <section className="privacy-dashboard" aria-label="Privacy dashboard">
      <div className="section-head">
        <p className="eyebrow">Privacy dashboard</p>
        <h2>What stays private, what can be verified</h2>
        <p className="section-sub">
          Your private data never leaves your device. Only the verified result is ever shared.
        </p>
      </div>

      <div className="privacy-split" role="list">
        <Card className="privacy-half private" role="listitem">
          <div className="privacy-half-head">
            <span className="privacy-half-icon" aria-hidden>
              <LockIcon size={18} />
            </span>
            <h3>PRIVATE</h3>
            <span className="privacy-tag private-tag">Never shared</span>
          </div>
          <ul className="privacy-list">
            <li>Exact income</li>
            <li>Financial history</li>
            <li>Personal information</li>
          </ul>
          <p className="privacy-half-status">
            {credentialsPresent
              ? "Used on your device to compute the result — never revealed."
              : "No private details entered yet."}
          </p>
        </Card>

        <Card className="privacy-half verifiable" role="listitem">
          <div className="privacy-half-head">
            <span className="privacy-half-icon" aria-hidden>
              <CheckIcon size={18} />
            </span>
            <h3>VERIFIED RESULT</h3>
            <span className="privacy-tag verifiable-tag">Can be verified</span>
          </div>
          <ul className="privacy-list">
            <li>Eligibility result</li>
            <li>Verification status</li>
            <li>Proof / reference</li>
          </ul>
          <p className="privacy-half-status">
            {outcomePresent
              ? "A verified result is ready to share — with no exact income figures."
              : "Run a verification to produce a shareable result."}
          </p>
        </Card>
      </div>
    </section>
  );
}