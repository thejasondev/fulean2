import { useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import { Eye, EyeOff, Trash2, ArrowRightLeft, Copy, Clock } from 'lucide-react';
import {
  $grandTotalCUP,
  $foreignTotals,
  $privacyMode,
  togglePrivacyMode,
  clearAll,
} from "../../stores/counterStore";
import { useInTransaction, openHistoryDrawer } from "../../stores/uiStore";
import { confirm } from "../../stores/confirmStore";
import { formatNumber, formatCurrency } from "../../lib/formatters";
import { cn } from "../../lib/utils";
import { useToast } from "../ui/Toast";
import { Button } from "../ui/Button";

// ============================================
// TotalsFooter Component (Refactored)
// Compact Floating Bar with Keyboard Awareness
// ============================================

export function TotalsFooter() {
  const grandTotal = useStore($grandTotalCUP) ?? 0;
  const foreignTotals = useStore($foreignTotals) ?? { USD: 0, EUR: 0, CAD: 0 };
  const privacyMode = useStore($privacyMode) ?? false;
  const { toast } = useToast();

  // Keyboard/Focus State
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Detect input focus to handle mobile keyboard
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        setIsInputFocused(true);
      }
    };
    const handleBlur = () => {
      setIsInputFocused(false);
    };

    window.addEventListener("focus", handleFocus, true);
    window.addEventListener("blur", handleBlur, true);

    return () => {
      window.removeEventListener("focus", handleFocus, true);
      window.removeEventListener("blur", handleBlur, true);
    };
  }, []);

  const handleCopy = async () => {
    if (grandTotal === 0) return;
    try {
      await navigator.clipboard.writeText(grandTotal.toString());
      toast.success("Total copiado");
    } catch {
      toast.error("Error al copiar");
    }
  };

  const handleUseInTrade = () => {
    if (grandTotal === 0) {
      toast.warning("No hay monto para operar");
      return;
    }
    useInTransaction(grandTotal);
  };

  const handleClear = async () => {
    if (grandTotal === 0) return;
    const confirmed = await confirm({
      title: "Limpiar conteo",
      message: "¿Borrar todo?",
      confirmLabel: "Limpiar",
      variant: "danger",
    });
    if (confirmed) {
      clearAll();
      toast.info("Conteo limpiado");
    }
  };

  // Display Values
  const displayTotal = privacyMode ? "••••" : formatNumber(grandTotal);
  const displayForeign = privacyMode
    ? "•••• • •••• • ••••"
    : `${formatCurrency(foreignTotals.USD, "USD")} · ${formatCurrency(
        foreignTotals.EUR,
        "EUR"
      )}`;

  // If keyboard/input is focused, we enter "Slim Mode"
  // Hiding actions to save space above the keyboard
  if (isInputFocused) {
    return (
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "bg-neutral-900/95 backdrop-blur-xl border-t border-white/10",
          "py-2 px-4 flex items-center justify-between",
          "animate-slide-up"
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold tabular-nums text-lg">
            {displayTotal} CUP
          </span>
        </div>
        <button
          onMouseDown={(e) => e.preventDefault()} // Prevent stealing focus
          onClick={togglePrivacyMode}
          className="text-neutral-500 p-1"
        >
          {privacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    );
  }

  return (
    <footer
      className={cn(
        // Floating Positioning
        "fixed bottom-4 left-4 right-4 z-50",
        "safe-bottom", // respect safe area margins
        "transition-all duration-300 ease-out"
      )}
    >
      <div
        className={cn(
          // Card Shape & Style
          "rounded-2xl shadow-xl shadow-black/50",
          "bg-neutral-900/90 backdrop-blur-xl",
          "border border-white/10",
          "p-3",
          "flex items-center justify-between gap-3"
        )}
      >
        {/* LEFT: Info Section */}
        <div
          className="flex flex-col min-w-0"
          onClick={() => setShowDetails(!showDetails)}
        >
          {/* Main Total + Privacy Toggle */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-lg font-bold tabular-nums leading-none",
                grandTotal > 0 && !privacyMode
                  ? "text-emerald-400"
                  : "text-neutral-400",
                privacyMode && "blur-sm"
              )}
            >
              {displayTotal}
              <span className="text-xs text-neutral-500 font-normal ml-1">
                CUP
              </span>
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePrivacyMode();
              }}
              className="text-neutral-600 hover:text-neutral-400 transition-colors"
            >
              {privacyMode ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {/* Subtotals (Tiny Caption) */}
          <div className="text-[10px] text-neutral-500 font-medium tracking-tight truncate mt-0.5 leading-none">
            {showDetails ? (
              <span className="text-xs text-neutral-300 animate-fade-in">
                {formatCurrency(foreignTotals.CAD, "CAD")} • MLC pending...
              </span>
            ) : (
              <span className={cn(privacyMode && "blur-sm")}>
                {displayForeign}
              </span>
            )}
          </div>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Icon Actions */}
          <button
            onClick={openHistoryDrawer}
            className="w-9 h-9 flex items-center justify-center rounded-full text-neutral-400 hover:bg-white/5 transition-colors"
          >
            <Clock size={18} />
          </button>

          <div className="w-px h-6 bg-white/10 mx-0.5"></div>

          <button
            onClick={handleClear}
            disabled={grandTotal === 0}
            className="w-9 h-9 flex items-center justify-center rounded-full text-neutral-400 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 transition-colors"
          >
            <Trash2 size={18} />
          </button>

          <button
            onClick={handleCopy}
            disabled={grandTotal === 0}
            className="w-9 h-9 flex items-center justify-center rounded-full text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
          >
            <Copy size={18} />
          </button>

          {/* Primary Action */}
          <Button
            size="sm"
            onClick={handleUseInTrade}
            disabled={grandTotal === 0}
            className={cn(
              "ml-1 rounded-full px-4 h-9 font-semibold text-sm shadow-lg shadow-emerald-500/20",
              "bg-emerald-500 hover:bg-emerald-400 text-neutral-950"
            )}
          >
            Operar
          </Button>
        </div>
      </div>
    </footer>
  );
}
