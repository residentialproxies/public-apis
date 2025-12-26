"use client";

import { useEffect, useState, useCallback } from "react";
import clsx from "clsx";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

const typeConfig: Record<
  ToastType,
  { icon: string; bgColor: string; textColor: string; borderColor: string }
> = {
  success: {
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />',
    bgColor: "bg-[var(--bg-elevated)]",
    textColor: "text-[var(--accent-green)]",
    borderColor: "border-[var(--accent-green)]",
  },
  error: {
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />',
    bgColor: "bg-[var(--bg-elevated)]",
    textColor: "text-[var(--accent-red)]",
    borderColor: "border-[var(--accent-red)]",
  },
  warning: {
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />',
    bgColor: "bg-[var(--bg-elevated)]",
    textColor: "text-[var(--accent-yellow)]",
    borderColor: "border-[var(--accent-yellow)]",
  },
  info: {
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />',
    bgColor: "bg-[var(--bg-elevated)]",
    textColor: "text-[var(--accent-cyan)]",
    borderColor: "border-[var(--accent-cyan)]",
  },
};

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false);
  const config = typeConfig[toast.type];

  useEffect(() => {
    const duration = toast.duration ?? 4000;
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div
      className={clsx(
        "flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg",
        "transition-all duration-300",
        config.bgColor,
        config.textColor,
        config.borderColor,
        isExiting
          ? "opacity-0 translate-x-full"
          : "opacity-100 translate-x-0 animate-in slide-in-from-right",
      )}
      role="alert"
      aria-live={toast.type === "error" ? "assertive" : "polite"}
      aria-atomic="true"
    >
      <svg
        className="h-5 w-5 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        {config.icon}
      </svg>
      <p className="flex-1 text-sm font-medium text-[var(--text-primary)]">
        {toast.message}
      </p>
      <button
        type="button"
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onRemove(toast.id), 300);
        }}
        className="flex-shrink-0 rounded p-1 hover:bg-[var(--bg-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-green)]"
        aria-label="Close notification"
      >
        <svg
          className="h-4 w-4 text-[var(--text-muted)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

// Toast context state management
const toastListeners: Set<(toasts: Toast[]) => void> = new Set();
let toastList: Toast[] = [];

function notifyListeners() {
  toastListeners.forEach((listener) => listener([...toastList]));
}

export function toast(props: Omit<Toast, "id">) {
  const id = Math.random().toString(36).substring(2, 11);
  const newToast: Toast = { ...props, id };
  toastList.push(newToast);
  notifyListeners();
  return id;
}

export const toastApi = {
  success: (message: string, duration?: number) =>
    toast({ type: "success", message, duration }),
  error: (message: string, duration?: number) =>
    toast({ type: "error", message, duration }),
  warning: (message: string, duration?: number) =>
    toast({ type: "warning", message, duration }),
  info: (message: string, duration?: number) =>
    toast({ type: "info", message, duration }),
  remove: (id: string) => {
    toastList = toastList.filter((t) => t.id !== id);
    notifyListeners();
  },
  clear: () => {
    toastList = [];
    notifyListeners();
  },
};

/**
 * Hook to use toast notifications
 *
 * @example
 * ```tsx
 * const { showToast } = useToast();
 *
 * <button onClick={() => showToast.success("Success message")}>
 *   Show Success
 * </button>
 * ```
 */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(toastList);

  useEffect(() => {
    toastListeners.add(setToasts);
    return () => {
      toastListeners.delete(setToasts);
    };
  }, []);

  const removeToast = useCallback((id: string) => {
    toastList = toastList.filter((t) => t.id !== id);
    notifyListeners();
  }, []);

  return {
    toasts,
    showToast: toastApi,
    removeToast,
  };
}
