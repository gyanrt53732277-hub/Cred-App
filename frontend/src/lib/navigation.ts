import type { NavTarget } from "../components/Navbar";
import type { DashboardTab } from "../components/DashboardTabs";
import type { NotificationData } from "../components/Notification";

export type Page = "home" | "verify" | "dashboard" | "privacy";

export type NavigationAction =
  | { type: "page"; page: Page }
  | { type: "tab"; page: "dashboard"; tab: DashboardTab };

/**
 * Resolves a navigation request to the page/tab it should open, based on the
 * current connection state. Dashboard-only destinations (overview, history,
 * certificate) open their tab directly when a wallet is connected; otherwise
 * they route to the eligibility page so the user can connect first.
 *
 * This is a pure decision function: it never scrolls or reads the DOM. Views
 * are opened by switching App state (the app uses state-based navigation).
 */
export function resolveNavigation(target: NavTarget, opts: { connected: boolean }): NavigationAction {
  switch (target) {
    case "home":
      return { type: "page", page: "home" };
    case "verify":
      return { type: "page", page: "verify" };
    case "privacy":
      return { type: "page", page: "privacy" };
    case "dashboard":
      return opts.connected
        ? { type: "tab", page: "dashboard", tab: "overview" }
        : { type: "page", page: "verify" };
    case "history":
      return opts.connected
        ? { type: "tab", page: "dashboard", tab: "history" }
        : { type: "page", page: "verify" };
    case "certificate":
      return opts.connected
        ? { type: "tab", page: "dashboard", tab: "certificate" }
        : { type: "page", page: "verify" };
  }
}

/**
 * Builds the prominent result notification shown right after a verification.
 * Success for eligible applicants, error/warning for declined ones. Never
 * includes sensitive financial figures — only the binary outcome.
 */
export function resultNotification(result: { eligible: boolean }): NotificationData {
  return result.eligible
    ? {
        kind: "success",
        title: "🎉 Congratulations! You are Eligible.",
        message:
          "You passed all the eligibility conditions required by the lender. Your result and certificate are ready below.",
      }
    : {
        kind: "error",
        title: "Sorry, You are Not Eligible.",
        message:
          "The required eligibility conditions were not satisfied. Review the result below to see which requirements were not met.",
      };
}