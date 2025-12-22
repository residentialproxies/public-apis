"use client";

import clsx from "clsx";

type Props = {
  status: string;
  className?: string;
};

const statusConfig: Record<
  string,
  {
    label: string;
    dotClass: string;
    textClass: string;
    bgClass: string;
    ping?: boolean;
  }
> = {
  live: {
    label: "ONLINE",
    dotClass: "bg-[var(--status-online)] status-ping",
    textClass: "text-[var(--status-online)]",
    bgClass: "bg-[var(--status-online)]/10 border-[var(--status-online)]/30",
    ping: true,
  },
  slow: {
    label: "SLOW",
    dotClass: "bg-[var(--status-warning)]",
    textClass: "text-[var(--status-warning)]",
    bgClass: "bg-[var(--status-warning)]/10 border-[var(--status-warning)]/30",
  },
  down: {
    label: "DOWN",
    dotClass: "bg-[var(--status-error)]",
    textClass: "text-[var(--status-error)]",
    bgClass: "bg-[var(--status-error)]/10 border-[var(--status-error)]/30",
  },
  unknown: {
    label: "???",
    dotClass: "bg-[var(--status-offline)]",
    textClass: "text-[var(--text-muted)]",
    bgClass: "bg-[var(--bg-tertiary)] border-[var(--border-dim)]",
  },
  pending: {
    label: "WAIT",
    dotClass: "bg-[var(--text-dim)]",
    textClass: "text-[var(--text-dim)]",
    bgClass: "bg-[var(--bg-tertiary)] border-[var(--border-dim)]",
  },
};

function statusDescription(status: string): string {
  switch (status) {
    case "live":
      return "API is responding normally";
    case "slow":
      return "API is responding but with high latency";
    case "down":
      return "API is not responding";
    case "unknown":
      return "API status could not be determined";
    case "pending":
    default:
      return "API has not been checked yet";
  }
}

export function StatusPill({ status, className }: Props) {
  const config = statusConfig[status] ?? statusConfig.pending;

  return (
    <span
      role="status"
      aria-label={`API health status: ${status}. ${statusDescription(status)}`}
      className={clsx(
        "inline-flex items-center gap-2 rounded border px-2.5 py-1 font-mono text-xs transition-opacity",
        config.bgClass,
        className,
      )}
    >
      <span className={clsx("size-2 rounded-full", config.dotClass)} />
      <span className={config.textClass}>{config.label}</span>
    </span>
  );
}
