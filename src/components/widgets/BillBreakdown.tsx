import { formatNumber } from "../../lib/formatters";
import { type BreakdownResult } from "../../lib/algorithms";
import { cn } from "../../lib/utils";
import { BillIcon } from "../icons/BillIcon";
import { type Denomination } from "../../lib/constants";
import { Calculator } from "lucide-react";

// ============================================
// BillBreakdown Component
// Visual display of greedy algorithm results
// Theme-aware using CSS variables
// ============================================

interface BillBreakdownProps {
  result: BreakdownResult | null;
}

export function BillBreakdown({ result }: BillBreakdownProps) {
  // Empty state
  if (!result || result.targetCUP === 0) {
    return (
      <div className="empty-state">
        <Calculator className="empty-state-icon" />
        <p className="text-[var(--text-faint)]">
          Ingresa una cantidad para ver el desglose
        </p>
      </div>
    );
  }

  const activeBills = result.breakdown.filter((b) => b.count > 0);

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-sm text-[var(--text-faint)] font-medium">
          Desglose de billetes
        </span>
        <span className="text-sm font-semibold text-[var(--text-muted)] tabular-nums">
          {result.totalBills} billetes
        </span>
      </div>

      {/* Bill Cards */}
      <div className="space-y-2">
        {activeBills.map((item) => (
          <div
            key={item.denomination}
            className={cn(
              "flex items-center gap-4",
              "bg-[var(--bg-primary)] rounded-xl p-3",
              "border border-[var(--border-primary)]",
              "transition-all duration-200",
              "hover:border-[var(--border-secondary)]",
            )}
          >
            {/* Bill Icon */}
            <BillIcon
              denomination={item.denomination as Denomination}
              size="md"
            />

            {/* Count */}
            <div className="flex-1">
              <div className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
                {item.count}
                <span className="text-sm font-normal text-[var(--text-faint)] ml-1">
                  {item.count === 1 ? "billete" : "billetes"}
                </span>
              </div>
            </div>

            {/* Subtotal */}
            <div className="text-right">
              <div className="text-lg font-semibold text-[var(--status-success)] tabular-nums">
                {formatNumber(item.subtotal)}
              </div>
              <div className="text-xs text-[var(--text-faint)]">CUP</div>
            </div>
          </div>
        ))}
      </div>

      {/* Remainder Warning */}
      {result.remainder > 0 && (
        <div
          className={cn(
            "bg-[var(--status-warning-bg)] border border-[var(--status-warning)]/30",
            "rounded-xl p-3",
          )}
        >
          <p className="text-sm text-[var(--status-warning)]">
            ⚠️ Quedaron{" "}
            <strong className="tabular-nums">
              {formatNumber(result.remainder)} CUP
            </strong>{" "}
            que no se pueden representar con los billetes disponibles.
          </p>
        </div>
      )}

      {/* Total Summary */}
      <div
        className={cn(
          "bg-[var(--bg-base)]/60 rounded-2xl p-4 mt-4",
          "border border-[var(--border-primary)]/40",
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-[var(--text-muted)] font-medium">Total</span>
          <div className="text-right">
            <div className="text-2xl font-bold text-[var(--status-success)] tabular-nums money-glow">
              {formatNumber(result.targetCUP - result.remainder)} CUP
            </div>
            {result.remainder > 0 && (
              <div className="text-xs text-[var(--text-faint)] tabular-nums">
                de {formatNumber(result.targetCUP)} CUP objetivo
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
