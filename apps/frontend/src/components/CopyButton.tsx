"use client";

import { useCallback, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "../hooks/useToast";

type Props = {
  value: string;
  label?: string;
  className?: string;
  showToast?: boolean;
};

type CopyState = "idle" | "copied" | "error";

export function CopyButton({
  value,
  label,
  className,
  showToast = false,
}: Props) {
  const t = useTranslations("copyButton");
  const [state, setState] = useState<CopyState>("idle");
  const [, startTransition] = useTransition();

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
      if (showToast) {
        toast.success(t("copied"), 2000);
      }
      startTransition(() => {
        window.setTimeout(() => setState("idle"), 1200);
      });
    } catch {
      setState("error");
      if (showToast) {
        toast.error(t("failed"), 3000);
      }
      startTransition(() => {
        window.setTimeout(() => setState("idle"), 2000);
      });
    }
  }, [value, startTransition, showToast, t]);

  const buttonLabel =
    state === "copied"
      ? t("copied")
      : state === "error"
        ? t("failed")
        : label || t("copy");

  const truncatedValue = value.length > 50 ? `${value.slice(0, 50)}…` : value;
  const ariaLabel = `${buttonLabel}: ${truncatedValue}`;

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={ariaLabel}
      className={className ?? "ui-btn ui-btn-secondary px-3 py-1.5"}
      disabled={state === "copied" || state === "error"}
    >
      {buttonLabel}
    </button>
  );
}
