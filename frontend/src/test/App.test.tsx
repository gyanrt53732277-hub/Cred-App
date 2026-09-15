// ---------------------------------------------------------------------------
// App tests: state-based navigation, wallet connection and the eligibility
// result notifications.
//
// Production code contains NO mock/simulated wallet. To exercise the real
// DApp Connector code path we inject a FAKE wallet connector into
// `window.midnight` HERE, in the test environment only. This satisfies
// "keep mocks only inside tests" — the production browser flow never uses it.
//
// Navigation note: CrediFi opens views/tabs by switching React state. Clicking
// a navigation button shows the destination view directly — no scrollIntoView,
// no anchor scrolling. These tests assert the views/tabs that open.
// ---------------------------------------------------------------------------
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "../App";
import { shortenAddress } from "../lib/format";
import type { ConnectedAPI, InitialAPI } from "@midnight-ntwrk/dapp-connector-api";

const connectButtons = () => screen.getAllByRole("button", { name: /^connect wallet$/i });
// The in-flow wallet panel button is rendered after the navbar one.
const walletConnectButton = () => connectButtons()[connectButtons().length - 1];

// "Check Eligibility" appears in the navbar and (on the home view) the hero.
// Nav buttons all OPEN views directly (state-based navigation).
const allCheckButtons = () => screen.getAllByRole("button", { name: /^check eligibility$/i });

// Clicking the navbar "Check Eligibility" opens the eligibility view directly.
function openEligibility() {
  fireEvent.click(allCheckButtons()[0]);
}

function openNav(label: RegExp | string) {
  const el = screen.getAllByRole("button", { name: label })[0];
  expect(el).toBeInTheDocument();
  fireEvent.click(el);
}

type ConnectorOverrides = {
  networkId?: string;
  address?: string;
  rejectWithCode?: string;
  stale?: boolean;
};

function installFakeConnector(opts: ConnectorOverrides = {}): { connector: InitialAPI; calls: string[] } {
  const calls: string[] = [];
  const connector: InitialAPI = {
    rdns: "io.lace.test",
    name: "Test Lace",
    icon: "",
    apiVersion: "4.0.1",
    connect: vi.fn(async (networkId: string) => {
      calls.push(`connect:${networkId}`);
      const api: any = {
        getConnectionStatus: vi.fn(async () =>
          opts.stale ? { status: "disconnected" } : { status: "connected", networkId: opts.networkId ?? "preprod" },
        ),
        getShieldedAddresses: vi.fn(async () => ({
          shieldedAddress: opts.address ?? "mn_shield_addr_test1f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0",
          shieldedCoinPublicKey: "mn_shield_cpk_test1",
          shieldedEncryptionPublicKey: "mn_shield_epk_test1",
        })),
        getUnshieldedAddress: vi.fn(async () => ({ unshieldedAddress: "mn_unshield_addr_test1" })),
      };
      if (opts.rejectWithCode) {
        const err = new Error("user rejected") as unknown as Error & { type: string; code: string; reason: string };
        err.type = "DAppConnectorAPIError";
        err.code = opts.rejectWithCode;
        err.reason = "user rejected the request";
        throw err;
      }
      return api;
    }),
  };
  (window as unknown as { midnight?: Record<string, InitialAPI> }).midnight = { mnLace: connector };
  return { connector, calls };
}

function clearConnector() {
  delete (window as unknown as { midnight?: Record<string, InitialAPI> }).midnight;
}

describe("CrediFi navigation (direct view/tab opening, no scrolling)", () => {
  afterEach(() => clearConnector());

  it("initial view is Home, not the wallet/eligibility panels", () => {
    render(<App />);
    expect(screen.getAllByText("Prove your eligibility.").length).toBeGreaterThan(0);
    expect(screen.queryByText("Connect a Midnight-compatible wallet")).not.toBeInTheDocument();
  });

  it("Check Eligibility opens the eligibility view directly", () => {
    render(<App />);
    openEligibility();
    expect(screen.getAllByText("Connect a Midnight-compatible wallet").length).toBeGreaterThan(0);
    expect(screen.queryByText("Prove your eligibility.")).not.toBeInTheDocument();
  });

  it("Home returns to the home view", () => {
    render(<App />);
    openEligibility();
    openNav(/^home$/i);
    expect(screen.getAllByText("Prove your eligibility.").length).toBeGreaterThan(0);
    expect(screen.queryByText("Connect a Midnight-compatible wallet")).not.toBeInTheDocument();
  });

  it("Privacy opens the privacy view directly", () => {
    render(<App />);
    openNav(/^privacy$/i);
    expect(screen.getAllByText("Your financial information stays private.").length).toBeGreaterThan(0);
  });

  it("Dashboard / History / Certificate route to the eligibility view when not connected", () => {
    render(<App />);
    for (const label of [/^dashboard$/i, /^history$/i, /^certificate$/i]) {
      openNav(label);
      expect(screen.getAllByText("Connect a Midnight-compatible wallet").length).toBeGreaterThan(0);
    }
  });
});

describe("CrediFi wallet connection (real DApp Connector)", () => {
  afterEach(() => clearConnector());

  it("TEST 1: initial state is disconnected (no wallet connected)", () => {
    render(<App />);
    openEligibility();
    expect(screen.getByText("Connect a Midnight-compatible wallet")).toBeInTheDocument();
    expect(screen.queryByText(/Wallet Connected/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^mn_/)).not.toBeInTheDocument();
  });

  it("TEST 2 + 3 + 4: clicking Connect Wallet triggers the connector and shows the real address after approval", async () => {
    const { connector } = installFakeConnector({ address: "mn_shield_addr_testRealAddress123456" });
    render(<App />);
    openEligibility();

    fireEvent.click(walletConnectButton());

    await waitFor(() => expect(connector.connect).toHaveBeenCalledWith("preprod"));
    expect(await screen.findByText(/Wallet Connected/i)).toBeInTheDocument();
    // The UI intentionally shows the REAL wallet address in shortened form
    // (navbar chip + wallet panel), so it can legitimately appear twice.
    expect(screen.getAllByText(shortenAddress("mn_shield_addr_testRealAddress123456")).length).toBeGreaterThan(0);
  });

  it("TEST 3: shows Connecting while awaiting wallet approval", async () => {
    let resolveConnect!: () => void;
    const connector = {
      rdns: "io.lace.test",
      name: "Test Lace",
      icon: "",
      apiVersion: "4.0.1",
      connect: vi.fn(() =>
        new Promise<ConnectedAPI>((resolve) => {
          resolveConnect = () =>
            resolve({
              getConnectionStatus: async () => ({ status: "connected", networkId: "preprod" }),
              getShieldedAddresses: async () => ({
                shieldedAddress: "mn_shield_addr_testPending",
                shieldedCoinPublicKey: "mn_shield_cpk_test1",
                shieldedEncryptionPublicKey: "mn_shield_epk_test1",
              }),
              getUnshieldedAddress: async () => ({ unshieldedAddress: "" }),
            } as unknown as ConnectedAPI);
        }),
      ),
    } as unknown as InitialAPI;
    (window as unknown as { midnight?: Record<string, InitialAPI> }).midnight = { mnLace: connector };

    render(<App />);
    openEligibility();
    fireEvent.click(walletConnectButton());

    expect((await screen.findAllByText(/Connecting\.\.\./i)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Approve the connection in your wallet/i).length).toBeGreaterThan(0);

    resolveConnect();
    expect(await screen.findByText(/Wallet Connected/i)).toBeInTheDocument();
  });

  it("TEST 5: user rejection leaves the app disconnected and shows a message", async () => {
    installFakeConnector({ rejectWithCode: "Rejected" });
    render(<App />);
    openEligibility();

    fireEvent.click(walletConnectButton());

    expect(await screen.findByText(/Connection cancelled/i)).toBeInTheDocument();
    expect(screen.queryByText(/Wallet Connected/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^mn_/)).not.toBeInTheDocument();
  });

  it("TEST 6: no wallet detected leaves the app disconnected", async () => {
    clearConnector();
    render(<App />);
    openEligibility();

    fireEvent.click(walletConnectButton());

    expect((await screen.findAllByText(/Wallet not detected/i)).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Wallet Connected/i)).not.toBeInTheDocument();
  });

  it("TEST 7: no fake/demo/simulated address ever appears after connecting", async () => {
    installFakeConnector({ address: "mn_shield_addr_testAuthentic987654" });
    render(<App />);
    openEligibility();

    fireEvent.click(walletConnectButton());
    await screen.findByText(/Wallet Connected/i);

    expect(screen.queryByText(/simulated/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/preprod:sim:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/demo wallet/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(shortenAddress("mn_shield_addr_testAuthentic987654")).length).toBeGreaterThan(0);
  });

  it("TEST 7b: wrong network is reported and the app stays disconnected", async () => {
    installFakeConnector({ networkId: "mainnet" });
    render(<App />);
    openEligibility();

    fireEvent.click(walletConnectButton());

    expect((await screen.findAllByText(/Wrong network/i)).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Wallet Connected/i)).not.toBeInTheDocument();
  });

  it("TEST 8: Disconnect returns to the disconnected state", async () => {
    installFakeConnector({ address: "mn_shield_addr_testDisconnectMe" });
    render(<App />);
    openEligibility();

    fireEvent.click(walletConnectButton());
    await screen.findByText(/Wallet Connected/i);

    const disconnects = screen.getAllByRole("button", { name: /^disconnect$/i });
    fireEvent.click(disconnects[disconnects.length - 1]);

    expect(await screen.findByText("Connect a Midnight-compatible wallet")).toBeInTheDocument();
    expect(screen.queryByText(/Wallet Connected/i)).not.toBeInTheDocument();
  });

  it("TEST 9: wallet injected under an unknown/UUID key is still discovered by enumeration (real CAIP-372 wallets)", async () => {
    const connector: InitialAPI = {
      rdns: "io.example.wallet",
      name: "Example Wallet",
      icon: "",
      apiVersion: "4.0.1",
      connect: vi.fn(async () => ({
        getConnectionStatus: async () => ({ status: "connected", networkId: "preprod" }),
        getShieldedAddresses: async () => ({
          shieldedAddress: "mn_shield_addr_testUuidWallet99",
          shieldedCoinPublicKey: "mn_shield_cpk_test",
          shieldedEncryptionPublicKey: "mn_shield_epk_test",
        }),
        getUnshieldedAddress: async () => ({ unshieldedAddress: "mn_unshield_test" }),
      } as unknown as ConnectedAPI)),
    };
    (window as unknown as { midnight?: Record<string, InitialAPI> }).midnight = {
      "3f7a9c2e-1f4a-4b8d-9c10-2e6d8a1b3c5d": connector,
    };

    render(<App />);
    openEligibility();
    fireEvent.click(walletConnectButton());

    expect(await screen.findByText(/Wallet Connected/i)).toBeInTheDocument();
    expect(screen.getAllByText(shortenAddress("mn_shield_addr_testUuidWallet99")).length).toBeGreaterThan(0);
  });

  it("TEST 10: stable Lace connector is preferred when several connectors are injected", async () => {
    const other: InitialAPI = {
      rdns: "io.other.wallet",
      name: "Other Wallet",
      icon: "",
      apiVersion: "4.0.1",
      connect: vi.fn(async () => ({}) as unknown as ConnectedAPI),
    };
    const lace: InitialAPI = {
      rdns: "io.midnight.lace",
      name: "Lace",
      icon: "",
      apiVersion: "4.0.1",
      connect: vi.fn(async () => ({
        getConnectionStatus: async () => ({ status: "connected", networkId: "preprod" }),
        getShieldedAddresses: async () => ({
          shieldedAddress: "mn_shield_addr_testPrefersLace",
          shieldedCoinPublicKey: "mn_shield_cpk_test",
          shieldedEncryptionPublicKey: "mn_shield_epk_test",
        }),
        getUnshieldedAddress: async () => ({ unshieldedAddress: "mn_unshield_test" }),
      } as unknown as ConnectedAPI)),
    };
    (window as unknown as { midnight?: Record<string, InitialAPI> }).midnight = {
      other,
      mnLace: lace,
    };

    render(<App />);
    openEligibility();
    fireEvent.click(walletConnectButton());

    expect(lace.connect).toHaveBeenCalledWith("preprod");
    expect(other.connect).not.toHaveBeenCalled();
    await screen.findByText(/Wallet Connected/i);
    expect(screen.getAllByText(shortenAddress("mn_shield_addr_testPrefersLace")).length).toBeGreaterThan(0);
  });

  it("TEST 11: shielded address read failing falls back to the real unshielded address", async () => {
    const connector: InitialAPI = {
      rdns: "io.midnight.lace",
      name: "Lace",
      icon: "",
      apiVersion: "4.0.1",
      connect: vi.fn(async () => ({
        getConnectionStatus: async () => ({ status: "connected", networkId: "preprod" }),
        getShieldedAddresses: async () => {
          throw new Error("no shielded keys yet");
        },
        getUnshieldedAddress: async () => ({ unshieldedAddress: "mn_unshield_fallback9a8b7c6d5e" }),
      } as unknown as ConnectedAPI)),
    };
    (window as unknown as { midnight?: Record<string, InitialAPI> }).midnight = { mnLace: connector };

    render(<App />);
    openEligibility();
    fireEvent.click(walletConnectButton());

    await screen.findByText(/Wallet Connected/i);
    expect(screen.getAllByText(shortenAddress("mn_unshield_fallback9a8b7c6d5e")).length).toBeGreaterThan(0);
  });
});

describe("eligibility result notifications", () => {
  afterEach(() => clearConnector());

  /** Connects, runs the real verification and waits for the notification to appear. */
  async function connectAndRun(opts: { address?: string; monthlyIncome?: number }) {
    installFakeConnector({ address: opts.address ?? "mn_shield_addr_testNotificationWallet" });
    render(<App />);
    openEligibility();
    fireEvent.click(walletConnectButton());
    await screen.findByText(/Wallet Connected/i);

    if (opts.monthlyIncome !== undefined) {
      const incomeInput = screen.getByPlaceholderText("e.g. 65000");
      fireEvent.change(incomeInput, { target: { value: String(opts.monthlyIncome) } });
    }

    // Step 1 complete -> step 2 (verify privately) opens.
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    // Run the real verification (navbar + run button both say Check Eligibility).
    const run = screen.getAllByRole("button", { name: /^check eligibility$/i });
    fireEvent.click(run[run.length - 1]);

    await waitFor(
      () =>
        expect(
          screen.getAllByText(/Congratulations! You are Eligible\.|Sorry, You are Not Eligible\./i).length,
        ).toBeGreaterThan(0),
      { timeout: 15000 },
    );
  }

  it("eligible: prominent success notification, then the eligible result UI", async () => {
    await connectAndRun({ monthlyIncome: 65000 });

    const title = screen.getByText("🎉 Congratulations! You are Eligible.");
    expect(title).toBeInTheDocument();
    expect(title.closest(".notification-success")).not.toBeNull();
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);
    // Existing eligibility result UI is shown for the eligible applicant.
    expect(screen.getAllByText("Eligible").length).toBeGreaterThan(0);
  });

  it("not eligible: prominent warning notification, then the declined result UI", async () => {
    await connectAndRun({ monthlyIncome: 30000 });

    const title = screen.getByText("Sorry, You are Not Eligible.");
    expect(title).toBeInTheDocument();
    expect(title.closest(".notification-error")).not.toBeNull();
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Not Eligible").length).toBeGreaterThan(0);
    expect(screen.queryByText("🎉 Congratulations! You are Eligible.")).not.toBeInTheDocument();
  });
});