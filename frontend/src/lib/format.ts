// ---------------------------------------------------------------------------
// Small formatting helpers for the CrediFi UI.
// ---------------------------------------------------------------------------

/**
 * Shortens a wallet address for display, e.g. "0x8A3F...91C2".
 * If the address is already short, it is returned unchanged.
 */
export function shortenAddress(address: string, head = 6, tail = 4): string {
  if (!address) return "";
  const compact = address.replace(/^preprod:|^testnet:|^local:/, "");
  if (compact.length <= head + tail + 1) return compact;
  return `${compact.slice(0, head)}…${compact.slice(-tail)}`;
}

/** A short numeric notation for income thresholds, e.g. 65,000 → "65,000". */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);
}

/** Formats money with the INR symbol used by the demo, e.g. ₹50,000. */
export function formatMoney(value: number, currency = "₹"): string {
  return `${currency}${formatNumber(value)}`;
}
