import { BrandMark, ExternalLinkIcon, GlobeIcon, LinkIcon, LockIcon } from "./Icons";
import { DOCS_URLS } from "../config";

type FooterProps = {
  deploymentNote: string;
  onNavigate?: (target: "verify" | "privacy") => void;
};

export function Footer({ deploymentNote, onNavigate }: FooterProps) {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="footer-inner">
        <div className="footer-brand">
          <BrandMark size={28} />
          <div>
            <p className="footer-name">CrediFi</p>
            <p className="footer-tag">
              Privacy-preserving financial eligibility verification on the Midnight Network.
            </p>
            <p className="footer-privacy-tag">
              <LockIcon size={13} /> Sensitive financial information stays private — always.
            </p>
          </div>
        </div>

        <nav className="footer-links" aria-label="Footer links">
          <a className="footer-link ext" href={DOCS_URLS.sourceCode} target="_blank" rel="noreferrer" aria-label="View source code on GitHub">
            <LinkIcon size={14} />
            GitHub
          </a>
          <span className="footer-link disabled" aria-label="X/Twitter coming soon">
            X
            <span className="coming-soon">Soon</span>
          </span>
          <a className="footer-link ext" href={DOCS_URLS.midnight} target="_blank" rel="noreferrer" aria-label="Midnight Network documentation">
            <GlobeIcon size={14} />
            Midnight Network
          </a>
          <a className="footer-link ext" href={DOCS_URLS.midnight} target="_blank" rel="noreferrer" aria-label="Read documentation">
            <ExternalLinkIcon size={14} />
            Documentation
          </a>
          <button type="button" className="footer-link footer-nav-link" onClick={() => onNavigate?.("privacy")}>
            Privacy
          </button>
          <button type="button" className="footer-link footer-nav-link" onClick={() => onNavigate?.("verify")}>
            Verification
          </button>
        </nav>
      </div>

      <div className="footer-bottom">
        <p>{deploymentNote}</p>
        <p>Built on the Midnight Network · Zero-knowledge proofs · Privacy-first</p>
      </div>
    </footer>
  );
}
