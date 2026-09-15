import type { WalletState } from "../wallet";
import { walletLabel } from "../wallet";
import type { VerificationOutcome } from "../engine";
import { deriveCategory, categoryLabel } from "../lib/eligibility";
import { shortenAddress } from "../lib/format";
import { Card } from "./Card";
import { CheckIcon, WalletIcon, FingerprintIcon, ShieldIcon } from "./Icons";

type ProfileSectionProps = {
  wallet: WalletState | null;
  connected: boolean;
  history: VerificationOutcome[];
};

export function ProfileSection({ wallet, connected, history }: ProfileSectionProps) {
  const latest = history.length > 0 ? history[history.length - 1] : null;
  const latestEligible = latest ? deriveCategory(latest) : null;

  return (
    <section className="profile-section" aria-label="Profile">
      <div className="section-head">
        <p className="eyebrow">Profile</p>
        <h2>Your account</h2>
        <p className="section-sub">Connected wallet, verification status, and eligibility history.</p>
      </div>

      <Card className="profile-card" highlight>
        <div className="profile-row">
          <span className="profile-icon" aria-hidden>
            <WalletIcon size={18} />
          </span>
          <div className="profile-field">
            <span className="profile-label">Connected wallet</span>
            <span className="profile-value">
              {connected && wallet ? shortenAddress(wallet.address) : "Not connected"}
            </span>
          </div>
        </div>

        <div className="profile-row">
          <span className="profile-icon" aria-hidden>
            <ShieldIcon size={18} />
          </span>
          <div className="profile-field">
            <span className="profile-label">Verification status</span>
            <span className={`profile-value ${latestEligible && latest?.eligible ? "good" : ""}`}>
              {latestEligible ? categoryLabel(latestEligible) : "No verification yet"}
            </span>
          </div>
        </div>

        <div className="profile-row">
          <span className="profile-icon" aria-hidden>
            <FingerprintIcon size={18} />
          </span>
          <div className="profile-field">
            <span className="profile-label">Verification count</span>
            <span className="profile-value">
              {history.length > 0 ? `${history.length} verification${history.length === 1 ? "" : "s"} on record` : "0"}
            </span>
          </div>
        </div>

        <div className="profile-row">
          <span className="profile-icon" aria-hidden>
            <CheckIcon size={18} />
          </span>
          <div className="profile-field">
            <span className="profile-label">Network</span>
            <span className="profile-value">{connected && wallet ? "Midnight Preprod" : "—"}</span>
          </div>
        </div>

        {connected && wallet && (
          <p className="profile-meta">
            {walletLabel()} · rdns <span className="mono">{wallet.rdns || "—"}</span>
          </p>
        )}
      </Card>
    </section>
  );
}