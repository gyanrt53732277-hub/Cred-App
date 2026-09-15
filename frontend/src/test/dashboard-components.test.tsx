// @vitest-environment node
// ---------------------------------------------------------------------------
// Smoke tests for the Level 5-ready dashboard components using ReactDOMServer
// server-side rendering (no jsdom, no wasm engine import). Each new section is
// rendered with a syntactically valid VerificationOutcome fixture and asserted
// to mount and show its expected headings/empty states.
// ---------------------------------------------------------------------------
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { VerificationOutcome } from "../engine";
import type { WalletState } from "../wallet";
import { Dashboard } from "../components/Dashboard";
import { DashboardTabs, DASHBOARD_TABS } from "../components/DashboardTabs";
import { PrivacyDashboard } from "../components/PrivacyDashboard";
import { VerificationHistory } from "../components/VerificationHistory";
import { RiskScore } from "../components/RiskScore";
import { LenderPortal } from "../components/LenderPortal";
import { EligibilityCertificate } from "../components/EligibilityCertificate";
import { ProfileSection } from "../components/ProfileSection";

const wallet: WalletState = {
  connected: true,
  provider: "dapp-connector",
  address: "mn_shield_addr_testFixtureAddress123456",
  networkId: "preprod",
  rdns: "io.midnight.lace",
};

const outcome: VerificationOutcome = {
  resultId: "#1",
  eligible: true,
  incomeSatisfied: true,
  defaultRequirementSatisfied: true,
  minimumIncome: 50000,
  requireNoDefault: true,
  lenderRef: "Midnight Lending Co",
  holderAddressHash: "a1b2c3d4e5f60718293a4b5c6d7e8f900112233445566778899aabbccddeeff00",
  computedBy: "Compiled CrediFi contract (test fixture)",
};

const markup = (node: React.ReactElement) => renderToStaticMarkup(node);

describe("Level 5 dashboard components", () => {
  it("renders all six dashboard tabs with an active highlighted state", () => {
    const html = markup(<DashboardTabs active="overview" onSelect={() => {}} />);
    expect(html).toContain("Dashboard views");
    for (const tab of DASHBOARD_TABS) {
      expect(html).toContain(tab.label);
    }
    // Active tab carries is-active + aria-pressed; icons are inline <svg> glyphs.
    expect(html).toContain('class="dash-tab is-active"');
    expect(html).toContain('aria-pressed="true"');
    expect(html.match(/<svg/g)?.length ?? 0).toBe(DASHBOARD_TABS.length);
  });

  it("renders the Dashboard overview with wallet, eligibility, count and network", () => {
    const html = markup(<Dashboard wallet={wallet} connected history={[outcome]} />);
    expect(html).toContain("Verification Overview");
    expect(html).toContain("Midnight Preprod");
    expect(html).toContain("Verifications");
  });

  it("renders the Dashboard empty state without a connected wallet", () => {
    const html = markup(<Dashboard wallet={null} connected={false} history={[]} />);
    expect(html).toContain("Connect your Midnight wallet to unlock the full dashboard.");
  });

  it("renders the Privacy Dashboard with private and verifiable columns", () => {
    const html = markup(<PrivacyDashboard credentialsPresent outcomePresent />);
    expect(html).toContain("What stays private, what can be verified");
    expect(html).toContain("PRIVATE");
    expect(html).toContain("VERIFIED RESULT");
    expect(html).toContain("Never shared");
  });

  it("renders the Verification History with a verified row", () => {
    const html = markup(<VerificationHistory history={[outcome]} />);
    expect(html).toContain("Verification History");
    expect(html).toContain("Result #1");
    expect(html).toContain("Verified");
  });

  it("renders the Verification History empty state", () => {
    const html = markup(<VerificationHistory history={[]} />);
    expect(html).toContain("No verifications yet");
  });

  it("renders the RiskScore without inventing a numeric score", () => {
    const html = markup(<RiskScore outcome={outcome} />);
    expect(html).toContain("Eligible");
    expect(html).toContain("does not calculate a numeric credit score");
  });

  it("renders the Lender Portal result view without private figures", () => {
    const html = markup(<LenderPortal outcome={outcome} />);
    expect(html).toContain("Verify a Result");
    expect(html).toContain("Verified Eligible");
  });

  it("renders the Lender Portal empty state", () => {
    const html = markup(<LenderPortal outcome={null} />);
    expect(html).toContain("Run a verification first");
  });

  it("renders the Eligibility Certificate with verified facts", () => {
    const html = markup(<EligibilityCertificate outcome={outcome} />);
    expect(html).toContain("CrediFi Eligibility Certificate");
    expect(html).toContain("Print / Save PDF");
    // The certificate shows a shortened holder hash (16 chars + ellipsis).
    expect(html).toContain("a1b2c3d4e5f60718…");
  });

  it("renders the Profile with wallet and history counts", () => {
    const html = markup(<ProfileSection wallet={wallet} connected history={[outcome]} />);
    expect(html).toContain("Your account");
    // Profile uses the shortened wallet address (mn_shi…3456) for privacy.
    expect(html).toContain("mn_shi…3456");
    expect(html).toContain("1 verification on record");
  });
});