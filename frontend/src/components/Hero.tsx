import type { WalletState } from "../wallet";
import { shortenAddress } from "../lib/format";
import { Button } from "./Button";
import { BrandMark, ArrowRightIcon, CheckIcon, LockIcon, ShieldIcon, SparkleIcon, WalletIcon } from "./Icons";

type HeroProps = {
  onStart: () => void;
  onHowItWorks: () => void;
  wallet: WalletState | null;
  connected: boolean;
  isConnecting: boolean;
  onConnect: () => void;
};

const BENEFITS = [
  {
    title: "Your Data Stays Private",
    text: "Your exact income, history and personal details are never revealed.",
    icon: LockIcon,
  },
  {
    title: "Get Eligibility Result",
    text: "See clearly whether you meet the lender's requirements.",
    icon: ShieldIcon,
  },
  {
    title: "Powered by Midnight",
    text: "Privacy-first verification built on the Midnight Network.",
    icon: SparkleIcon,
  },
];

const PANEL_POINTS = [
  "Requirement verified without revealing exact income",
  "Only the eligibility result is produced",
  "Bound to your wallet — nothing is fabricated",
  "Verifiable reference for the lender",
];

export function Hero({ onStart, onHowItWorks, wallet, connected, isConnecting, onConnect }: HeroProps) {
  return (
    <section className="hero" id="top" aria-label="CrediFi overview">
      <div className="hero-grid">
        <div className="hero-copy">
          <div className="hero-brand" aria-label="CrediFi brand">
            <BrandMark size={40} />
            <div className="hero-brand-text">
              <p className="hero-brand-name">CrediFi</p>
              <span className="hero-brand-tag">Privacy-Preserving Financial Eligibility &amp; Fraud Protection</span>
            </div>
          </div>

          <p className="eyebrow">
            <span className="dot" aria-hidden /> Built on Midnight Network
          </p>
          <h1 className="hero-title">
            Prove your eligibility.
            <span className="hero-title-accent">Keep your data private.</span>
          </h1>
          <p className="hero-lead">
            CrediFi verifies whether you meet a lender&rsquo;s requirements using privacy-preserving
            proofs — without exposing your income, financial history, or personal details.
          </p>

          <div className="hero-actions">
            <Button variant="primary" size="lg" onClick={onStart} icon={<ArrowRightIcon size={18} />}>
              Check Eligibility
            </Button>
            <Button variant="outline" size="lg" onClick={onHowItWorks}>
              Learn How It Works
            </Button>
          </div>

          <div className="hero-status" aria-label="Connection and network status">
            {connected && wallet ? (
              <span className="hero-status-chip ok" title={wallet.networkId}>
                <span className="hero-status-dot" aria-hidden />
                <span className="hero-status-label">Wallet connected</span>
                <span className="addr">{shortenAddress(wallet.address)}</span>
              </span>
            ) : (
              <span className="hero-status-chip">
                <WalletIcon size={14} />
                <span className="hero-status-label">Wallet</span>
                <span>{connected ? "Connected" : "Not connected"}</span>
              </span>
            )}
            <span className="hero-status-chip network">
              <span className="hero-status-label">Network</span>
              <strong>Midnight Preprod</strong>
            </span>
            {!connected && (
              <Button variant="ghost" size="sm" onClick={onConnect} disabled={isConnecting}>
                {isConnecting ? "Connecting…" : "Connect"}
              </Button>
            )}
          </div>

          <p className="hero-trust">
            <span className="trust-icon" aria-hidden>
              <LockIcon size={15} />
            </span>
            Sensitive financial information stays private — never shared with the lender.
          </p>
        </div>

        <aside className="hero-panel" aria-label="How CrediFi protects your privacy">
          <div className="hero-panel-head">
            <span className="hero-panel-icon" aria-hidden>
              <CheckIcon size={18} />
            </span>
            <div>
              <p className="hero-panel-eyebrow">Private by default</p>
              <h3>Your data, protected</h3>
            </div>
          </div>

          <ul className="hero-panel-list">
            {PANEL_POINTS.map((p) => (
              <li key={p}>
                <span className="hero-panel-check" aria-hidden>
                  <CheckIcon size={13} />
                </span>
                {p}
              </li>
            ))}
          </ul>

          <div className="hero-panel-foot">
            <span className="badge badge-verified">Privacy preserved</span>
            <span className="badge badge-eligible">Zero-knowledge</span>
          </div>
        </aside>
      </div>

      <div className="hero-benefits" aria-label="What CrediFi offers">
        {BENEFITS.map((b) => {
          const Icon = b.icon;
          return (
            <article key={b.title} className="benefit-card">
              <span className="benefit-icon" aria-hidden>
                <Icon size={20} />
              </span>
              <div>
                <h3>{b.title}</h3>
                <p>{b.text}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}