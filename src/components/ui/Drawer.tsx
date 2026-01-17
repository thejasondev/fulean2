import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

// ============================================
// Drawer Component
// Mobile-friendly bottom sheet with drag handle
// Theme-aware using CSS variables
// ============================================

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Drawer({ isOpen, onClose, title, children }: DrawerProps) {
  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0",
          "bg-[var(--backdrop-bg)] backdrop-blur-sm",
          "animate-fade-in",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Content */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0",
          "bg-[var(--bg-primary)] border-t border-[var(--border-primary)]",
          "rounded-t-2xl",
          "max-h-[85vh] overflow-hidden",
          "animate-slide-up",
          "safe-bottom",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "drawer-title" : undefined}
      >
        {/* Drag Handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 bg-[var(--border-secondary)] rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div
            className={cn(
              "flex items-center justify-between",
              "px-5 py-2",
              "border-b border-[var(--border-primary)]",
            )}
          >
            <h2
              id="drawer-title"
              className="text-lg font-semibold text-[var(--text-primary)]"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className={cn(
                "w-10 h-10 -mr-2",
                "flex items-center justify-center",
                "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
                "hover:bg-[var(--bg-secondary)] rounded-full",
                "transition-colors duration-200",
              )}
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto max-h-[calc(85vh-100px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
