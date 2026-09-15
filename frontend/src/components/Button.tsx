import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  icon?: ReactNode;
};

export function Button({
  variant = "secondary",
  size = "md",
  children,
  icon,
  className = "",
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} btn-${size} ${className}`}
      {...rest}
    >
      {children}
      {icon && <span className="btn-icon">{icon}</span>}
    </button>
  );
}
