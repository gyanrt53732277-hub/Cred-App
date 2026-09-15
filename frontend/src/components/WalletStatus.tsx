import type { WalletErrorCode, WalletState } from "../wallet";
import { walletLabel } from "../wallet";
import { shortenAddress } from "../lib/format";
import { Button } from "./Button";
import { AlertIcon, CheckIcon, InfoIcon, WalletIcon, XIcon } from "./Icons";

type WalletErrorInfo = { code: WalletErrorCode; message: string };

type WalletStatusProps = {
  wallet: WalletState | null;
  connected: boolean;
  isConnecting: boolean;
  error: WalletErrorInfo | null;
  onConnect: () => void;
  onDisconnect: () => void;
};

// The official Midnight documentation page for installing/setting up the Lace
// wallet (used only for the "Install Wallet" action; never a fabricated URL).
const INSTALL_WALLET_URL = "https://docs.midnight.network/relnotes/lace";

export function WalletStatus({ wallet, connected, isConnecting, error, onConnect, onDisconnect }: WalletStatusProps) {
  return (
    <section className="constrain" aria-label="Wallet connection">
      <h2 className="flow-heading">
        <span className="flow-heading-icon" aria-hidden>
          <WalletIcon size={20} />
        </span>
        Connect wallet
      </h2>
      <p className="flow-sub">Connect your Midnight wallet to securely continue.</p>

      <div className="wallet-status">
        {connected && wallet ? (
          <ConnectedState wallet={wallet} onDisconnect={onDisconnect} />
        ) : isConnecting ? (
          <ConnectingState />
        ) : error ? (
          <ErrorState error={error} onConnect={onConnect} onInstall={() => window.open(INSTALL_WALLET_URL, "_blank")} />
        ) : (
          <IdleState onConnect={onConnect} />
        )}
      </div>

      <p className="flow-note">
        <InfoIcon size={15} />
        <span>You'll approve the connection in your wallet. Only your wallet address is shared.</span>
      </p>
    </section>
  );
}

function IdleState({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="wallet-status-not-connected">
      <span className="status-badge neutral" aria-hidden>
        <WalletIcon size={16} />
      </span>
      <div>
        <div className="wallet-status-row">
          <span className="status-label">Connect Wallet</span>
          <span className="status-value">Connect a Midnight-compatible wallet</span>
        </div>
        <p className="status-provider">
          Network: <strong>Midnight Preprod</strong> · DApp Connector
        </p>
        <Button variant="primary" size="sm" onClick={onConnect} icon={<WalletIcon />}>
          Connect wallet
        </Button>
      </div>
    </div>
  );
}

function ConnectingState() {
  return (
    <div className="wallet-status-not-connected">
      <span className="status-badge neutral is-pulsing" aria-hidden>
        <WalletIcon size={16} />
      </span>
      <div>
        <div className="wallet-status-row">
          <span className="status-label">Connecting…</span>
          <span className="status-value">Approve the connection in your wallet.</span>
        </div>
        <p className="status-provider" aria-hidden>
          Connecting&hellip;
        </p>
        <div className="skeleton skeleton-row" aria-hidden>
          <span className="skeleton-block skeleton-md" />
          <span className="skeleton-block skeleton-sm" />
        </div>
      </div>
    </div>
  );
}

function ConnectedState({ wallet, onDisconnect }: { wallet: WalletState; onDisconnect: () => void }) {
  return (
    <div className="wallet-status-connected">
      <span className="status-badge ok" aria-hidden>
        <CheckIcon size={16} />
      </span>
      <div className="wallet-status-info">
        <div className="wallet-status-row">
          <span className="status-label">Wallet Connected</span>
          <span className="addr">{shortenAddress(wallet.address)}</span>
        </div>
        <p className="status-provider">
          {walletLabel()} · network <strong>Midnight Preprod</strong>
        </p>
        <div className="wallet-status-meta" aria-label="Connection details">
          <span className="badge badge-verified">Connected</span>
          <span className="badge badge-eligible">Preprod</span>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onDisconnect} aria-label="Disconnect wallet">
        Disconnect
      </Button>
    </div>
  );
}

function ErrorState({
  error,
  onConnect,
  onInstall,
}: {
  error: WalletErrorInfo;
  onConnect: () => void;
  onInstall: () => void;
}) {
  const { code, message } = error;

  const body = (() => {
    switch (code) {
      case "not-detected":
        return {
          title: "Wallet not detected",
          icon: <AlertIcon size={16} />,
          action: (
            <>
              <Button variant="primary" size="sm" onClick={onInstall} icon={<WalletIcon />}>
                Install Wallet
              </Button>
              <Button variant="ghost" size="sm" onClick={onConnect}>
                Try Again
              </Button>
            </>
          ),
        };
      case "rejected":
        return {
          title: "Connection cancelled",
          icon: <XIcon size={16} />,
          action: (
            <Button variant="primary" size="sm" onClick={onConnect}>
              Try Again
            </Button>
          ),
        };
      case "wrong-network":
        return {
          title: "Wrong network",
          icon: <AlertIcon size={16} />,
          action: (
            <Button variant="primary" size="sm" onClick={onConnect}>
              Try Again
            </Button>
          ),
        };
      default:
        return {
          title: "Connection failed",
          icon: <AlertIcon size={16} />,
          action: (
            <Button variant="primary" size="sm" onClick={onConnect}>
              Try Again
            </Button>
          ),
        };
    }
  })();

  return (
    <div className="wallet-status-error" role="alert">
      <span className="status-badge bad" aria-hidden>
        {body.icon}
      </span>
      <div className="wallet-status-info">
        <div className="wallet-status-row">
          <span className="status-label">{body.title}</span>
        </div>
        <p className="status-provider">{message}</p>
      </div>
      <div className="wallet-action">{body.action}</div>
    </div>
  );
}