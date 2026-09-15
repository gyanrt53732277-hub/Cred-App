// ---------------------------------------------------------------------------
// CrediFi wallet-state persistence tests.
//
// These validate the versioned state-file format: a round-trip through
// readPersistedState/writePersistedState and the corruption/incompatibility
// safety behaviour. NO network access and no wallet SDK instantiation is
// involved -- they operate purely on the local filesystem representation.
// ---------------------------------------------------------------------------
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  PERSISTED_STATE_VERSION,
  isStateCompatible,
  readPersistedState,
  writePersistedState,
  type PersistedWalletState,
} from "../wallet-state.js";

function tempFile(name: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "credifi-wallet-state-"));
  return path.join(dir, name);
}

function validState(): PersistedWalletState {
  return {
    version: PERSISTED_STATE_VERSION,
    networkId: "preprod",
    seedHash: "aabbcc",
    shielded: "{\"publicKeys\":{\"coinPublicKey\":\"zk\",\"encryptionPublicKey\":\"zk\"}}",
    unshielded: "{\"publicKey\":{}}",
    dust: "{\"publicKey\":{}}",
  };
}

describe("CrediFi wallet-state persistence", () => {
  it("round-trips a valid persisted state through write then read", () => {
    const file = tempFile("preprod-v1.json");
    writePersistedState(file, validState());
    const loaded = readPersistedState(file);
    expect(loaded).not.toBeNull();
    expect(loaded?.version).toBe(PERSISTED_STATE_VERSION);
    expect(loaded?.networkId).toBe("preprod");
    expect(loaded?.shielded).toContain("coinPublicKey");
    expect(loaded?.unshielded).toBe(validState().unshielded);
    expect(loaded?.dust).toBe(validState().dust);
  });

  it("returns null for a missing file (no persisted state)", () => {
    expect(readPersistedState(path.join(os.tmpdir(), "does-not-exist-qa.json"))).toBeNull();
  });

  it("returns null for corrupt (non-JSON) content", () => {
    const file = tempFile("corrupt.json");
    fs.writeFileSync(file, "{ not json !!!", "utf8");
    expect(readPersistedState(file)).toBeNull();
  });

  it("returns null for an incompatible version", () => {
    const file = tempFile("wrong-version.json");
    fs.writeFileSync(file, JSON.stringify({ ...validState(), version: 99 }), "utf8");
    expect(readPersistedState(file)).toBeNull();
  });

  it("returns null when any required field is missing or mistyped", () => {
    const file = tempFile("incomplete.json");
    fs.writeFileSync(
      file,
      JSON.stringify({ version: PERSISTED_STATE_VERSION, networkId: "preprod", shielded: 123 }),
      "utf8",
    );
    expect(readPersistedState(file)).toBeNull();
  });

  it("restores only when version, networkId and seedHash all match", () => {
    const state = validState();
    expect(isStateCompatible(state, "preprod", state.seedHash)).toBe(true);
  });

  it("does not restore when the seedHash (wallet identity) mismatches", () => {
    const state = validState();
    expect(isStateCompatible(state, "preprod", "different-seed-hash")).toBe(false);
  });

  it("does not restore when the networkId mismatches even if seedHash matches", () => {
    const state = validState();
    expect(isStateCompatible(state, "testnet", state.seedHash)).toBe(false);
  });
});
