import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

// ============================================
// Modal Component
// Accessible modal with backdrop blur and animations
// ============================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "full";
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}: ModalProps) {
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

  // Prevent body scroll when modal is open
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

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    full: "max-w-full mx-4",
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100]",
        "flex items-center justify-center p-4"
      )}
    >
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0",
          "bg-black/80 backdrop-blur-sm",
          "animate-fade-in"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        className={cn(
          "relative w-full",
          sizeClasses[size],
          "bg-neutral-900 border border-neutral-800",
          "rounded-2xl shadow-2xl",
          "max-h-[90vh] overflow-hidden",
          "animate-slide-up"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {/* Header */}
        {title && (
          <div
            className={cn(
              "flex items-center justify-between",
              "px-5 py-4",
              "border-b border-neutral-800"
            )}
          >
            <h2 id="modal-title" className="text-lg font-semibold text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className={cn(
                "w-10 h-10 -mr-2",
                "flex items-center justify-center",
                "text-neutral-400 hover:text-white",
                "hover:bg-neutral-800 rounded-full",
                "transition-colors duration-200"
              )}
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
