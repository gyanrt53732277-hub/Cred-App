// ---------------------------------------------------------------------------
// Applies the minimal, durable patch to the wallet-sdk-node-client needed to
// fix a real bug: on `InBlock`, the SDK's `#handleSubmissionResult` calls
// `emit.end()` + `unsubscribe()`, which terminates the transaction-status event
// stream before the `Finalized` stage can ever be observed. Because the wallet
// facade waits for `'Finalized'` (`wallet-sdk-facade` calls
// `submissionService.submitTransaction(tx,'Finalized')`), that premature end
// surfaced as the onNone error:
//
//   TransactionProgressError { desiredStage: 'Finalized',
//     "Transaction did not reach desired stage and no other error was reported" }
//
// The fix removes the InBlock `emit.end()`/`unsubscribe()` so the watch keeps
// running and the node's `Finalized` status (which the handler already emits at
// isFinalized) can be delivered. This is a source-level edit under node_modules;
// a `postinstall` hook reapplies it so reinstalls don't silently regress.
//
// No secrets, addresses, or on-chain writes are involved. The target file is a
// build artifact of the published package; patch it idempotently.
// ---------------------------------------------------------------------------
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

// Resolve the package file from this script's location. The packages live under
// the repo root's node_modules; from scripts/ that is one level up (or two if
// contract/ itself has a node_modules, which is empty in this workspace).
const candidates = [
  join(here, "../node_modules/@midnight-ntwrk/wallet-sdk-node-client/dist/effect/PolkadotNodeClient.js"),
  join(here, "../../node_modules/@midnight-ntwrk/wallet-sdk-node-client/dist/effect/PolkadotNodeClient.js"),
];
const target = candidates.find((p) => existsSync(p));

function main() {
  if (!target) {
    console.warn("[fix-sdk-finalize] wallet-sdk-node-client not found; skipping");
    return;
  }

  const source = readFileSync(target, "utf8");

  // The 24-space prefix is unique to the InBlock branch; the Finalized branch
  // uses 16-space indentation so this will never match there.
  const pre = [
    "                        await emit.end();",
    "                        await unsubscribe();",
  ].join("\n");

  if (source.includes(pre)) {
    // Remove the two lines plus the trailing newline.
    const next = source.replace(pre + "\n", "");
    writeFileSync(target, next, "utf8");
    console.log("[fix-sdk-finalize] patched:", target);
  } else {
    console.log("[fix-sdk-finalize] already patched or not found:", target);
  }
}

main();