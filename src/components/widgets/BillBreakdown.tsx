import { formatNumber } from "../../lib/formatters";
import { type BreakdownResult } from "../../lib/algorithms";
import { cn } from "../../lib/utils";
import { BillIcon } from "../icons/BillIcon";
import { type Denomination } from "../../lib/constants";
import { Calculator } from "lucide-react";

// ============================================
// BillBreakdown Component
// Visual display of greedy algorithm results
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
        <p className="text-neutral-500">
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
        <span className="text-sm text-neutral-500 font-medium">
          Desglose de billetes
        </span>
        <span className="text-sm font-semibold text-neutral-400 tabular-nums">
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
              "bg-neutral-900 rounded-xl p-3",
              "border border-neutral-800",
              "transition-all duration-200",
              "hover:border-neutral-700"
            )}
          >
            {/* Bill Icon */}
            <BillIcon
              denomination={item.denomination as Denomination}
              size="md"
            />

            {/* Count */}
            <div className="flex-1">
              <div className="text-2xl font-bold text-white tabular-nums">
                {item.count}
                <span className="text-sm font-normal text-neutral-500 ml-1">
                  {item.count === 1 ? "billete" : "billetes"}
                </span>
              </div>
            </div>

            {/* Subtotal */}
            <div className="text-right">
              <div className="text-lg font-semibold text-emerald-400 tabular-nums">
                {formatNumber(item.subtotal)}
              </div>
              <div className="text-xs text-neutral-500">CUP</div>
            </div>
          </div>
        ))}
      </div>

      {/* Remainder Warning */}
      {result.remainder > 0 && (
        <div
          className={cn(
            "bg-amber-500/10 border border-amber-500/30",
            "rounded-xl p-3"
          )}
        >
          <p className="text-sm text-amber-400">
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
          "bg-neutral-950/60 rounded-2xl p-4 mt-4",
          "border border-neutral-800/40"
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-neutral-400 font-medium">Total</span>
          <div className="text-right">
            <div className="text-2xl font-bold text-emerald-400 tabular-nums money-glow">
              {formatNumber(result.targetCUP - result.remainder)} CUP
            </div>
            {result.remainder > 0 && (
              <div className="text-xs text-neutral-500 tabular-nums">
                de {formatNumber(result.targetCUP)} CUP objetivo
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
