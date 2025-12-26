"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";

type Props = {
  status: string;
  className?: string;
};

export function StatusPill({ status, className }: Props) {
  const t = useTranslations("statusPill");

  // Get translated label and description
  const getLabel = (status: string): string => {
    switch (status) {
      case "live":
        return t("labelOnline");
      case "slow":
        return t("labelSlow");
      case "down":
        return t("labelDown");
      case "unknown":
        return t("labelUnknown");
      case "pending":
      default:
        return t("labelPending");
    }
  };

  const getDescription = (status: string): string => {
    switch (status) {
      case "live":
        return t("descOnline");
      case "slow":
        return t("descSlow");
      case "down":
        return t("descDown");
      case "unknown":
        return t("descUnknown");
      case "pending":
      default:
        return t("descPending");
    }
  };

  const getConfig = (status: string) => {
    switch (status) {
      case "live":
        return {
          dotClass: "bg-[var(--status-online)] status-ping",
          textClass: "text-[var(--status-online)]",
          bgClass:
            "bg-[var(--status-online)]/10 border-[var(--status-online)]/30",
        };
      case "slow":
        return {
          dotClass: "bg-[var(--status-warning)]",
          textClass: "text-[var(--status-warning)]",
          bgClass:
            "bg-[var(--status-warning)]/10 border-[var(--status-warning)]/30",
        };
      case "down":
        return {
          dotClass: "bg-[var(--status-error)]",
          textClass: "text-[var(--status-error)]",
          bgClass:
            "bg-[var(--status-error)]/10 border-[var(--status-error)]/30",
        };
      case "unknown":
        return {
          dotClass: "bg-[var(--status-offline)]",
          textClass: "text-[var(--text-muted)]",
          bgClass: "bg-[var(--bg-tertiary)] border-[var(--border-dim)]",
        };
      case "pending":
      default:
        return {
          dotClass: "bg-[var(--text-dim)]",
          textClass: "text-[var(--text-dim)]",
          bgClass: "bg-[var(--bg-tertiary)] border-[var(--border-dim)]",
        };
    }
  };

  const config = getConfig(status);
  const label = getLabel(status);

  return (
    <span
      role="status"
      aria-label={t("ariaLabel", {
        status: label,
        description: getDescription(status),
      })}
      className={clsx(
        "inline-flex items-center gap-2 rounded border px-2.5 py-1 font-mono text-xs transition-opacity",
        config.bgClass,
        className,
      )}
    >
      <span className={clsx("size-2 rounded-full", config.dotClass)} />
      <span className={config.textClass}>{label}</span>
    </span>
  );
}
