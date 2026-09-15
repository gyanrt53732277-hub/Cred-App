import { useState } from "react";
import { formatMoney } from "../lib/format";
import { Card } from "./Card";
import { Button } from "./Button";
import { ArrowRightIcon, InfoIcon, LockIcon } from "./Icons";

const MAX_INCOME = 65535;

const AMOUNT_CARDS = [
  { value: 25000, label: "₹25,000+" },
  { value: 50000, label: "₹50,000+" },
  { value: 100000, label: "₹1,00,000+" },
];

type RequirementFormProps = {
  minimumIncome: number;
  requireNoDefault: boolean;
  lenderRef: string;
  onChange: (update: { minimumIncome: number; requireNoDefault: boolean; lenderRef: string }) => void;
  onContinue: () => void;
  continueLabel?: string;
};

export function RequirementForm({
  minimumIncome,
  requireNoDefault,
  lenderRef,
  onChange,
  onContinue,
  continueLabel = "Continue →",
}: RequirementFormProps) {
  const [incomeText, setIncomeText] = useState("");

  const customActive = AMOUNT_CARDS.every((c) => c.value !== minimumIncome);
  const income = !customActive ? minimumIncome : Number(incomeText);

  const invalidNoNumber = incomeText.trim() !== "" && Number.isNaN(income);
  const invalidBelowZero = !Number.isNaN(income) && income < 0;
  const invalidAboveBound = !Number.isNaN(income) && income > MAX_INCOME;
  const invalid = (customActive || incomeText.trim() !== "") && (invalidNoNumber || invalidBelowZero || invalidAboveBound);

  const error = invalidNoNumber
    ? "Enter a valid number."
    : invalidBelowZero
      ? "Income cannot be negative."
      : `Maximum income is ${formatMoney(MAX_INCOME)}.`;

  const selectCard = (value: number) => {
    setIncomeText("");
    onChange({ minimumIncome: value, requireNoDefault, lenderRef });
  };

  return (
    <Card className="requirement-form" highlight>
      <div className="step-banner">Step 1 — Choose your loan requirement</div>

      <div className="req-cards" role="group" aria-label="Loan amount">
        {AMOUNT_CARDS.map((c) => {
          const selected = !customActive && minimumIncome === c.value;
          return (
            <button
              key={c.value}
              type="button"
              className={`req-card ${selected ? "selected" : ""}`}
              aria-pressed={selected}
              onClick={() => selectCard(c.value)}
            >
              <span className="req-card-amount">{c.label}</span>
              <span className="req-card-caption">minimum monthly income</span>
            </button>
          );
        })}
      </div>

      <details className="req-advanced">
        <summary>
          <span>Enter an exact amount or adjust lender settings</span>
        </summary>
        <div className="req-advanced-body">
          <label className="field">
            <span className="field-label">Exact minimum income (optional)</span>
            <div className="input-prefix">
              <span className="input-prefix-char">₹</span>
              <input
                type="number"
                min={0}
                max={MAX_INCOME}
                value={customActive ? incomeText : ""}
                placeholder={customActive ? "e.g. 45000" : "Choose a card above"}
                onChange={(e) => {
                  setIncomeText(e.target.value);
                  const next = Number(e.target.value);
                  if (e.target.value.trim() !== "" && !Number.isNaN(next) && next >= 0 && next <= MAX_INCOME) {
                    onChange({ minimumIncome: next, requireNoDefault, lenderRef });
                  }
                }}
                aria-invalid={invalid || undefined}
              />
            </div>
            {invalid && <span className="field-error">{error}</span>}
          </label>

          <label className="field check-field">
            <div className="field-label-row">
              <span className="field-label">Allow Previous Default?</span>
              <span className="tooltip-wrap">
                <InfoIcon size={14} className="tooltip-icon" />
                <span className="tooltip-box">
                  When "Yes", applicants with a prior loan default are still eligible.
                </span>
              </span>
            </div>
            <div className="check-row">
              {(["No", "Yes"] as const).map((option) => {
                const value = option === "Yes";
                const selected = value === !requireNoDefault;
                return (
                  <button
                    key={option}
                    type="button"
                    className={`seg-btn ${selected ? "selected" : ""} ${option === "Yes" && selected ? "warn-selected" : ""}`}
                    aria-pressed={selected}
                    onClick={() =>
                      onChange({
                        minimumIncome,
                        requireNoDefault: !value,
                        lenderRef,
                      })
                    }
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            <span className="field-hint">
              {!requireNoDefault ? "Prior defaults are accepted" : "Applicants must have no prior loan defaults"}
            </span>
          </label>

          <label className="field">
            <div className="field-label-row">
              <span className="field-label">Lender Reference</span>
              <span className="field-optional">Optional</span>
            </div>
            <input
              type="text"
              value={lenderRef}
              placeholder="e.g. Your Bank Name"
              onChange={(e) =>
                onChange({
                  minimumIncome: minimumIncome,
                  requireNoDefault,
                  lenderRef: e.target.value,
                })
              }
            />
            <span className="field-hint">Helps identify this verification</span>
          </label>
        </div>
      </details>

      <p className="flow-note">
        <LockIcon size={15} />
        <span>Your exact financial information is never revealed publicly.</span>
      </p>

      <div className="card-foot">
        <Button
          variant="primary"
          onClick={onContinue}
          disabled={invalid}
          icon={<ArrowRightIcon size={16} />}
        >
          {continueLabel}
        </Button>
      </div>
    </Card>
  );
}