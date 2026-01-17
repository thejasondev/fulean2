import { useStore } from "@nanostores/react";
import { AlertTriangle, Trash2, Info } from "lucide-react";
import { $confirmDialog, closeConfirmDialog } from "../../stores/confirmStore";
import { cn } from "../../lib/utils";
import { Button } from "./Button";

// ============================================
// ConfirmDialog Component
// Professional replacement for window.confirm()
// Theme-aware using CSS variables
// ============================================

export function ConfirmDialog() {
  const state = useStore($confirmDialog);

  if (!state.isOpen) return null;

  const icons = {
    danger: Trash2,
    warning: AlertTriangle,
    info: Info,
  };

  const iconStyles = {
    danger: "bg-[var(--status-error-bg)] text-[var(--status-error)]",
    warning: "bg-[var(--status-warning-bg)] text-[var(--status-warning)]",
    info: "bg-[var(--status-info-bg)] text-[var(--status-info)]",
  };

  const Icon = icons[state.variant];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--backdrop-bg)] backdrop-blur-sm animate-fade-in"
        onClick={closeConfirmDialog}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className={cn(
          "relative w-full max-w-sm",
          "bg-[var(--bg-primary)] border border-[var(--border-primary)]",
          "rounded-2xl shadow-2xl",
          "p-5",
          "animate-slide-up",
        )}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div
            className={cn(
              "w-12 h-12 rounded-full",
              "flex items-center justify-center",
              iconStyles[state.variant],
            )}
          >
            <Icon className="w-6 h-6" />
          </div>
        </div>

        {/* Title */}
        <h2
          id="confirm-title"
          className="text-lg font-semibold text-[var(--text-primary)] text-center mb-2"
        >
          {state.title}
        </h2>

        {/* Message */}
        <p
          id="confirm-message"
          className="text-sm text-[var(--text-muted)] text-center mb-5"
        >
          {state.message}
        </p>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" size="md" onClick={state.onCancel}>
            {state.cancelLabel}
          </Button>
          <Button
            variant={state.variant === "danger" ? "danger" : "primary"}
            size="md"
            onClick={state.onConfirm}
          >
            {state.confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
