import { useStore } from "@nanostores/react";
import { ArrowDown, X, RefreshCw } from "lucide-react";
import {
  $isClientViewOpen,
  $transactionFormState,
  closeClientView,
} from "../../stores/transactionFormStore";
import { formatNumber, formatCurrency } from "../../lib/formatters";
import { cn } from "../../lib/utils";
import { useHaptic } from "../../hooks/useHaptic";

// ============================================
// ClientViewModal Component
// Full-screen customer-facing display (Trust Builder)
// Theme-aware with operation color coding
// ============================================

export function ClientViewModal() {
  const isOpen = useStore($isClientViewOpen);
  const data = useStore($transactionFormState);
  const haptic = useHaptic();

  if (!isOpen || !data.isValid) return null;

  const handleClose = () => {
    haptic.light();
    closeClientView();
  };

  const isBuy = data.operation === "BUY";
  const isSell = data.operation === "SELL";
  const isExchange = data.operation === "EXCHANGE";

  // Theme based on operation
  const theme = isExchange
    ? { primary: "text-[var(--blue)]", secondary: "text-[var(--blue)]" }
    : isBuy
      ? {
          primary: "text-[var(--status-warning)]",
          secondary: "text-[var(--status-success)]",
        }
      : {
          primary: "text-[var(--status-success)]",
          secondary: "text-[var(--status-warning)]",
        };

  // Display values
  const topLabel = "USTED ENTREGA";
  const bottomLabel = "USTED RECIBE";

  let topAmount: string;
  let bottomAmount: string;
  let rateText: string;

  if (isExchange) {
    topAmount = formatCurrency(data.amount, data.fromCurrency as any);
    bottomAmount = formatCurrency(
      data.amountReceived || 0,
      data.toCurrency as any,
    );
    rateText = `1 ${data.fromCurrency} = ${data.exchangeRate} ${data.toCurrency}`;
  } else if (isBuy) {
    topAmount = formatCurrency(data.amount, data.currency as any);
    bottomAmount = formatNumber(data.totalCUP) + " CUP";
    rateText = `1 ${data.currency} = ${formatNumber(data.rate)} CUP`;
  } else {
    topAmount = formatNumber(data.totalCUP) + " CUP";
    bottomAmount = formatCurrency(data.amount, data.currency as any);
    rateText = `1 ${data.currency} = ${formatNumber(data.rate)} CUP`;
  }

  return (
    <div
      onClick={handleClose}
      className={cn(
        "fixed inset-0 z-[100]",
        "bg-[var(--bg-base)]",
        "flex flex-col items-center justify-center",
        "animate-scale-in cursor-pointer",
        "select-none",
      )}
    >
      {/* Close button - Only visible on desktop since tapping anywhere closes on mobile */}
      <button
        onClick={handleClose}
        className="hidden md:flex absolute top-6 right-6 w-12 h-12 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-faint)] hover:text-[var(--text-primary)] transition-colors"
        aria-label="Cerrar"
      >
        <X size={24} />
      </button>

      {/* Top: What customer delivers */}
      <div className="text-center mb-6">
        <div className="text-sm font-bold text-[var(--text-faint)] uppercase tracking-widest mb-3">
          {topLabel}
        </div>
        <div
          className={cn(
            "text-5xl md:text-7xl font-black tabular-nums tracking-tight",
            theme.primary,
          )}
        >
          {topAmount}
        </div>
      </div>

      {/* Arrow Indicator */}
      <div className="my-8 animate-bounce">
        <div className="w-16 h-16 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center">
          {isExchange ? (
            <RefreshCw size={32} className="text-[var(--blue)]" />
          ) : (
            <ArrowDown size={32} className="text-[var(--text-muted)]" />
          )}
        </div>
      </div>

      {/* Bottom: What customer receives */}
      <div className="text-center mt-6">
        <div className="text-sm font-bold text-[var(--text-faint)] uppercase tracking-widest mb-3">
          {bottomLabel}
        </div>
        <div
          className={cn(
            "text-5xl md:text-7xl font-black tabular-nums tracking-tight",
            theme.secondary,
          )}
        >
          {bottomAmount}
        </div>
      </div>

      {/* Rate Footer */}
      <div className="absolute bottom-12 left-0 right-0 text-center">
        <div className="text-sm text-[var(--text-faint)]">Tasa: {rateText}</div>
        <div className="text-xs text-[var(--text-faint)]/60 mt-2">
          Toca para cerrar
        </div>
      </div>
    </div>
  );
}
