// @vitest-environment node
// ---------------------------------------------------------------------------
// State-based navigation tests. CrediFi opens views/tabs by switching React
// state (the app does NOT scroll to anchors). These pure decision tests cover
// every major navigation button — home, dashboard, check eligibility, history,
// certificate, privacy — plus both eligibility-result notifications.
// ---------------------------------------------------------------------------
import { describe, it, expect } from "vitest";
import { resolveNavigation, resultNotification } from "../lib/navigation";

const NAV_BUTTONS = ["home", "dashboard", "verify", "history", "certificate", "privacy"] as const;

describe("major navigation buttons (direct view/tab opening, no scrolling)", () => {
  it("Home always opens the home view", () => {
    for (const connected of [true, false]) {
      expect(resolveNavigation("home", { connected })).toEqual({ type: "page", page: "home" });
    }
  });

  it("Check Eligibility always opens the eligibility (verify) view", () => {
    for (const connected of [true, false]) {
      expect(resolveNavigation("verify", { connected })).toEqual({ type: "page", page: "verify" });
    }
  });

  it("Privacy always opens the privacy view", () => {
    for (const connected of [true, false]) {
      expect(resolveNavigation("privacy", { connected })).toEqual({ type: "page", page: "privacy" });
    }
  });

  it("Dashboard opens the dashboard Overview tab when connected", () => {
    expect(resolveNavigation("dashboard", { connected: true })).toEqual({
      type: "tab",
      page: "dashboard",
      tab: "overview",
    });
  });

  it("History opens the Verification History tab when connected", () => {
    expect(resolveNavigation("history", { connected: true })).toEqual({
      type: "tab",
      page: "dashboard",
      tab: "history",
    });
  });

  it("Certificate opens the Eligibility Certificate tab when connected", () => {
    expect(resolveNavigation("certificate", { connected: true })).toEqual({
      type: "tab",
      page: "dashboard",
      tab: "certificate",
    });
  });

  it("dashboard-only destinations route to the eligibility view when not connected (no dead clicks)", () => {
    expect(resolveNavigation("dashboard", { connected: false })).toEqual({ type: "page", page: "verify" });
    expect(resolveNavigation("history", { connected: false })).toEqual({ type: "page", page: "verify" });
    expect(resolveNavigation("certificate", { connected: false })).toEqual({ type: "page", page: "verify" });
  });

  it("every major navigation button resolves to a real destination", () => {
    for (const target of NAV_BUTTONS) {
      const action = resolveNavigation(target, { connected: true });
      expect(action.page).toBeTruthy();
      if (action.type === "tab") expect(action.tab).toBeTruthy();
    }
  });
});

describe("eligibility result notification", () => {
  it("eligible result shows a prominent success notification", () => {
    const n = resultNotification({ eligible: true });
    expect(n.kind).toBe("success");
    expect(n.title).toContain("Congratulations! You are Eligible.");
    expect(n.title).toContain("🎉");
    expect(n.message.toLowerCase()).toContain("passed");
  });

  it("not eligible shows a prominent warning/error notification", () => {
    const n = resultNotification({ eligible: false });
    expect(n.kind).toBe("error");
    expect(n.title).toContain("Sorry, You are Not Eligible.");
    expect(n.message.toLowerCase()).toContain("not satisfied");
  });

  it("notifications never leak sensitive financial figures", () => {
    const eligible = resultNotification({ eligible: true });
    const declined = resultNotification({ eligible: false });
    const combined = `${eligible.title} ${eligible.message} ${declined.title} ${declined.message}`.toLowerCase();
    expect(combined).not.toMatch(/\b65000\b/);
    expect(combined).not.toMatch(/amount|salary|^income\b|figure/i);
  });
});