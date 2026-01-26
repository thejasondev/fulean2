import { useState, useEffect, useCallback, useMemo } from "react";
import { useStore } from "@nanostores/react";
import {
  Eye,
  EyeOff,
  Trash2,
  Clock,
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  RefreshCw,
} from "lucide-react";
import {
  $grandTotalCUP,
  $foreignTotals,
  $privacyMode,
  $counterOperation,
  togglePrivacyMode,
  clearAll,
} from "../../stores/counterStore";
import { $visibleCurrencies } from "../../stores/visibilityStore";
import {
  $activeTab,
  useInTransaction,
  openHistoryDrawer,
} from "../../stores/uiStore";
import {
  $transactionFormState,
  $canSubmitTransaction,
  openClientView,
  executeSubmitFromFooter,
} from "../../stores/transactionFormStore";
import { confirm } from "../../stores/confirmStore";
import { formatNumber, formatCurrency } from "../../lib/formatters";
import { cn } from "../../lib/utils";
import { useToast } from "../ui/Toast";
import { useHaptic } from "../../hooks/useHaptic";
import type { Currency } from "../../lib/constants";

// ============================================
// TotalsFooter Component
// Context-Aware: Counter mode for Contar,
// Transaction preview for Operar,
// Minimal mode for Calculadora/Reportes
// ============================================

type FooterMode = "counter" | "transaction" | "minimal";

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
  const activeTab = useStore($activeTab);
  const formState = useStore($transactionFormState);
  const canSubmit = useStore($canSubmitTransaction);
  const isInOperar = activeTab === "operar";
  const visibleCurrencies = useStore($visibleCurrencies);
  const { toast } = useToast();
  const haptic = useHaptic();

  // Determine footer display mode based on active tab
  const footerMode: FooterMode = useMemo(() => {
    if (activeTab === "contar") return "counter";
    if (activeTab === "operar") return "transaction";
    return "minimal"; // calcular, reportes
  }, [activeTab]);

  // Use only visible currencies for carousel
  const carouselCurrencies = useMemo(
    () => visibleCurrencies,
    [visibleCurrencies],
  );

  // Keyboard/Focus State
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Currency Carousel State
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Reset carousel index when visible currencies change
  useEffect(() => {
    if (carouselIndex >= carouselCurrencies.length) {
      setCarouselIndex(0);
    }
  }, [carouselCurrencies.length, carouselIndex]);

  // Carousel auto-rotation
  useEffect(() => {
    if (carouselCurrencies.length <= 1) return;

    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCarouselIndex((prev) => (prev + 1) % carouselCurrencies.length);
        setIsAnimating(false);
      }, 200); // Animation duration
    }, 2500);

    return () => clearInterval(interval);
  }, [carouselCurrencies.length]);

  // Manual carousel switch on tap
  const handleCarouselTap = useCallback(() => {
    if (carouselCurrencies.length <= 1) return;
    haptic.light();
    setIsAnimating(true);
    setTimeout(() => {
      setCarouselIndex((prev) => (prev + 1) % carouselCurrencies.length);
      setIsAnimating(false);
    }, 150);
  }, [haptic, carouselCurrencies.length]);

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

  // Display Values for Counter Mode
  const displayTotal = privacyMode ? "••••" : formatNumber(grandTotal);
  const currentCurrency = carouselCurrencies[carouselIndex] as Currency;
  const currentForeignValue = foreignTotals[currentCurrency] || 0;
  const operationLabel = operation === "BUY" ? "Compra" : "Venta";
  const displayCarousel = privacyMode
    ? "••••"
    : `${operationLabel} • ${formatCurrency(
        currentForeignValue,
        currentCurrency,
      )}`;

  // Display Values for Transaction Mode (Operar)
  const txnDisplayTotal = formState.isValid
    ? formatNumber(formState.totalCUP)
    : "0";
  const txnOperationLabel =
    formState.operation === "BUY"
      ? "Compra"
      : formState.operation === "SELL"
        ? "Venta"
        : "Cambio";
  const txnOperationIcon =
    formState.operation === "BUY" ? (
      <ArrowDownLeft size={12} className="text-[var(--accent)]" />
    ) : formState.operation === "SELL" ? (
      <ArrowUpRight size={12} className="text-[var(--status-warning)]" />
    ) : (
      <RefreshCw size={12} className="text-[var(--blue)]" />
    );

  // For EXCHANGE: show conversion preview
  const exchangePreview =
    formState.operation === "EXCHANGE" && formState.amount > 0
      ? `${formState.amount} ${formState.fromCurrency} → ${formState.amountReceived?.toFixed(2) || "0"} ${formState.toCurrency}`
      : null;

  // For BUY/SELL: show amount and currency
  const buySellSubtitle =
    formState.operation !== "EXCHANGE" && formState.amount > 0
      ? `${txnOperationLabel} • ${formatCurrency(formState.amount, formState.currency as Currency)}`
      : null;

  // ============================================
  // MINIMAL MODE: Calculadora / Reportes
  // No footer - history accessible from header
  // ============================================
  if (footerMode === "minimal") {
    return null;
  }

  // Slim Mode (keyboard visible)
  if (isInputFocused) {
    return (
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "bg-[var(--bg-primary)]/95 backdrop-blur-xl border-t border-[var(--border-muted)]",
          "py-2 px-4 flex items-center justify-between",
          "animate-slide-up",
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-[var(--status-success)] font-bold tabular-nums text-lg">
            {footerMode === "transaction" ? txnDisplayTotal : displayTotal} CUP
          </span>
        </div>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={togglePrivacyMode}
          className="text-[var(--text-faint)] p-2"
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
        "transition-all duration-300 ease-out",
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden", // For shine effect
          "rounded-2xl",
          // Liquid Glass Base
          "bg-(--bg-primary)/60 backdrop-blur-3xl saturate-150",
          // Border & Depth
          "border border-white/10 dark:border-white/5",
          "shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]",
          // Inner Bevel/Light
          "before:absolute before:inset-0 before:rounded-2xl before:p-px",
          "before:bg-linear-to-b before:from-white/20 before:to-transparent before:pointer-events-none",
          "after:absolute after:inset-0 after:bg-linear-to-t after:from-white/5 after:to-transparent after:pointer-events-none",
          "p-3",
          "flex items-center gap-3",
        )}
      >
        {/* LEFT CLUSTER: Context-Aware Display */}
        <div className="flex flex-col min-w-0 flex-1">
          {footerMode === "counter" ? (
            // ============================================
            // COUNTER MODE: Show counted totals
            // ============================================
            <>
              {/* Main Total Row */}
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "text-xl font-bold tabular-nums leading-none",
                    grandTotal > 0 && !privacyMode
                      ? "text-[var(--status-success)]"
                      : "text-[var(--text-muted)]",
                    privacyMode && "blur-sm",
                  )}
                >
                  {displayTotal}
                </span>
                <span className="text-xs text-[var(--text-faint)] font-medium">
                  CUP
                </span>

                {/* Privacy Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    haptic.light();
                    togglePrivacyMode();
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--text-faint)] hover:text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-all duration-200 ml-2"
                  aria-label="Modo privado"
                  title="Modo privado"
                >
                  {privacyMode ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Currency Carousel */}
              <button
                onClick={handleCarouselTap}
                className={cn("h-4 overflow-hidden text-left", "mt-0.5")}
              >
                <div
                  className={cn(
                    "text-[11px] text-[var(--text-faint)] font-medium tabular-nums transition-all duration-200",
                    privacyMode && "blur-sm",
                    isAnimating && "opacity-0 -translate-y-2",
                  )}
                >
                  {displayCarousel}
                </div>
              </button>
            </>
          ) : (
            // ============================================
            // TRANSACTION MODE: Show transaction preview
            // ============================================
            <>
              {/* Main Total Row */}
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "text-xl font-bold tabular-nums leading-none",
                    formState.isValid
                      ? formState.operation === "EXCHANGE"
                        ? "text-[var(--blue)]"
                        : formState.operation === "BUY"
                          ? "text-[var(--status-success)]"
                          : "text-[var(--status-warning)]"
                      : "text-[var(--text-muted)]",
                  )}
                >
                  {formState.operation === "EXCHANGE"
                    ? exchangePreview || "0 → 0"
                    : txnDisplayTotal}
                </span>
                {formState.operation !== "EXCHANGE" && (
                  <span className="text-xs text-[var(--text-faint)] font-medium">
                    CUP
                  </span>
                )}

                {/* Eye Button - Opens Client View when valid */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    haptic.light();
                    if (canSubmit) {
                      openClientView();
                    }
                  }}
                  disabled={!canSubmit}
                  className={cn(
                    "flex items-center justify-center rounded-full transition-all duration-200 ml-2",
                    canSubmit
                      ? "w-10 h-10 bg-[var(--blue-bg)] text-[var(--blue)] shadow-sm hover:shadow-md"
                      : "w-8 h-8 text-[var(--text-faint)] opacity-40",
                  )}
                  aria-label="Mostrar al cliente"
                  title="Mostrar al cliente"
                >
                  <Eye size={canSubmit ? 20 : 16} />
                </button>
              </div>

              {/* Transaction Subtitle */}
              <div className="h-4 mt-0.5">
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-faint)] font-medium">
                  {formState.operation === "EXCHANGE" ? (
                    // Exchange: show rate
                    formState.exchangeRate ? (
                      <>
                        <RefreshCw size={11} className="text-[var(--blue)]" />
                        <span>@{formState.exchangeRate} • Tasa de cambio</span>
                      </>
                    ) : (
                      <span className="opacity-50">Ingrese monto y tasa</span>
                    )
                  ) : buySellSubtitle ? (
                    // BUY/SELL: show operation + amount
                    <>
                      {txnOperationIcon}
                      <span>{buySellSubtitle}</span>
                    </>
                  ) : (
                    <span className="opacity-50">Ingrese monto</span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* RIGHT CLUSTER: Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* History */}
          <button
            onClick={() => {
              haptic.light();
              openHistoryDrawer();
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            aria-label="Historial"
          >
            <Clock size={20} />
          </button>

          {/* Clear */}
          <button
            onClick={handleClear}
            disabled={grandTotal === 0}
            className="w-10 h-10 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--status-error)] hover:bg-[var(--status-error-bg)] disabled:opacity-30 transition-colors"
            aria-label="Limpiar"
          >
            <Trash2 size={20} />
          </button>

          {/* Primary Action - Context Aware with 3 states */}
          {isInOperar ? (
            // In Operar tab: Show operation-colored button (enabled or disabled)
            <button
              onClick={() => {
                if (!canSubmit) return;
                haptic.medium();
                executeSubmitFromFooter();
              }}
              disabled={!canSubmit}
              className={cn(
                "flex items-center justify-center gap-2 rounded-full",
                "shadow-lg transition-all duration-200",
                "text-[var(--text-inverted)] font-bold",
                // Size: circle on mobile, pill on desktop
                "w-12 h-12 md:w-auto md:h-11 md:px-5",
                // Disabled state
                "disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed",
                // Color based on operation
                formState.operation === "EXCHANGE"
                  ? "bg-[var(--blue)] shadow-blue-500/20"
                  : formState.operation === "BUY"
                    ? "bg-[var(--accent)] shadow-emerald-500/20"
                    : "bg-[var(--status-warning)] shadow-orange-500/20",
                // Hover only when enabled
                canSubmit &&
                  (formState.operation === "EXCHANGE"
                    ? "hover:opacity-90"
                    : formState.operation === "BUY"
                      ? "hover:bg-[var(--accent-hover)]"
                      : "hover:opacity-90"),
              )}
              aria-label={
                formState.operation === "EXCHANGE" ? "Cambiar" : "Registrar"
              }
            >
              {formState.operation === "EXCHANGE" ? (
                <RefreshCw size={20} strokeWidth={2.5} />
              ) : (
                <Check size={20} strokeWidth={2.5} />
              )}
              <span className="hidden md:inline text-sm">
                {formState.operation === "EXCHANGE" ? "Cambiar" : "Registrar"}
              </span>
            </button>
          ) : (
            // Not in Operar: Show green "Operar" button
            <button
              onClick={handleUseInTrade}
              disabled={grandTotal === 0}
              className={cn(
                "flex items-center justify-center gap-2 rounded-full",
                "shadow-lg shadow-emerald-500/20 transition-all duration-200",
                "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--text-inverted)] font-bold",
                "disabled:opacity-30 disabled:shadow-none",
                // Size: circle on mobile, pill on desktop
                "w-12 h-12 md:w-auto md:h-11 md:px-5",
              )}
              aria-label="Operar"
            >
              <ArrowRightLeft size={20} strokeWidth={2.5} />
              <span className="hidden md:inline text-sm">Operar</span>
            </button>
          )}
        </div>
      </div>
    </footer>
  );
}
