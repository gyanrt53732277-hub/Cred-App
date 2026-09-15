import { Card } from "./Card";
import { LockIcon } from "./Icons";

type CredentialCardProps = {
  issuerName: string;
  verified: boolean;
  monthlyIncome: number;
  previousDefault: boolean;
  onIncomeChange: (value: number) => void;
  onDefaultChange: (value: boolean) => void;
};

export function CredentialCard({
  issuerName,
  verified,
  monthlyIncome,
  previousDefault,
  onIncomeChange,
  onDefaultChange,
}: CredentialCardProps) {
  return (
    <Card className="credential-card" highlight>
      <div className="card-head">
        <div className="card-title-wrap">
          <h3>Your Financial Details</h3>
          <span className="verified-pill">
            <LockIcon size={13} />
            {verified ? "Private" : "Pending"}
          </span>
        </div>
        <p className="issuer-name">{issuerName}</p>
        <p className="card-sub">Entered on your device — never shared publicly.</p>
      </div>

      <div className="form-grid">
        <label className="field">
          <span className="field-label">Monthly Income</span>
          <div className="input-prefix">
            <span className="input-prefix-char">₹</span>
            <input
              type="number"
              min={0}
              max={65535}
              value={monthlyIncome}
              placeholder="e.g. 65000"
              onChange={(e) => onIncomeChange(Number(e.target.value))}
            />
          </div>
          <span className="field-hint">Your exact income stays private</span>
          <span className="field-example">Example: ₹65,000</span>
        </label>

        <label className="field check-field">
          <span className="field-label">Previous Loan Default?</span>
          <div className="check-row">
            {(["No", "Yes"] as const).map((option) => {
              const value = option === "Yes";
              const selected = value === previousDefault;
              return (
                <button
                  key={option}
                  type="button"
                  className={`seg-btn ${selected ? "selected" : ""} ${option === "Yes" ? "warn-selected" : ""}`}
                  aria-pressed={selected}
                  onClick={() => onDefaultChange(value)}
                >
                  {option}
                </button>
              );
            })}
          </div>
          <span className="field-hint">Have you had a loan default before?</span>
        </label>
      </div>

      <p className="flow-note">
        <LockIcon size={15} />
        <span>Your exact income and history are used privately and never revealed to the lender.</span>
      </p>
    </Card>
  );
}