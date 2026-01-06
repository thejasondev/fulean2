import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "../../lib/utils";

// ============================================
// Toast Notification System
// Professional, non-blocking notifications
// ============================================

// Toast Types
export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
  };
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Generate unique ID
function generateId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Toast Provider Component
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (type: ToastType, message: string, duration = 3000) => {
      const id = generateId();
      const newToast: Toast = { id, type, message, duration };

      setToasts((prev) => [...prev, newToast]);

      // Auto-remove after duration
      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (message: string, duration?: number) =>
      addToast("success", message, duration),
    error: (message: string, duration?: number) =>
      addToast("error", message, duration),
    info: (message: string, duration?: number) =>
      addToast("info", message, duration),
    warning: (message: string, duration?: number) =>
      addToast("warning", message, duration),
  };

  return (
    <ToastContext.Provider value={{ toasts, toast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// Custom Hook
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// Toast Container (renders all toasts)
function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-[200]",
        "flex flex-col gap-2",
        "w-full max-w-sm px-4",
        "pointer-events-none"
      )}
      aria-live="polite"
      aria-label="Notificaciones"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

// Individual Toast Item
function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertCircle,
  };

  const styles = {
    success: {
      bg: "bg-emerald-500/15 border-emerald-500/40",
      icon: "text-emerald-400",
      text: "text-emerald-100",
    },
    error: {
      bg: "bg-red-500/15 border-red-500/40",
      icon: "text-red-400",
      text: "text-red-100",
    },
    info: {
      bg: "bg-blue-500/15 border-blue-500/40",
      icon: "text-blue-400",
      text: "text-blue-100",
    },
    warning: {
      bg: "bg-amber-500/15 border-amber-500/40",
      icon: "text-amber-400",
      text: "text-amber-100",
    },
  };

  const Icon = icons[toast.type];
  const style = styles[toast.type];

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3",
        "rounded-xl border backdrop-blur-xl",
        "shadow-lg",
        "pointer-events-auto",
        "animate-slide-up",
        style.bg
      )}
      role="alert"
    >
      <Icon className={cn("w-5 h-5 shrink-0", style.icon)} />
      <p className={cn("flex-1 text-sm font-medium", style.text)}>
        {toast.message}
      </p>
      <button
        onClick={() => onRemove(toast.id)}
        className={cn(
          "w-6 h-6 flex items-center justify-center shrink-0",
          "rounded-full",
          "text-neutral-400 hover:text-white",
          "hover:bg-white/10",
          "transition-colors duration-150"
        )}
        aria-label="Cerrar notificación"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
