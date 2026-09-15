import { useEffect, useRef } from "react";
import { CheckIcon, XIcon } from "./Icons";

export type NotificationKind = "success" | "error";

export type NotificationData = {
  kind: NotificationKind;
  title: string;
  message: string;
};

type NotificationProps = {
  notification: NotificationData;
  onDismiss: () => void;
  durationMs?: number;
};

export function Notification({ notification, onDismiss, durationMs = 9000 }: NotificationProps) {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    const id = window.setTimeout(() => onDismissRef.current(), durationMs);
    return () => window.clearTimeout(id);
  }, [notification, durationMs]);

  const isSuccess = notification.kind === "success";

  return (
    <div
      className={`notification notification-${notification.kind}`}
      role={isSuccess ? "status" : "alert"}
      aria-live={isSuccess ? "polite" : "assertive"}
    >
      <span className={`notification-icon ${notification.kind}`} aria-hidden>
        {isSuccess ? <CheckIcon size={22} /> : <XIcon size={22} />}
      </span>
      <div className="notification-copy">
        <p className="notification-title">{notification.title}</p>
        <p className="notification-msg">{notification.message}</p>
      </div>
      <button
        type="button"
        className="notification-close"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        <XIcon size={16} />
      </button>
    </div>
  );
}
