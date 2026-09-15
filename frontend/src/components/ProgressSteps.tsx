export type StepKey = "requirement" | "verifying" | "result";

const STEPS: { key: StepKey; n: string; label: string }[] = [
  { key: "requirement", n: "1", label: "Financial Information" },
  { key: "verifying", n: "2", label: "Verification" },
  { key: "verifying", n: "3", label: "Generate Proof" },
  { key: "result", n: "4", label: "Result" },
];

// The "verifying" screen covers steps 2 AND 3 (Verify + Generate Proof).
const activeBase: Record<StepKey, number> = {
  requirement: 0,
  verifying: 1,
  result: 3,
};

type ProgressStepsProps = {
  current: StepKey;
};

export function ProgressSteps({ current }: ProgressStepsProps) {
  const base = activeBase[current];
  return (
    <ol className="progress" aria-label="Verification progress">
      {STEPS.map((s, i) => {
        const done = i < base;
        const active = i === base || (base === 1 && i === 2);
        return (
          <li
            key={`${s.key}-${s.n}`}
            className={`progress-step ${active ? "is-active" : ""} ${done ? "is-done" : ""}`}
            aria-current={active ? "step" : undefined}
          >
            <span className="progress-bullet" aria-hidden>
              {done ? "✓" : s.n}
            </span>
            <span className="progress-label">
              <span className="progress-label-step">Step {s.n}</span>
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}