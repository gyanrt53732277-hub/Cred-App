import type { VerificationOutcome } from "../engine";
import { satisfiedLabels, unmetLabels } from "../lib/eligibility";
import { formatMoney } from "../lib/format";
import { BrandMark, CheckIcon, LockIcon, XIcon } from "./Icons";

type EligibilityCertificateProps = {
  outcome: VerificationOutcome;
};

export function EligibilityCertificate({ outcome }: EligibilityCertificateProps) {
  const met = satisfiedLabels(outcome);
  const unmet = unmetLabels(outcome);
  const shownAt = new Date().toISOString();

  return (
    <section className="certificate-section" aria-label="Eligibility certificate">
      <div className="section-head">
        <p className="eyebrow">Certificate</p>
        <h2>CrediFi Eligibility Certificate</h2>
        <p className="section-sub">
          A professional, printable record of your verified result. It contains only verified
          information — never your private financial values.
        </p>
      </div>

      <div className={`certificate ${outcome.eligible ? "is-eligible" : "is-declined"}`} role="region" aria-label="Certificate document">
        <div className="cert-header">
          <BrandMark size={40} />
          <div>
            <p className="cert-brand">CrediFi</p>
            <p className="cert-sub">Privacy-preserving eligibility verification · Midnight Preprod</p>
          </div>
        </div>

        <div className="cert-body">
          <div className={`cert-stamp ${outcome.eligible ? "ok" : "no"}`} aria-hidden>
            <span className="cert-stamp-icon">{outcome.eligible ? <CheckIcon size={26} /> : <XIcon size={24} />}</span>
            <span>{outcome.eligible ? "Eligible" : "Not eligible"}</span>
          </div>

          <h3 className="cert-title">CrediFi Eligibility Certificate</h3>
          <p className="cert-lede">This certificate confirms a privacy-preserving verification was completed.</p>

          <dl className="cert-facts">
            <div className="cert-fact">
              <dt>Requirement</dt>
              <dd>
                Min income {formatMoney(outcome.minimumIncome)}
                {outcome.requireNoDefault ? " · no prior default" : ""}
              </dd>
            </div>
            <div className="cert-fact">
              <dt>Eligibility status</dt>
              <dd>{outcome.eligible ? "Eligible" : "Not eligible"}</dd>
            </div>
            <div className="cert-fact">
              <dt>Lender reference</dt>
              <dd>{outcome.lenderRef || "—"}</dd>
            </div>
            <div className="cert-fact">
              <dt>Result</dt>
              <dd>{outcome.resultId}</dd>
            </div>
            <div className="cert-fact">
              <dt>Holder</dt>
              <dd className="mono">{outcome.holderAddressHash.slice(0, 16)}…</dd>
            </div>
            <div className="cert-fact">
              <dt>Computed by</dt>
              <dd>{outcome.computedBy}</dd>
            </div>
          </dl>

          <div className="cert-conditions">
            <p className="cert-conditions-title">Verified information</p>
            {met.length > 0 && (
              <ul>
                {met.map((s) => (
                  <li key={s}>
                    <CheckIcon size={14} />
                    {s}
                  </li>
                ))}
              </ul>
            )}
            {unmet.length > 0 && (
              <ul className="cert-unmet-list">
                {unmet.map((u) => (
                  <li key={u} className="cert-unmet-item">
                    <XIcon size={14} />
                    {u}
                  </li>
                ))}
              </ul>
            )}
            {met.length === 0 && unmet.length === 0 && <p className="cert-unmet">No conditions verified.</p>}
          </div>

          <p className="cert-note">
            <LockIcon size={13} />
            Privacy notice: no exact income or financial history appears on this certificate. The
            holder hash identifies the applicant wallet; no fabricated transaction data is shown.
          </p>

          <p className="cert-meta">
            Generated locally by the CrediFi web app · {shownAt.slice(0, 16).replace("T", " ")} UTC
          </p>
        </div>

        <div className="cert-foot">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()} aria-label="Print or save certificate as PDF">
            Print / Save PDF
          </button>
        </div>
      </div>
    </section>
  );
}