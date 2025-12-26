import { forwardRef, type ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

const variantClasses: Record<Variant, string> = {
  primary: [
    "bg-[var(--accent-green)] text-[var(--bg-primary)]",
    "border border-[var(--accent-green)]",
    "hover:shadow-[var(--glow-green)] hover:-translate-y-px",
    "active:translate-y-0",
    "focus-visible:ring-2 focus-visible:ring-[var(--accent-green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]",
  ].join(" "),
  secondary: [
    "bg-transparent text-[var(--text-primary)]",
    "border border-[var(--border-dim)]",
    "hover:border-[var(--accent-green)] hover:text-[var(--accent-green)] hover:shadow-[var(--glow-green)]",
    "focus-visible:ring-2 focus-visible:ring-[var(--accent-green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]",
  ].join(" "),
  ghost: [
    "bg-transparent text-[var(--text-secondary)]",
    "border border-transparent",
    "hover:text-[var(--accent-green)] hover:bg-[var(--bg-tertiary)]",
    "focus-visible:ring-2 focus-visible:ring-[var(--accent-green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]",
  ].join(" "),
  danger: [
    "bg-[var(--accent-red)] text-[var(--bg-primary)]",
    "border border-[var(--accent-red)]",
    "hover:shadow-lg hover:-translate-y-px",
    "focus-visible:ring-2 focus-visible:ring-[var(--accent-red)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]",
  ].join(" "),
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          "ui-btn",
          "inline-flex items-center justify-center gap-2",
          "font-mono font-medium",
          "rounded transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          sizeClasses[size],
          variantClasses[variant],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="h-4 w-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
