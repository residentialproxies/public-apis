"use client";

import { useCallback, useState, useTransition } from "react";

type Props = {
  value: string;
  label?: string;
  className?: string;
};

type CopyState = "idle" | "copied" | "error";

export function CopyButton({ value, label = "Copy", className }: Props) {
  const [state, setState] = useState<CopyState>("idle");
  const [, startTransition] = useTransition();

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
      startTransition(() => {
        window.setTimeout(() => setState("idle"), 1200);
      });
    } catch {
      setState("error");
      startTransition(() => {
        window.setTimeout(() => setState("idle"), 2000);
      });
    }
  }, [value, startTransition]);

  const buttonLabel =
    state === "copied" ? "Copied" : state === "error" ? "Failed" : label;

  const truncatedValue = value.length > 50 ? `${value.slice(0, 50)}…` : value;
  const ariaLabel = `${buttonLabel}: ${truncatedValue}`;

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={ariaLabel}
      className={className ?? "ui-btn ui-btn-secondary px-3 py-1.5"}
    >
      {buttonLabel}
    </button>
  );
}
