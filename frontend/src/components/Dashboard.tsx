import type { ReactNode } from "react";
import type { WalletState } from "../wallet";
import { walletLabel } from "../wallet";
import type { VerificationOutcome } from "../engine";
import { shortenAddress, formatMoney } from "../lib/format";
import { deriveCategory, categoryLabel, categoryTone, type RiskCategory } from "../lib/eligibility";
import { Card } from "./Card";
import { Button } from "./Button";
import { CheckIcon, ClockIcon, LockIcon, ShieldIcon, WalletIcon, FingerprintIcon, ArrowRightIcon } from "./Icons";

type DashboardProps = {
  wallet: WalletState | null;
  connected: boolean;
  history: VerificationOutcome[];
  onCheckEligibility?: () => void;
  onViewCertificate?: () => void;
};

export function Dashboard({ wallet, connected, history, onCheckEligibility, onViewCertificate }: DashboardProps) {
  const latest = history.length > 0 ? history[history.length - 1] : null;
  const category: RiskCategory | null = latest ? deriveCategory(latest) : null;

  const stats = [
    {
      label: "Wallet",
      value: connected && wallet ? shortenAddress(wallet.address) : "Not connected",
      icon: <WalletIcon size={18} />,
      tone: connected ? "good" : "muted",
      badge: connected ? <Badge tone="verified">Connected</Badge> : <Badge tone="not-verified">Not verified</Badge>,
    },
    {
      label: "Eligibility",
      value: latest ? (latest.eligible ? "Eligible" : "Not Eligible") : "—",
      icon: <ShieldIcon size={18} />,
      tone: latest ? (latest.eligible ? "good" : "bad") : "muted",
      badge: latest ? (latest.eligible ? <Badge tone="eligible">Eligible</Badge> : <Badge tone="not-eligible">Not eligible</Badge>) : <Badge tone="pending">Pending</Badge>,
    },
    {
      label: "Verifications",
      value: String(history.length),
      icon: <FingerprintIcon size={18} />,
      tone: history.length > 0 ? "accent" : "muted",
      badge: history.length > 0 ? <Badge tone="verified">Verified</Badge> : <Badge tone="pending">Pending</Badge>,
    },
    {
      label: "Network",
      value: connected && wallet ? "Midnight Preprod" : "—",
      icon: <CheckIcon size={18} />,
      tone: connected ? "accent" : "muted",
      badge: <Badge tone="verified">Preprod</Badge>,
    },
  ];

  return (
    <section className="dashboard" aria-label="Account dashboard">
      <div className="dash-welcome">
        <div className="dash-welcome-text">
          <p className="eyebrow">Dashboard</p>
          <h2>Verification Overview</h2>
          <p className="section-sub">
            A private summary of your wallet, your eligibility result, and your verification history.
          </p>
        </div>
        {(onCheckEligibility || (latest && onViewCertificate)) && (
          <div className="dash-welcome-actions">
            {onCheckEligibility && (
              <Button variant="primary" size="sm" onClick={onCheckEligibility} icon={<ArrowRightIcon size={14} />}>
                Check Eligibility
              </Button>
            )}
            {latest && onViewCertificate && (
              <Button variant="secondary" size="sm" onClick={onViewCertificate}>
                Get Certificate
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="stat-grid" role="list" aria-label="Dashboard statistics">
        {stats.map((s) => (
          <div key={s.label} className={`stat-card tone-${s.tone}`} role="listitem">
            <span className="stat-icon" aria-hidden>
              {s.icon}
            </span>
            <span className="stat-label">{s.label}</span>
            <span className="stat-value">{s.value}</span>
            <span className="stat-badge">{s.badge}</span>
          </div>
        ))}
      </div>

      {latest && category && (
        <Card className="risk-summary" highlight>
          <div className="risk-summary-head">
            <span className={`risk-pill tone-${categoryTone(category)}`} aria-hidden>
              {latest.eligible ? <CheckIcon size={14} /> : <ShieldIcon size={14} />}
            </span>
            <div>
              <p className="eyebrow">Latest result</p>
              <h3>{categoryLabel(category)}</h3>
              <p className="risk-summary-sub">
                Reference {latest.lenderRef} · Result {latest.resultId}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="dash-status-grid">
        <Card className="dash-status-card">
          <div className="dash-status-head">
            <span className="dash-status-icon" aria-hidden>
              <ShieldIcon size={18} />
            </span>
            <div>
              <h4>Verification status</h4>
              <p className="dash-status-sub">The latest privacy check run for this wallet.</p>
            </div>
            {latest ? (
              <Badge tone={latest.eligible ? "verified" : "not-eligible"}>
                {latest.eligible ? "Verified" : "Not verified"}
              </Badge>
            ) : (
              <Badge tone="pending">Pending</Badge>
            )}
          </div>
          <p className="dash-status-body">
            {latest
              ? `Your last check (${latest.resultId}) confirmed ${latest.eligible ? "eligibility" : "the requirements were not met"} for ${latest.lenderRef || "your lender"}.`
              : "No verification has been run yet. Start with a quick eligibility check."}
          </p>
        </Card>

        <Card className="dash-status-card">
          <div className="dash-status-head">
            <span className="dash-status-icon" aria-hidden>
              <LockIcon size={18} />
            </span>
            <div>
              <h4>Privacy status</h4>
              <p className="dash-status-sub">How your data is being handled.</p>
            </div>
            <Badge tone="verified">Private</Badge>
          </div>
          <p className="dash-status-body">
            Your exact income and history never appear in this dashboard or on-chain. Only binary
            eligibility results are ever recorded.
          </p>
        </Card>
      </div>

      <Card className="recent-activity">
        <div className="recent-activity-head">
          <span className="recent-activity-icon" aria-hidden>
            <ClockIcon size={18} />
          </span>
          <div>
            <h4>Recent verification activity</h4>
            <p className="dash-status-sub">
              {history.length > 0 ? `${history.length} check${history.length === 1 ? "" : "s"} this session.` : "Nothing recorded yet this session."}
            </p>
          </div>
        </div>
        {latest ? (
          <div className="recent-activity-row">
            <span className={`recent-activity-state ${latest.eligible ? "ok" : "no"}`}>
              {latest.eligible ? "Eligible" : "Not Eligible"}
            </span>
            <div className="recent-activity-main">
              <span className="recent-activity-title">
                {latest.lenderRef || "Eligibility check"} · {latest.resultId}
              </span>
              <span className="recent-activity-sub">
                Requirement: min income {formatMoney(latest.minimumIncome)}
                {latest.requireNoDefault ? " · no prior default" : ""}
              </span>
            </div>
            <span className="mono recent-activity-id">{latest.resultId}</span>
          </div>
        ) : (
          <p className="recent-activity-empty">
            Complete the guided flow to record your first eligibility check.
          </p>
        )}
      </Card>

      {!connected && (
        <p className="dashboard-note">Connect your Midnight wallet to unlock the full dashboard.</p>
      )}
      {wallet && <p className="dashboard-wallet-meta">{walletLabel()} · preprod</p>}
    </section>
  );
}

type BadgeTone = "verified" | "pending" | "not-verified" | "eligible" | "not-eligible";

function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}