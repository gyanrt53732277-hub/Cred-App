import { CheckIcon, FileTextIcon, KeyIcon, ShieldIcon, WalletIcon } from "./Icons";

const STEPS = [
  { title: "Connect Wallet", text: "Connect your Midnight wallet. Only your wallet address is shared.", icon: WalletIcon },
  { title: "Provide & verify credentials", text: "Enter your financial details on your device — they never leave it.", icon: CheckIcon },
  { title: "Generate privacy proof", text: "A privacy-preserving proof is generated from the compiled contract.", icon: KeyIcon },
  { title: "Verify eligibility", text: "The lender's requirement is checked without revealing private data.", icon: FileTextIcon },
  { title: "Protect against fraud", text: "Results are bound to your wallet and verifiable — never fabricated.", icon: ShieldIcon },
];

export function HowItWorks() {
  return (
    <section className="section section-alt how-section" id="how-it-works" aria-label="How CrediFi works">
      <div className="section-head">
        <p className="eyebrow">Simple by design</p>
        <h2>How CrediFi Works</h2>
        <p className="section-sub">
          Five clear steps take you from connecting your wallet to a private, verifiable eligibility result.
        </p>
      </div>
      <div className="hiw-grid" role="list">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <article key={s.title} className={`hiw-step ${i === STEPS.length - 1 ? "is-final" : ""}`} role="listitem">
              <span className="hiw-num" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
              <span className="hiw-icon" aria-hidden>
                <Icon size={22} />
              </span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}