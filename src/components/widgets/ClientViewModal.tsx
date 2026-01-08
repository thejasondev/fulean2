import { useStore } from "@nanostores/react";
import { ArrowDown, X } from "lucide-react";
import {
  $isClientViewOpen,
  $clientViewData,
  closeClientView,
} from "../../stores/uiStore";
import { formatNumber, formatCurrency } from "../../lib/formatters";
import { cn } from "../../lib/utils";
import { useHaptic } from "../../hooks/useHaptic";

// ============================================
// ClientViewModal Component
// Full-screen customer-facing display (Trust Builder)
// ============================================

export function ClientViewModal() {
  const isOpen = useStore($isClientViewOpen);
  const data = useStore($clientViewData);
  const haptic = useHaptic();

  if (!isOpen || !data) return null;

  const handleClose = () => {
    haptic.light();
    closeClientView();
  };

  const isBuy = data.operation === "BUY";

  // Determine display labels based on operation
  // BUY: Customer delivers foreign currency, receives CUP
  // SELL: Customer delivers CUP, receives foreign currency
  const topLabel = isBuy ? "USTED ENTREGA" : "USTED ENTREGA";
  const bottomLabel = isBuy ? "USTED RECIBE" : "USTED RECIBE";

  const topAmount = isBuy
    ? formatCurrency(data.foreignAmount, data.foreignCurrency as any)
    : formatNumber(data.cupAmount) + " CUP";

  const bottomAmount = isBuy
    ? formatNumber(data.cupAmount) + " CUP"
    : formatCurrency(data.foreignAmount, data.foreignCurrency as any);

  return (
    <div
      onClick={handleClose}
      className={cn(
        "fixed inset-0 z-[100]",
        "bg-neutral-950",
        "flex flex-col items-center justify-center",
        "animate-scale-in cursor-pointer",
        "select-none"
      )}
    >
      {/* Close hint */}
      <button
        onClick={handleClose}
        className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center rounded-full bg-white/5 text-neutral-500 hover:text-white transition-colors"
      >
        <X size={24} />
      </button>

      {/* Top: What customer delivers */}
      <div className="text-center mb-6">
        <div className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-3">
          {topLabel}
        </div>
        <div
          className={cn(
            "text-5xl md:text-7xl font-black tabular-nums tracking-tight",
            isBuy ? "text-amber-400" : "text-emerald-400"
          )}
        >
          {topAmount}
        </div>
      </div>

      {/* Arrow Indicator */}
      <div className="my-8 animate-bounce">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
          <ArrowDown size={32} className="text-neutral-400" />
        </div>
      </div>

      {/* Bottom: What customer receives */}
      <div className="text-center mt-6">
        <div className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-3">
          {bottomLabel}
        </div>
        <div
          className={cn(
            "text-5xl md:text-7xl font-black tabular-nums tracking-tight",
            isBuy ? "text-emerald-400" : "text-amber-400"
          )}
        >
          {bottomAmount}
        </div>
      </div>

      {/* Rate Footer */}
      <div className="absolute bottom-12 left-0 right-0 text-center">
        <div className="text-sm text-neutral-600">
          Tasa: 1 {data.foreignCurrency} = {data.rate} CUP
        </div>
        <div className="text-xs text-neutral-700 mt-2">Toca para cerrar</div>
      </div>
    </div>
  );
}
