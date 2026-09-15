import { DatabaseIcon, EyeOffIcon, FingerprintIcon, ShieldIcon, CheckIcon } from "./Icons";

const FEATURES = [
  {
    title: "Private Eligibility Verification",
    text: "CrediFi checks whether you meet a lender's requirements without exposing your exact income or financial history.",
    icon: EyeOffIcon,
  },
  {
    title: "Fraud Protection",
    text: "Credentials are issued by a trusted issuer and bound to your wallet, so results can't be falsified or substituted.",
    icon: ShieldIcon,
  },
  {
    title: "Zero-Knowledge Proofs",
    text: "The compiled Midnight contract proves only the required condition — nothing more about your data is revealed.",
    icon: FingerprintIcon,
  },
  {
    title: "Verifiable Results",
    text: "Every result carries a reference and can be independently confirmed by the lender without seeing private inputs.",
    icon: CheckIcon,
  },
  {
    title: "User-Controlled Data",
    text: "Your financial details stay on your device. You decide when to run a check and what result to share.",
    icon: DatabaseIcon,
  },
];

export function Features() {
  return (
    <section className="section features-section" id="features" aria-label="Features">
      <div className="section-head">
        <p className="eyebrow">Why CrediFi</p>
        <h2>Built for trust, privacy and clarity</h2>
        <p className="section-sub">
          Everything is designed so you and your lender can rely on the result — without your private
          financial data ever being exposed.
        </p>
      </div>
      <div className="feature-grid" role="list">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <article key={f.title} className="feature-card" role="listitem">
              <span className="feature-icon" aria-hidden>
                <Icon size={22} />
              </span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}