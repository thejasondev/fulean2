import { useStore } from "@nanostores/react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import {
  $counterOperation,
  setCounterOperation,
} from "../../stores/counterStore";
import { $visibleDenominations } from "../../stores/visibilityStore";
import { cn } from "../../lib/utils";
import { BillRow } from "./BillRow";
import { useHaptic } from "../../hooks/useHaptic";

// ============================================
// MoneyCounter Component
// Main counter view with Buy/Sell toggle
// Theme-aware using CSS variables
// ============================================

export function MoneyCounter() {
  const operation = useStore($counterOperation);
  const visibleDenominations = useStore($visibleDenominations);
  const haptic = useHaptic();

  const handleOperationChange = (op: "BUY" | "SELL") => {
    haptic.light();
    setCounterOperation(op);
  };

  return (
    <main
      className={cn(
        // Layout
        "flex-1 overflow-y-auto",
        // Padding (consistent spacing scale)
        "px-4 py-4",
        // Bottom padding for compact footer (~100px + safe area)
        "pb-32",
      )}
    >
      {/* Operation Toggle - Buy/Sell */}
      <div className="mb-4">
        <label className="block text-sm text-[var(--text-faint)] mb-2 font-medium">
          Tipo de operación
        </label>
        <div className="flex p-1 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-primary)]">
          <button
            onClick={() => handleOperationChange("BUY")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2",
              "py-2.5 rounded-lg text-sm font-bold",
              "transition-all duration-200",
              operation === "BUY"
                ? "bg-[var(--status-success-bg)] text-[var(--status-success)] border border-[var(--status-success)]/30"
                : "text-[var(--text-faint)] hover:text-[var(--text-secondary)]",
            )}
          >
            <ArrowDownLeft size={16} />
            Compra
          </button>
          <button
            onClick={() => handleOperationChange("SELL")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2",
              "py-2.5 rounded-lg text-sm font-bold",
              "transition-all duration-200",
              operation === "SELL"
                ? "bg-[var(--status-warning-bg)] text-[var(--status-warning)] border border-[var(--status-warning)]/30"
                : "text-[var(--text-faint)] hover:text-[var(--text-secondary)]",
            )}
          >
            <ArrowUpRight size={16} />
            Venta
          </button>
        </div>
      </div>

      {/* Bill Rows - Only visible denominations */}
      <div className="space-y-3">
        {visibleDenominations.map((denomination) => (
          <BillRow key={denomination} denomination={denomination} />
        ))}
      </div>
    </main>
  );
}
