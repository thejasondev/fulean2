import { useState, useEffect, useCallback } from "react";
import { useStore } from "@nanostores/react";
import {
  Eye,
  EyeOff,
  Trash2,
  Clock,
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import {
  $grandTotalCUP,
  $foreignTotals,
  $privacyMode,
  $counterOperation,
  togglePrivacyMode,
  clearAll,
} from "../../stores/counterStore";
import { useInTransaction, openHistoryDrawer } from "../../stores/uiStore";
import { confirm } from "../../stores/confirmStore";
import { formatNumber, formatCurrency } from "../../lib/formatters";
import { cn } from "../../lib/utils";
import { useToast } from "../ui/Toast";
import { useHaptic } from "../../hooks/useHaptic";
import { Button } from "../ui/Button";

// ============================================
// TotalsFooter Component
// Smart Compact with Currency Carousel
// ============================================

// All 6 currencies in the carousel
const CAROUSEL_CURRENCIES = [
  "USD",
  "EUR",
  "CAD",
  "MLC",
  "CLASICA",
  "ZELLE",
] as const;
type CarouselCurrency = (typeof CAROUSEL_CURRENCIES)[number];

export function TotalsFooter() {
  const grandTotal = useStore($grandTotalCUP) ?? 0;
  const foreignTotals = useStore($foreignTotals) ?? {
    USD: 0,
    EUR: 0,
    CAD: 0,
    MLC: 0,
    CLASICA: 0,
    ZELLE: 0,
  };
  const privacyMode = useStore($privacyMode) ?? false;
  const operation = useStore($counterOperation);
  const { toast } = useToast();
  const haptic = useHaptic();

  // Keyboard/Focus State
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Currency Carousel State
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Carousel auto-rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCarouselIndex((prev) => (prev + 1) % CAROUSEL_CURRENCIES.length);
        setIsAnimating(false);
      }, 200); // Animation duration
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Manual carousel switch on tap
  const handleCarouselTap = useCallback(() => {
    haptic.light();
    setIsAnimating(true);
    setTimeout(() => {
      setCarouselIndex((prev) => (prev + 1) % CAROUSEL_CURRENCIES.length);
      setIsAnimating(false);
    }, 150);
  }, [haptic]);

  // Detect input focus for slim mode
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        setIsInputFocused(true);
      }
    };
    const handleBlur = () => setIsInputFocused(false);

    window.addEventListener("focus", handleFocus, true);
    window.addEventListener("blur", handleBlur, true);
    return () => {
      window.removeEventListener("focus", handleFocus, true);
      window.removeEventListener("blur", handleBlur, true);
    };
  }, []);

  const handleCopy = async () => {
    if (grandTotal === 0) return;
    haptic.light();
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
    haptic.medium();
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
      haptic.heavy();
      clearAll();
      toast.info("Conteo limpiado");
    }
  };

  // Display Values
  const displayTotal = privacyMode ? "••••" : formatNumber(grandTotal);
  const currentCurrency = CAROUSEL_CURRENCIES[carouselIndex];
  const currentForeignValue = foreignTotals[currentCurrency] || 0;
  const operationLabel = operation === "BUY" ? "Compra" : "Venta";
  const displayCarousel = privacyMode
    ? "••••"
    : `${operationLabel} • ${formatCurrency(
        currentForeignValue,
        currentCurrency
      )}`;

  // Slim Mode (keyboard visible)
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
          onMouseDown={(e) => e.preventDefault()}
          onClick={togglePrivacyMode}
          className="text-neutral-500 p-2"
        >
          {privacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    );
  }

  return (
    <footer
      className={cn(
        "fixed bottom-4 left-4 right-4 z-50",
        "safe-bottom",
        "transition-all duration-300 ease-out"
      )}
    >
      <div
        className={cn(
          "rounded-2xl shadow-xl shadow-black/50",
          "bg-neutral-900/90 backdrop-blur-xl",
          "border border-white/10",
          "p-3",
          "flex items-center gap-3"
        )}
      >
        {/* LEFT CLUSTER: Total + Carousel */}
        <div className="flex flex-col min-w-0 flex-1">
          {/* Main Total Row */}
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "text-xl font-bold tabular-nums leading-none",
                grandTotal > 0 && !privacyMode
                  ? "text-emerald-400"
                  : "text-neutral-400",
                privacyMode && "blur-sm"
              )}
            >
              {displayTotal}
            </span>
            <span className="text-xs text-neutral-500 font-medium">CUP</span>

            {/* Privacy Toggle - Inline with total */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                haptic.light();
                togglePrivacyMode();
              }}
              className="w-7 h-7 flex items-center justify-center rounded-full text-neutral-600 hover:text-neutral-400 hover:bg-white/5 transition-colors ml-1"
              aria-label="Modo privado"
            >
              {privacyMode ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {/* Currency Carousel - Fixed Height */}
          <button
            onClick={handleCarouselTap}
            className={cn(
              "h-4 overflow-hidden text-left", // Fixed height prevents jumping
              "mt-0.5"
            )}
          >
            <div
              className={cn(
                "text-[11px] text-neutral-500 font-medium tabular-nums transition-all duration-200",
                privacyMode && "blur-sm",
                isAnimating && "opacity-0 -translate-y-2"
              )}
            >
              {displayCarousel}
            </div>
          </button>
        </div>

        {/* DIVIDER */}
        <div className="w-px h-10 bg-white/10 shrink-0" />

        {/* RIGHT CLUSTER: Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* History */}
          <button
            onClick={() => {
              haptic.light();
              openHistoryDrawer();
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Historial"
          >
            <Clock size={20} />
          </button>

          {/* Clear */}
          <button
            onClick={handleClear}
            disabled={grandTotal === 0}
            className="w-10 h-10 flex items-center justify-center rounded-full text-neutral-400 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 transition-colors"
            aria-label="Limpiar"
          >
            <Trash2 size={20} />
          </button>

          {/* Primary Action - Icon only for mobile space efficiency */}
          <button
            onClick={handleUseInTrade}
            disabled={grandTotal === 0}
            className={cn(
              "w-12 h-12 flex items-center justify-center rounded-full",
              "shadow-lg shadow-emerald-500/20 transition-all duration-200",
              "bg-emerald-500 hover:bg-emerald-400 text-neutral-950",
              "disabled:opacity-30 disabled:shadow-none"
            )}
            aria-label="Operar"
          >
            <ArrowRightLeft size={22} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </footer>
  );
}
