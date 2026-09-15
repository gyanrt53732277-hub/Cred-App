import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  highlight?: boolean;
  role?: string;
};

/** A rounded, softly-bordered surface used across the CrediFi UI. */
export function Card({ children, className = "", highlight = false, role }: CardProps) {
  return (
    <div className={`card ${highlight ? "card-highlight" : ""} ${className}`} role={role}>
      {children}
    </div>
  );
}
