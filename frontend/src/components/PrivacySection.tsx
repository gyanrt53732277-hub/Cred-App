import { CheckIcon, EyeOffIcon, FingerprintIcon, LockIcon, ShieldIcon } from "./Icons";

const POINTS = [
  {
    title: "Never publicly exposed",
    text: "Your exact income, financial history and personal details are never put on the blockchain or shared with the lender.",
    icon: LockIcon,
  },
  {
    title: "Privacy-preserving verification",
    text: "CrediFi verifies eligibility using the compiled Midnight contract, proving only what is required.",
    icon: EyeOffIcon,
  },
  {
    title: "Minimal disclosure",
    text: "Only the verification result — eligible or not — is ever revealed. Nothing more.",
    icon: CheckIcon,
  },
  {
    title: "Verifiable integrity",
    text: "Results are bound to your wallet and carry a unique reference the lender can independently confirm.",
    icon: FingerprintIcon,
  },
  {
    title: "You stay in control",
    text: "Your private data stays on your device. You choose when to check eligibility and what to share.",
    icon: ShieldIcon,
  },
];

export function PrivacySection() {
  return (
    <section className="section section-alt privacy-section" id="privacy" aria-label="Privacy and data protection">
      <div className="section-head">
        <p className="eyebrow">Privacy first</p>
        <h2>Your financial information stays private.</h2>
        <p className="section-sub">
          CrediFi verifies whether you satisfy a financial requirement without ever exposing the
          sensitive information behind it.
        </p>
      </div>

      <div className="trust-grid">
        <div className="trust-lead">
          <span className="trust-lead-icon" aria-hidden>
            <LockIcon size={26} />
          </span>
          <p>
            Sensitive financial information is not exposed publicly. CrediFi verifies eligibility
            using privacy-preserving proofs, only the required verification result is revealed, and
            the blockchain provides verifiable integrity.
          </p>
        </div>

        <div className="privacy-grid">
          {POINTS.map((p) => {
            const Icon = p.icon;
            return (
              <article key={p.title} className="privacy-point">
                <span className="privacy-icon" aria-hidden>
                  <Icon size={22} />
                </span>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}