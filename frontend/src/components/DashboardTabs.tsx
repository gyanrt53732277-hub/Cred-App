// ---------------------------------------------------------------------------
// Dashboard sub-navigation: a clean horizontal tab bar rendered directly below
// the main CrediFi navbar whenever a wallet is connected. Tabs are pure
// navigation — they only switch the dashboard content panel already rendered in
// App. All icons come from the shared inline SVG icon set (Icons.tsx).
// ---------------------------------------------------------------------------
import type { ComponentType } from "react";
import { FileTextIcon, GridIcon, HistoryIcon, LockIcon, ShieldIcon, UserIcon } from "./Icons";

export type DashboardTab = "overview" | "privacy" | "history" | "lender" | "certificate" | "profile";

type TabIconProps = { size?: number; className?: string };

export const DASHBOARD_TABS: { key: DashboardTab; label: string; Icon: ComponentType<TabIconProps> }[] = [
  { key: "overview", label: "Overview", Icon: GridIcon },
  { key: "privacy", label: "Privacy", Icon: LockIcon },
  { key: "history", label: "History", Icon: HistoryIcon },
  { key: "lender", label: "Lender Portal", Icon: ShieldIcon },
  { key: "certificate", label: "Certificate", Icon: FileTextIcon },
  { key: "profile", label: "Profile", Icon: UserIcon },
];

type DashboardTabsProps = {
  active: DashboardTab;
  onSelect: (tab: DashboardTab) => void;
};

export function DashboardTabs({ active, onSelect }: DashboardTabsProps) {
  return (
    <div className="dashbar">
      <nav className="dashbar-inner" aria-label="Dashboard views">
        {DASHBOARD_TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            className={`dash-tab ${active === key ? "is-active" : ""}`}
            aria-pressed={active === key}
            aria-label={`${label} dashboard tab`}
            onClick={() => onSelect(key)}
          >
            <span className="tab-icon" aria-hidden>
              <Icon size={15} />
            </span>
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}