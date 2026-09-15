// ---------------------------------------------------------------------------
// Mock Verified Financial Credential Issuer
//
// MVP limitation: this simulates a trusted credential issuer (a stand-in for a
// bank, employer, or licensed verification provider). It signs financial
// credentials with Schnorr signatures on Midnight's native Jubjub curve so the
// CrediFi smart contract can verify, inside the ZK circuit, that the credential
// really came from a trusted source and was not fabricated by the user.
//
// The issuer secret key is DETERMINISTIC (frozen constant) so the demo is
// repeatable and runs entirely in the browser: the same public key gets
// registered on-chain and the same key signs the demo credentials. This is
// strictly an MVP simulation -- the secret key must NEVER live in client code
// in production. In production the issuer runs as a trusted backend service
// (bank / employer / verification provider) that owns its private key.
//
// CRITICAL CONSISTENCY: the challenge hash below is built so that it hashes the
// EXACT bytes the compiled credifi circuit hashes in `schnorrVerify` (a
// transientHash over ann_x | ann_y | pk_x | pk_y | msg). The unit tests prove
// this by running the compiled circuit on signatures produced here.
//
// The exact income never leaves the user's machine in a readable form: it is
// only fed into the ZK circuit as witness data and is never disclosed.
// ---------------------------------------------------------------------------
import * as RT from "@midnight-ntwrk/compact-runtime";
import { ecMulGenerator } from "@midnight-ntwrk/compact-runtime";
import type { JubjubPoint } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";

export const MOCK_ISSUER_NAME = "Mock Verified Financial Credential Issuer";
export const MOCK_ISSUER_ID = 1n;

// Jubjub scalar field order. ecMulGenerator rejects scalars >= curve order.
export const JUBJUB_ORDER = 6554484396890773809930967563523245729705921265872317281365359162392183254199n;
export const TWO_248 = 452312848583266388373324160190187140051835877600158453279131187530910662656n;

export const normalizeScalar = (sk: bigint): bigint =>
  ((sk % JUBJUB_ORDER) + JUBJUB_ORDER) % JUBJUB_ORDER;

// Byte value of the issuer name string, reduced into the Jubjub scalar field.
// Deterministic and browser-safe (no Node crypto dependency).
const MOCK_ISSUER_SECRET_BYTES = Array.from(new TextEncoder().encode(MOCK_ISSUER_NAME));
const MOCK_ISSUER_SECRET = MOCK_ISSUER_SECRET_BYTES.reduce((acc, b) => acc * 256n + BigInt(b), 0n);

const randomScalar = (): bigint => {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return normalizeScalar(
    Array.from(bytes).reduce((acc, b) => acc * 256n + BigInt(b), 0n),
  );
};

/** The deterministic mock issuer secret key. SIMULATION ONLY. */
export const getMockIssuerSecretKey = (): bigint => normalizeScalar(MOCK_ISSUER_SECRET);

/** Deterministic mock issuer key pair (same public key every run). */
export function generateIssuerKeyPair(): { sk: bigint; pk: JubjubPoint } {
  const sk = getMockIssuerSecretKey();
  return { sk, pk: ecMulGenerator(sk) };
}

// --- Schnorr challenge hash, byte-compatible with the compiled circuit -------

const FIELD = RT.CompactTypeField;
const MSG3 = new RT.CompactTypeVector(3, FIELD);

// Mirrors the compiled contract's `_SchnorrHashInput_0` descriptor:
//   Struct { ann_x: Field, ann_y: Field, pk_x: Field, pk_y: Field,
//            msg: Vector<3, Field> }
class SchnorrHashInput {
  alignment() {
    return FIELD.alignment()
      .concat(FIELD.alignment().concat(FIELD.alignment().concat(FIELD.alignment().concat(MSG3.alignment()))));
  }
  fromValue(value: unknown) {
    return value;
  }
  toValue(value: { ann_x: bigint; ann_y: bigint; pk_x: bigint; pk_y: bigint; msg: bigint[] }): Uint8Array[] {
    return FIELD.toValue(value.ann_x)
      .concat(FIELD.toValue(value.ann_y))
      .concat(FIELD.toValue(value.pk_x))
      .concat(FIELD.toValue(value.pk_y))
      .concat(MSG3.toValue(value.msg));
  }
}

const SCHNORR_HASH_INPUT = new SchnorrHashInput();

export function schnorrChallenge(R: JubjubPoint, pk: JubjubPoint, msg: bigint[]): bigint {
  return RT.transientHash(SCHNORR_HASH_INPUT, {
    ann_x: R.x,
    ann_y: R.y,
    pk_x: pk.x,
    pk_y: pk.y,
    msg,
  });
}

// --- Signing ----------------------------------------------------------------

/** Signs a vector of field-message elements with Schnorr over Jubjub. */
export function signMessage(sk: bigint, msg: bigint[]): SchnorrSignature {
  sk = normalizeScalar(sk);
  const pk = ecMulGenerator(sk);
  const k = randomScalar();
  const R = ecMulGenerator(k);
  const cFull = schnorrChallenge(R, pk, msg);
  const c = cFull % TWO_248;
  const s = normalizeScalar(k + c * sk);
  return { announcement: R, response: s };
}

export type SchnorrSignature = {
  announcement: JubjubPoint;
  response: bigint;
};

export type IssuedCredential = {
  signature: SchnorrSignature;
  issuerId: bigint;
};

/**
 * Issues a signed financial credential for the given holder.
 *
 * @param sk               issuer secret key
 * @param monthlyIncome    the holder's verified monthly income (PRIVATE, never public)
 * @param previousDefault  whether the holder has a previous loan default
 * @param userPubKeyHash   the contract-bound hash of the holder's derived key
 */
export function issueCredential(
  sk: bigint,
  monthlyIncome: bigint,
  previousDefault: boolean,
  userPubKeyHash: bigint,
): IssuedCredential {
  const defaultFlag = previousDefault ? 1n : 0n;
  const signature = signMessage(sk, [monthlyIncome, defaultFlag, userPubKeyHash]);
  return { signature, issuerId: MOCK_ISSUER_ID };
}