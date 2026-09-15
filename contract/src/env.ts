// ---------------------------------------------------------------------------
// Secure environment configuration for the CrediFi deploy/verify CLI.
//
// Wallet credentials are read ONLY from the environment (a git-ignored
// `.env.preprod` file, loaded here via dotenv). They are never hard-coded,
// printed, or committed. The legacy `DEPLOYER_SEED` sentence is explicitly
// rejected so it can never be mistaken for a real funded wallet.
// ---------------------------------------------------------------------------
import { config as loadEnv } from "dotenv";
import { mnemonicToSeedSync } from "@scure/bip39";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
// The canonical credential file is `contract/.env.preprod` (git-ignored), which
// is what an operator places beside the contract when running `npm run deploy`
// from the contract workspace. env.ts lives in contract/src, so it sits one
// directory above here. We also fall back to the legacy repo-root location and
// to a CWD `.env`. dotenv does NOT override already-set variables by default, so
// loading the intended file first keeps it authoritative while the fallbacks
// only fill gaps.
loadEnv({ path: join(here, "../.env.preprod") });
loadEnv({ path: join(here, "../../.env.preprod") });
loadEnv();

const HEX_SEED_RE = /^[0-9a-fA-F]{64}$/;

// Reject the legacy DEPLOYER_SEED credential whenever it is present in the
// environment so a real deployment can never silently use it.
export function rejectLegacyDeployerSeed(): void {
  const legacy = process.env.DEPLOYER_SEED;
  if (legacy && legacy.trim().length > 0) {
    throw new Error(
      "[CrediFi] Refusing to deploy: legacy DEPLOYER_SEED is set in the environment. " +
        "It is a deterministic demo sentence, NOT a funded wallet credential. " +
        "Set MIDNIGHT_PREPROD_SEED (64 hex chars) or MIDNIGHT_PREPROD_MNEMONIC (24-word phrase) instead " +
        "in a git-ignored .env.preprod, and unset DEPLOYER_SEED.",
    );
  }
}

/**
 * Returns the raw wallet seed bytes derived from `MIDNIGHT_PREPROD_SEED`
 * (64 hex chars -> 32 bytes) or `MIDNIGHT_PREPROD_MNEMONIC` (24-word phrase ->
 * 64-byte BIP-39 seed). Exactly one of the two must be set.
 */
export function loadDeployerSeed(): Uint8Array {
  rejectLegacyDeployerSeed();

  const hexSeed = process.env.MIDNIGHT_PREPROD_SEED;
  const mnemonic = process.env.MIDNIGHT_PREPROD_MNEMONIC;

  if (hexSeed && mnemonic) {
    throw new Error(
      "[CrediFi] Set exactly ONE of MIDNIGHT_PREPROD_SEED or MIDNIGHT_PREPROD_MNEMONIC, not both.",
    );
  }

  if (hexSeed) {
    if (!HEX_SEED_RE.test(hexSeed)) {
      throw new Error(
        "[CrediFi] MIDNIGHT_PREPROD_SEED must be exactly 64 hexadecimal characters (32 bytes). " +
          "Did you supply the legacy DEPLOYER_SEED sentence by mistake?",
      );
    }
    return Buffer.from(hexSeed, "hex");
  }

  if (mnemonic) {
    const words = mnemonic.trim().split(/\s+/);
    if (words.length !== 24) {
      throw new Error(
        "[CrediFi] MIDNIGHT_PREPROD_MNEMONIC must be a 24-word phrase. " +
          "Did you supply the legacy DEPLOYER_SEED sentence by mistake?",
      );
    }
    return mnemonicToSeedSync(mnemonic.trim());
  }

  throw new Error(
    "[CrediFi] No wallet credential found. Set MIDNIGHT_PREPROD_SEED (64 hex chars) or " +
      "MIDNIGHT_PREPROD_MNEMONIC (24-word phrase) in a git-ignored .env.preprod.",
  );
}

/**
 * Returns the password used to encrypt the private-state store. The
 * level-private-state-provider enforces >= 16 chars and >= 3 of 4 character
 * classes.
 */
export function loadPrivateStatePassword(): string {
  const pw = process.env.PRIVATE_STATE_PASSWORD;
  if (!pw || pw.length === 0) {
    throw new Error(
      "[CrediFi] PRIVATE_STATE_PASSWORD is not set. Set it in a git-ignored .env.preprod " +
        "(>= 16 characters, >= 3 of: uppercase, lowercase, digits, special).",
    );
  }
  return pw;
}

/** Whether `DEPLOY_CONFIRM=true` is set — required to actually submit a deploy. */
export function deployConfirmed(): boolean {
  return process.env.DEPLOY_CONFIRM === "true";
}
