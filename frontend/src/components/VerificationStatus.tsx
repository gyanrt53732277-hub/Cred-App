import { useEffect, useState } from "react";
import { Card } from "./Card";
import { Button } from "./Button";
import { LockIcon, CheckIcon } from "./Icons";
import { ErrorCard } from "./ErrorCard";

type VerificationStatusProps = {
  isVerifying: boolean;
  error: string | null;
  onRun: () => void;
  disabled?: boolean;
};

// Friendly, human-readable phases shown while a verification runs. These mirror
// the real workflow (connect → prepare → generate proof → wait for confirmation).
const PHASES = [
  "Connecting wallet…",
  "Preparing verification…",
  "Generating privacy proof…",
  "Waiting for blockchain confirmation…",
];

export function VerificationStatus({ isVerifying, error, onRun, disabled = false }: VerificationStatusProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!isVerifying) {
      setPhase(0);
      return;
    }
    const id = setInterval(() => {
      setPhase((p) => Math.min(p + 1, PHASES.length - 1));
    }, 450);
    return () => clearInterval(id);
  }, [isVerifying]);

  return (
    <Card className="verification-card">
      <div className="card-head">
        <h3>Verify Privately</h3>
        <p className="card-sub">We'll check your eligibility without exposing your details.</p>
      </div>

      <div className="privacy-card">
        <span className="privacy-card-icon" aria-hidden>
          <LockIcon size={20} />
        </span>
        <div>
          <h4>Private by design</h4>
          <p>Your exact financial information is never revealed publicly.</p>
        </div>
      </div>

      {isVerifying ? (
        <div className="verifying" role="status" aria-live="polite">
          <span className="pulse-dots" aria-hidden>
            <span />
            <span />
            <span />
          </span>
          <p>{PHASES[phase]}</p>
          <p className="verifying-sub">Checking your eligibility against the compiled CrediFi contract.</p>
          <ol className="phase-list" aria-label="Verification progress">
            {PHASES.map((label, i) => (
              <li key={label} className={`phase-item ${i < phase ? "is-done" : i === phase ? "is-active" : ""}`}>
                <span className="phase-check" aria-hidden>{i < phase ? "✓" : i + 1}</span>
                {label}
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div className="card-foot">
          <Button
            variant="primary"
            size="lg"
            onClick={onRun}
            disabled={disabled}
            icon={disabled ? <LockIcon size={16} /> : <CheckIcon size={16} />}
          >
            {disabled ? "Connect wallet to continue" : "Check Eligibility"}
          </Button>
        </div>
      )}

      {error && (
        <div className="verify-error">
          <ErrorCard
            title="Verification could not be completed"
            message={error}
            hint="The eligibility engine or your wallet connection may not have been ready when the check ran."
            nextStep="Please try again. If it keeps failing, reconnect your wallet and refresh the page."
            onRetry={onRun}
            retryLabel="Try Again"
          />
        </div>
      )}
    </Card>
  );
}