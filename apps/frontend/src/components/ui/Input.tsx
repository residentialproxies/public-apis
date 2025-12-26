import { forwardRef, type InputHTMLAttributes, useId } from "react";
import clsx from "clsx";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      onRightIconClick,
      className,
      id,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id || `input-${generatedId}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const hasError = Boolean(error);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--text-secondary)]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              "ui-input",
              "w-full rounded border px-3 py-2 text-sm font-mono",
              "transition-all duration-200",
              "placeholder:text-[var(--text-dim)]",
              "focus:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              hasError
                ? "border-[var(--accent-red)] focus:border-[var(--accent-red)] focus:shadow-[0_0_0_2px_hsla(0,90%,60%,0.2)]"
                : "border-[var(--border-dim)] focus:border-[var(--accent-green)] focus:shadow-[var(--glow-green)]",
              className,
            )}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? errorId : helperText ? helperId : undefined
            }
            {...props}
          />
          {rightIcon && (
            <button
              type="button"
              onClick={onRightIconClick}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--accent-green)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-green)] rounded"
              aria-label="Clear input"
              tabIndex={onRightIconClick ? 0 : -1}
            >
              {rightIcon}
            </button>
          )}
        </div>
        {error && (
          <p id={errorId} className="text-xs text-[var(--accent-red)]">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="text-xs text-[var(--text-muted)]">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

/**
 * Textarea component with consistent styling
 */
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  Omit<InputHTMLAttributes<HTMLTextAreaElement>, "size"> & {
    label?: string;
    error?: string;
    helperText?: string;
    resize?: "none" | "both" | "horizontal" | "vertical";
  }
>(
  (
    { label, error, helperText, resize = "vertical", className, id, ...props },
    ref,
  ) => {
    const generatedId = useId();
    const textareaId = id || `textarea-${generatedId}`;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;
    const hasError = Boolean(error);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-[var(--text-secondary)]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={clsx(
            "ui-input",
            "w-full rounded border px-3 py-2 text-sm font-mono",
            "transition-all duration-200",
            "placeholder:text-[var(--text-dim)]",
            "focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            hasError
              ? "border-[var(--accent-red)] focus:border-[var(--accent-red)] focus:shadow-[0_0_0_2px_hsla(0,90%,60%,0.2)]"
              : "border-[var(--border-dim)] focus:border-[var(--accent-green)] focus:shadow-[var(--glow-green)]",
            resize === "none" && "resize-none",
            resize === "both" && "resize",
            resize === "horizontal" && "resize-x",
            resize === "vertical" && "resize-y",
            className,
          )}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? errorId : helperText ? helperId : undefined
          }
          {...props}
        />
        {error && (
          <p id={errorId} className="text-xs text-[var(--accent-red)]">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="text-xs text-[var(--text-muted)]">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

/**
 * Select component with consistent styling
 */
export const Select = forwardRef<
  HTMLSelectElement,
  Omit<InputHTMLAttributes<HTMLSelectElement>, "size"> & {
    label?: string;
    error?: string;
    helperText?: string;
    options: Array<{ value: string; label: string; disabled?: boolean }>;
  }
>(({ label, error, helperText, options, className, id, ...props }, ref) => {
  const generatedId = useId();
  const selectId = id || `select-${generatedId}`;
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;
  const hasError = Boolean(error);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-[var(--text-secondary)]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={clsx(
            "ui-select",
            "w-full appearance-none rounded border px-3 py-2 pr-10 text-sm font-mono",
            "transition-all duration-200",
            "focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            hasError
              ? "border-[var(--accent-red)] focus:border-[var(--accent-red)] focus:shadow-[0_0_0_2px_hsla(0,90%,60%,0.2)]"
              : "border-[var(--border-dim)] focus:border-[var(--accent-green)] focus:shadow-[var(--glow-green)]",
            className,
          )}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? errorId : helperText ? helperId : undefined
          }
          {...props}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--accent-green)]">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
      {error && (
        <p id={errorId} className="text-xs text-[var(--accent-red)]">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="text-xs text-[var(--text-muted)]">
          {helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = "Select";
