"use client";

import {
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
  type MouseEvent,
  type KeyboardEvent,
} from "react";
import clsx from "clsx";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

/**
 * Modal component with focus trap and accessibility features.
 *
 * Features:
 * - Focus trap: Tab cycles within modal, Shift+Tab cycles backwards
 * - ESC key closes modal
 * - Body scroll lock when open
 * - Focus restoration on close
 * - ARIA attributes for screen readers
 * - Click outside to close (optional)
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  contentClassName,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Store the previously focused element when modal opens
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  // Focus the modal when it opens
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Focus the first focusable element or the modal itself
      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      const firstFocusable = focusableElements[0];
      if (firstFocusable) {
        firstFocusable.focus();
      } else {
        modalRef.current.focus();
      }
    }
  }, [isOpen]);

  // Restore focus when modal closes
  useEffect(() => {
    if (!isOpen && previousActiveElementRef.current) {
      previousActiveElementRef.current.focus();
    }
  }, [isOpen]);

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Prevent background scrolling
      document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen]);

  // Focus trap implementation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (closeOnEscape && e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key !== "Tab") return;

      const modal = modalRef.current;
      if (!modal) return;

      const focusableElements = modal.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // If no focusable elements, let Tab behave normally
      if (!firstElement || !lastElement) return;

      // If Shift+Tab on first element, move to last
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
      // If Tab on last element, move to first
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    },
    [onClose, closeOnEscape],
  );

  const handleOverlayClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose, closeOnOverlayClick],
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={clsx(
          "relative max-h-[90vh] max-w-[90vw] overflow-auto rounded-lg bg-[var(--bg-elevated)] shadow-xl border border-[var(--border-active)]",
          "animate-in fade-in zoom-in-95 duration-200",
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        aria-describedby={description ? "modal-description" : undefined}
        tabIndex={-1}
      >
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full bg-[var(--bg-elevated)] p-2 shadow-lg border border-[var(--border-active)] transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[var(--accent-green)]"
            aria-label="Close modal"
          >
            <svg
              className="h-5 w-5 text-[var(--accent-green)]"
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
        )}

        <div className={clsx("p-6", contentClassName)}>
          {title && (
            <h2
              id="modal-title"
              className="mb-2 text-lg font-mono font-medium text-[var(--text-primary)]"
            >
              {title}
            </h2>
          )}
          {description && (
            <p
              id="modal-description"
              className="mb-4 text-sm text-[var(--text-muted)]"
            >
              {description}
            </p>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Modal header component for consistent styling
 */
export function ModalHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4">
      <h2
        id="modal-title"
        className="text-lg font-mono font-medium text-[var(--text-primary)]"
      >
        {title}
      </h2>
      {description && (
        <p
          id="modal-description"
          className="mt-1 text-sm text-[var(--text-muted)]"
        >
          {description}
        </p>
      )}
    </div>
  );
}

/**
 * Modal footer component for action buttons
 */
export function ModalFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx("mt-6 flex items-center justify-end gap-3", className)}
    >
      {children}
    </div>
  );
}
