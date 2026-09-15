import { AlertIcon, InfoIcon, RefreshIcon } from "./Icons";
import { Button } from "./Button";

type ErrorCardProps = {
  title?: string;
  message: string;
  hint?: string;
  nextStep?: string;
  onRetry?: () => void;
  retryLabel?: string;
  onDismiss?: () => void;
};

/**
 * A clean, user-friendly error card. Never shows raw technical errors verbatim —
 * it always separates what happened, why it may have happened and what to do next.
 */
export function ErrorCard({
  title = "Something went wrong",
  message,
  hint,
  nextStep = "Try again, or wait a moment and refresh the page.",
  onRetry,
  retryLabel = "Retry",
  onDismiss,
}: ErrorCardProps) {
  return (
    <div className="error-card" role="alert">
      <div className="error-card-head">
        <span className="error-card-icon" aria-hidden>
          <AlertIcon size={20} />
        </span>
        <div>
          <h3 className="error-card-title">{title}</h3>
          <p className="error-card-what">{message}</p>
        </div>
      </div>

      <div className="error-card-body">
        {hint && (
          <p className="error-card-why">
            <InfoIcon size={14} />
            <span>
              <strong>Why:</strong> {hint}
            </span>
          </p>
        )}
        <p className="error-card-next">
          <strong>Next:</strong> {nextStep}
        </p>
      </div>

      {(onRetry || onDismiss) && (
        <div className="error-card-actions">
          {onRetry && (
            <Button variant="primary" size="sm" onClick={onRetry} icon={<RefreshIcon size={14} />}>
              {retryLabel}
            </Button>
          )}
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>
      )}
    </div>
  );
}