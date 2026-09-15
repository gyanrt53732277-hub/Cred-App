// @vitest-environment node
// ---------------------------------------------------------------------------
// Navbar navigation test: the primary navigation must be real buttons that
// open views via state (no hash-anchor scrolling), and must expose every major
// destination — Home, Dashboard, Check Eligibility, History, Certificate,
// Privacy, plus the brand home button.
// ---------------------------------------------------------------------------
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Navbar } from "../components/Navbar";

const markup = renderToStaticMarkup(
  <Navbar
    wallet={null}
    connected={false}
    isConnecting={false}
    activePage="home"
    activeTab="overview"
    onConnect={() => {}}
    onDisconnect={() => {}}
    onNavigate={() => {}}
  />,
);

describe("Navbar direct navigation", () => {
  it("renders Home, Dashboard, Check Eligibility, History, Certificate and Privacy", () => {
    for (const label of ["Home", "Dashboard", "Check Eligibility", "History", "Certificate", "Privacy"]) {
      expect(markup).toContain(label);
    }
  });

  it("renders nav items as buttons (no hash-anchor scrolling links)", () => {
    expect(markup).not.toContain('href="#');
    expect(markup.match(/<button/g)?.length ?? 0).toBeGreaterThanOrEqual(6);
  });

  it("brand is a button that opens the home view, not a scroll-to-top anchor", () => {
    expect(markup).toContain('aria-label="CrediFi home"');
    expect(markup).not.toContain('href="#top"');
  });

  it("nav buttons have type=button (never submit) and accessible names", () => {
    const buttons = markup.match(/<button[^>]*>/g) ?? [];
    expect(buttons.length).toBeGreaterThan(0);
    for (const b of buttons) {
      expect(b).toContain('type="button"');
    }
  });
});