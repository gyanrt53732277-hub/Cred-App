# CrediFi — MVP Scope (5 Attestation Approaches)

The CrediFi MVP delivers **five attestation approaches** that collectively satisfy
the Level 4 goal of proving loan eligibility and risk **without revealing private
financial data**. Each is implemented in the Compact contract and proven by tests.

## 1. Private income check (threshold attestation)

The circuit proves `monthlyIncome >= minimumIncome` on a **private witness**
without disclosing the income itself. The ledger stores only the boolean
`incomeSatisfied`.

- Proof: `eligibility.test.ts` cases 1/2 ("income >= threshold", "below threshold");
  `privacy.test.ts` asserts the exact income string never appears in serialized public state.

## 2. Default-history check (binary risk flag attestation)

The circuit proves `previousDefaultFlag == 0` (or allows a past default when the
lender does not require a clean history) on a **private witness**. The raw flag
is never stored — only the boolean `defaultRequirementSatisfied` is disclosed.

- Proof: `eligibility.test.ts` cases 3/4 and the `requireNoDefault=false` cases;
  `privacy.test.ts` asserts the default flag and signature material are absent from the result record.

## 3. Eligibility decision (composite proof)

The circuit combines both checks into a single `eligible` verdict:
`eligible = incomeSatisfied && (defaultRequirementSatisfied || !requireNoDefault)`.
One closed-form ZK proof yields the lender's yes/no answer.

- Proof: the full eligibility matrix in `eligibility.test.ts` (10 tests) and
  `engine.test.ts` (7 tests through the frontend engine).

## 4. Multi-lender verification records (per-request attestations)

Each verification is stored under the holder's derived identity hash as a
numbered record, so a holder can obtain attestations for **many lenders /
thresholds** and each request produces an independently verifiable,
unlinkable-by-default entry.

- Proof: `eligibility.test.ts` "supports many simultaneous verifications with distinct result ids";
  `engine.test.ts` "tracks multiple verifications with distinct result ids".

## 5. Tamper-evident credential binding (authenticity attestation)

Every credential is **signed by a registered issuer** with a Schnorr signature
over Jubjub, and the challenge hash is bound to the holder's derived identity.
This prevents fabrication, tampering with income, replaying under a different
identity, and misuse of an unregistered signing key.

- Proof: `eligibility.test.ts` "issuer authentication" group (rejects unregistered
  issuer, tampered income, replayed identity, and wrong signing key).

## Summary

| # | Attestation                 | Private input      | Public output            |
| - | --------------------------- | ------------------ | ------------------------ |
| 1 | Private income check        | income             | `incomeSatisfied`        |
| 2 | Default-history check       | default flag       | `defaultRequirementSatisfied` |
| 3 | Eligibility decision        | income + flag      | `eligible`               |
| 4 | Multi-lender records        | income + flag      | numbered result records  |
| 5 | Tamper-evident binding      | signature + secret | valid `VerificationResult` |
