import { useState } from "react";
import { CrediFiEngine } from "./engine";
import { connectWallet, WalletError, type WalletErrorCode, type WalletState } from "./wallet";
import { DEFAULT_LENDER_REF, MOCK_ISSUER_NAME } from "./config";

import { Navbar, type NavTarget } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { Features } from "./components/Features";
import { PrivacySection } from "./components/PrivacySection";
import { Footer } from "./components/Footer";
import { ErrorCard } from "./components/ErrorCard";
import { ProgressSteps, type StepKey } from "./components/ProgressSteps";
import { WalletStatus } from "./components/WalletStatus";
import { CredentialCard } from "./components/CredentialCard";
import { RequirementForm } from "./components/RequirementForm";
import { VerificationStatus } from "./components/VerificationStatus";
import { EligibilityResult } from "./components/EligibilityResult";
import { Card } from "./components/Card";
import { DashboardTabs, type DashboardTab } from "./components/DashboardTabs";
import { Dashboard } from "./components/Dashboard";
import { PrivacyDashboard } from "./components/PrivacyDashboard";
import { VerificationHistory } from "./components/VerificationHistory";
import { RiskScore } from "./components/RiskScore";
import { LenderPortal } from "./components/LenderPortal";
import { EligibilityCertificate } from "./components/EligibilityCertificate";
import { ProfileSection } from "./components/ProfileSection";
import { Notification, type NotificationData } from "./components/Notification";
import { resolveNavigation, resultNotification, type Page } from "./lib/navigation";

import type { VerificationOutcome } from "./engine";

type Screen = "landing" | "setup" | "verifying" | "result";

const stepOf: Record<Screen, StepKey> = {
  landing: "requirement",
  setup: "requirement",
  verifying: "verifying",
  result: "result",
};

export default function App() {
  const [engine] = useState(() => new CrediFiEngine());
  const [page, setPage] = useState<Page>("home");
  const [screen, setScreen] = useState<Screen>("landing");
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [walletError, setWalletError] = useState<{ code: WalletErrorCode; message: string } | null>(null);

  // Private credential witness values (never displayed as public amounts).
  const [monthlyIncome, setMonthlyIncome] = useState(65000);
  const [previousDefault, setPreviousDefault] = useState(false);

  // Lender-facing requirements (public).
  const [minimumIncome, setMinimumIncome] = useState(50000);
  const [requireNoDefault, setRequireNoDefault] = useState(true);
  const [lenderRef, setLenderRef] = useState(DEFAULT_LENDER_REF);

  const [outcome, setOutcome] = useState<VerificationOutcome | null>(null);
  const [history, setHistory] = useState<VerificationOutcome[]>([]);
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>("overview");
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationData | null>(null);

  const connected = wallet !== null;
  const currentStep = stepOf[screen];

  // The dashboard becomes available as soon as a wallet is connected. Every
  // view renders an honest empty state until a verification has actually been
  // run (the components never fabricate results).
  const showDashboard = connected;

  function handleNavigate(target: NavTarget) {
    const action = resolveNavigation(target, { connected });
    if (action.type === "page") {
      setPage(action.page);
      if (action.page === "verify" && screen === "landing") setScreen("setup");
      return;
    }
    setPage("dashboard");
    setDashboardTab(action.tab);
  }

  async function handleConnect() {
    if (isConnecting || connected) return;
    setIsConnecting(true);
    setWalletError(null);
    setError(null);
    try {
      const state = await connectWallet();
      setWallet(state);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const code = e instanceof WalletError ? e.code : "connection-error";
      setWalletError({ code, message });
    } finally {
      setIsConnecting(false);
    }
  }

  function handleDisconnect() {
    setWallet(null);
    setOutcome(null);
    setWalletError(null);
    setError(null);
    setNotification(null);
    setScreen("setup");
    setPage("verify");
  }

  function handleStart() {
    setError(null);
    setScreen("setup");
    setPage("verify");
  }

  function handleHowItWorks() {
    setPage("home");
  }

  function handleContinueToVerify() {
    setError(null);
    setScreen("verifying");
    setPage("verify");
  }

  function handleRunVerification() {
    if (!connected || !wallet) {
      setError("Connect a wallet to continue.");
      setPage("verify");
      return;
    }
    setError(null);
    setIsVerifying(true);
    setScreen("verifying");
    setPage("verify");
    void (async () => {
      try {
        // Brief, deliberate pause so the processing state is visible. The
        // eligibility result itself is NEVER faked — it comes from running the
        // real compiled CrediFi contract circuit below.
        await new Promise((r) => setTimeout(r, 1000));
        const result = engine.verify(
          { monthlyIncome, previousDefault },
          { minimumIncome, requireNoDefault, lenderRef },
          wallet.address,
        );
        setOutcome(result);
        setHistory((prev) => [...prev, result]);
        setIsVerifying(false);
        setScreen("result");
        setPage("verify");
        setNotification(resultNotification(result));
      } catch (e) {
        setIsVerifying(false);
        setScreen("verifying");
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }

  function handleRestart() {
    setOutcome(null);
    setError(null);
    setNotification(null);
    setMinimumIncome(50000);
    setRequireNoDefault(true);
    setMonthlyIncome(65000);
    setPreviousDefault(false);
    setScreen("setup");
    setPage("verify");
  }

  function handleOpenDashboard() {
    setPage("dashboard");
    setDashboardTab("overview");
  }

  function handleGetCertificate() {
    setPage("dashboard");
    setDashboardTab("certificate");
  }

  function handleTabSelect(tab: DashboardTab) {
    setPage("dashboard");
    setDashboardTab(tab);
  }

  const deploymentNote = "On-chain deployment on Midnight Preprod is pending (needs a proof server and funded wallet). Contract address is not fabricated.";

  return (
    <div className="app" id="app">
      <div className="site-head">
        <Navbar
          wallet={wallet}
          connected={connected}
          isConnecting={isConnecting}
          activePage={page}
          activeTab={dashboardTab}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onNavigate={handleNavigate}
        />
        {page === "dashboard" && showDashboard && <DashboardTabs active={dashboardTab} onSelect={handleTabSelect} />}
      </div>

      {notification && <Notification notification={notification} onDismiss={() => setNotification(null)} />}

      {page === "home" && (
        <>
          <Hero
            onStart={handleStart}
            onHowItWorks={handleHowItWorks}
            wallet={wallet}
            connected={connected}
            isConnecting={isConnecting}
            onConnect={handleConnect}
          />

          <HowItWorks />

          <Features />
        </>
      )}

      {page === "privacy" && <PrivacySection />}

      {page === "verify" && (
        <section className="section flow-section" id="verification" aria-label="Eligibility check flow">
          <div className="section-head">
            <p className="eyebrow">Step by step</p>
            <h2>Check Your Eligibility</h2>
            <p className="section-sub">Choose your loan requirement, then verify privately.</p>
          </div>

          {error && (
            <div className="flow-error">
              <ErrorCard
                title="This step needs your attention"
                message={error}
                hint="The action could not be completed because the wallet or the verification engine was not ready."
                nextStep="Connect your wallet, then try again. If it keeps failing, refresh the page."
                onRetry={handleRunVerification}
                retryLabel="Try Again"
              />
            </div>
          )}

          <WalletStatus
            wallet={wallet}
            connected={connected}
            isConnecting={isConnecting}
            error={walletError}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />

          <ProgressSteps current={currentStep} />

          <div className="flow-panels">
            <div className={`flow-panel ${currentStep === "requirement" ? "is-active" : ""}`}>
              <div className="step-label" aria-hidden>Step 1 — Financial Information</div>
              <div className="setup-grid">
                <CredentialCard
                  issuerName={MOCK_ISSUER_NAME}
                  verified
                  monthlyIncome={monthlyIncome}
                  previousDefault={previousDefault}
                  onIncomeChange={(v) => {
                    setMonthlyIncome(Number.isNaN(v) || v < 0 ? 0 : v);
                    setOutcome(null);
                  }}
                  onDefaultChange={(v) => {
                    setPreviousDefault(v);
                    setOutcome(null);
                  }}
                />
                <RequirementForm
                  minimumIncome={minimumIncome}
                  requireNoDefault={requireNoDefault}
                  lenderRef={lenderRef}
                  onChange={(u) => {
                    setMinimumIncome(u.minimumIncome);
                    setRequireNoDefault(u.requireNoDefault);
                    setLenderRef(u.lenderRef);
                    setOutcome(null);
                  }}
                  onContinue={handleContinueToVerify}
                />
              </div>
            </div>

            <div className={`flow-panel ${currentStep === "verifying" ? "is-active" : ""}`}>
              <div className="step-label" aria-hidden>Step 2 — Verify privately</div>
              <VerificationStatus
                isVerifying={isVerifying}
                error={screen === "verifying" ? error : null}
                onRun={handleRunVerification}
                disabled={!connected}
              />
            </div>

            <div className={`flow-panel ${currentStep === "result" ? "is-active" : ""}`}>
              {outcome ? (
                <>
                  <div className="step-label" aria-hidden>Step 4 — Result</div>
                  <EligibilityResult
                    outcome={outcome}
                    onRestart={handleRestart}
                    onViewDashboard={handleOpenDashboard}
                    onGetCertificate={handleGetCertificate}
                  />
                </>
              ) : (
                <Card className="result-empty">
                  <div className="step-label" aria-hidden>Step 4 — Result</div>
                  <h3>Your Result</h3>
                  <p>Complete the flow to see your eligibility result here.</p>
                </Card>
              )}
            </div>
          </div>
        </section>
      )}

      {page === "dashboard" && showDashboard && (
        <section className="section section-alt dashboard-section" id="dashboard">
          <div className="constrain">
            {dashboardTab === "overview" && (
              <Dashboard
                wallet={wallet}
                connected={connected}
                history={history}
                onCheckEligibility={handleStart}
                onViewCertificate={handleGetCertificate}
              />
            )}
            {dashboardTab === "privacy" && <PrivacyDashboard credentialsPresent={connected} outcomePresent={outcome !== null} />}
            {dashboardTab === "history" && <VerificationHistory history={history} />}
            {dashboardTab === "lender" && <LenderPortal outcome={outcome} />}
            {dashboardTab === "certificate" && outcome && <EligibilityCertificate outcome={outcome} />}
            {dashboardTab === "certificate" && !outcome && <Card><p>Run a verification to generate a certificate.</p></Card>}
            {dashboardTab === "profile" && <ProfileSection wallet={wallet} connected={connected} history={history} />}
          </div>

          {dashboardTab === "overview" && outcome && (
            <div className="constrain">
              <RiskScore outcome={outcome} />
            </div>
          )}
        </section>
      )}

      <Footer deploymentNote={deploymentNote} onNavigate={handleNavigate} />
    </div>
  );
}