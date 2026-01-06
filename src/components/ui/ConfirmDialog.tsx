import { useStore } from "@nanostores/react";
import { AlertTriangle, Trash2, Info } from "lucide-react";
import { $confirmDialog, closeConfirmDialog } from "../../stores/confirmStore";
import { cn } from "../../lib/utils";
import { Button } from "./Button";

// ============================================
// ConfirmDialog Component
// Professional replacement for window.confirm()
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
    danger: "bg-red-500/15 text-red-400",
    warning: "bg-amber-500/15 text-amber-400",
    info: "bg-blue-500/15 text-blue-400",
  };

  const Icon = icons[state.variant];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={closeConfirmDialog}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className={cn(
          "relative w-full max-w-sm",
          "bg-neutral-900 border border-neutral-800",
          "rounded-2xl shadow-2xl",
          "p-5",
          "animate-slide-up"
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
              iconStyles[state.variant]
            )}
          >
            <Icon className="w-6 h-6" />
          </div>
        </div>

        {/* Title */}
        <h2
          id="confirm-title"
          className="text-lg font-semibold text-white text-center mb-2"
        >
          {state.title}
        </h2>

        {/* Message */}
        <p
          id="confirm-message"
          className="text-sm text-neutral-400 text-center mb-5"
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
