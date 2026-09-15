import { useState } from "react";
import type { WalletState } from "../wallet";
import { shortenAddress } from "../lib/format";
import { Button } from "./Button";
import { BrandMark, CheckIcon, MenuIcon, WalletIcon, XIcon } from "./Icons";

export type NavTarget = "home" | "verify" | "dashboard" | "history" | "certificate" | "privacy";

type PageKey = "home" | "verify" | "dashboard" | "privacy";

type NavbarProps = {
  wallet: WalletState | null;
  connected: boolean;
  isConnecting: boolean;
  activePage: PageKey;
  activeTab: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onNavigate: (target: NavTarget) => void;
};

const LINKS: { key: NavTarget; label: string; requireConnection?: boolean }[] = [
  { key: "home", label: "Home" },
  { key: "dashboard", label: "Dashboard", requireConnection: true },
  { key: "verify", label: "Check Eligibility" },
  { key: "history", label: "History", requireConnection: true },
  { key: "certificate", label: "Certificate", requireConnection: true },
  { key: "privacy", label: "Privacy" },
];

export function Navbar({ wallet, connected, isConnecting, activePage, activeTab, onConnect, onDisconnect, onNavigate }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const goTo = (key: NavTarget) => {
    const needsConnection = LINKS.find((l) => l.key === key)?.requireConnection;
    onNavigate(needsConnection && !connected ? "verify" : key);
    setMenuOpen(false);
  };

  const isActive = (key: NavTarget): boolean => {
    switch (key) {
      case "home":
        return activePage === "home";
      case "verify":
        return activePage === "verify";
      case "privacy":
        return activePage === "privacy";
      case "dashboard":
        return activePage === "dashboard" && activeTab === "overview";
      case "history":
        return activePage === "dashboard" && activeTab === "history";
      case "certificate":
        return activePage === "dashboard" && activeTab === "certificate";
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <button type="button" className="brand" onClick={() => goTo("home")} aria-label="CrediFi home">
          <BrandMark />
          <span className="brand-name">CrediFi</span>
          <span className="env-pill" title="Running against the Midnight Preprod network">Preprod</span>
        </button>

        <nav className="nav-links" aria-label="Primary navigation">
          {LINKS.map((l) => {
            const active = isActive(l.key);
            const highlighted = active || (l.requireConnection && connected);
            return (
              <button
                key={l.key}
                type="button"
                className={`nav-link ${active ? "active" : ""} ${l.requireConnection && connected ? "nav-link-connected" : ""} ${highlighted ? "is-highlighted" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => goTo(l.key)}
              >
                {l.label}
              </button>
            );
          })}
        </nav>

        <div className="nav-actions">
          <div className="nav-wallet">
            {connected && wallet ? (
              <div className="wallet-chip connected" title={`Connected: ${wallet.address}`}>
                <ShieldStatus />
                <div className="wallet-chip-text">
                  <span className="wallet-chip-addr" title={wallet.address}>{shortenAddress(wallet.address)}</span>
                  <button type="button" className="wallet-chip-disconnect" onClick={onDisconnect} aria-label="Disconnect wallet">
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <Button variant="primary" size="sm" onClick={onConnect} disabled={isConnecting} icon={<WalletIcon />}>
                {isConnecting ? "Connecting…" : "Connect wallet"}
              </Button>
            )}
          </div>
          <button
            type="button"
            className="menu-toggle"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="mobile-menu" aria-label="Mobile navigation">
          {LINKS.map((l) => {
            const active = isActive(l.key);
            return (
              <button key={l.key} type="button" className={`mobile-link ${active ? "active" : ""}`} onClick={() => goTo(l.key)}>
                {l.label}
              </button>
            );
          })}
          {connected && wallet && (
            <button type="button" className="mobile-link" onClick={() => { onDisconnect(); setMenuOpen(false); }}>
              Disconnect wallet
            </button>
          )}
        </nav>
      )}
    </header>
  );
}

function ShieldStatus() {
  return (
    <span className="wallet-chip-icon" aria-hidden>
      <CheckIcon size={14} />
    </span>
  );
}
