import { useStore } from "@nanostores/react";
import { Plus, Package } from "lucide-react";
import { $billCounts, setBillCount, addFajo } from "../../stores/counterStore";
import { type Denomination } from "../../lib/constants";
import { formatNumber } from "../../lib/formatters";
import { cn } from "../../lib/utils";
import { BillIcon } from "../icons/BillIcon";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { useHaptic } from "../../hooks/useHaptic";

// ============================================
// BillRow Component
// Individual row for counting a specific denomination
// Features: numeric input, fajo button, subtotal display
// ============================================

interface BillRowProps {
  denomination: Denomination;
}

export function BillRow({ denomination }: BillRowProps) {
  const billCounts = useStore($billCounts);
  const count = billCounts?.[denomination] ?? 0;
  const subtotal = count * denomination;
  const haptic = useHaptic();

  const handleCountChange = (value: string) => {
    // Parse and validate - only allow positive integers
    if (value === "") {
      setBillCount(denomination, 0);
      return;
    }

    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      haptic.light();
      setBillCount(denomination, numValue);
    }
  };

  const handleFajo = () => {
    haptic.medium();
    addFajo(denomination);
  };

  return (
    <div
      className={cn(
        // Card base
        "bg-neutral-900 rounded-2xl",
        "border border-neutral-800",
        // Spacing (8px = 2 × 4px base unit)
        "p-4",
        // Interaction
        "transition-all duration-200",
        "hover:border-neutral-700 hover:bg-neutral-800/50",
        // Animation on mount
        "animate-fade-in"
      )}
    >
      {/* Main Row: Icon, Input, Fajo Button */}
      <div className="flex items-center gap-4">
        {/* Bill Denomination Icon */}
        <BillIcon denomination={denomination} size="md" />

        {/* Count Input */}
        <div className="flex-1 min-w-0">
          <Input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            value={count || ""}
            onChange={(e) => handleCountChange(e.target.value)}
            placeholder="0"
            size="lg"
            numericOnly
            className={cn(
              "text-center",
              // Money styling
              "tabular-nums font-bold",
              // Highlight when has value
              count > 0 && "border-emerald-500/30 bg-emerald-500/5"
            )}
            min={0}
            aria-label={`Cantidad de billetes de ${denomination} CUP`}
          />
        </div>

        {/* Fajo Button (+100 bills) */}
        <Button
          variant="secondary"
          size="md"
          onClick={handleFajo}
          className="shrink-0 gap-1.5 px-3"
          aria-label={`Agregar fajo de 100 billetes de ${denomination} CUP`}
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <Package className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline text-sm font-semibold">Fajo</span>
        </Button>
      </div>

      {/* Subtotal Row */}
      <div
        className={cn(
          "mt-4 flex items-center justify-between",
          "pt-3 border-t border-neutral-800"
        )}
      >
        {/* Calculation breakdown */}
        <span className="text-sm text-neutral-500 tabular-nums">
          {formatNumber(count)} × {formatNumber(denomination)}
        </span>

        {/* Subtotal amount */}
        <span
          className={cn(
            "text-lg font-bold tabular-nums",
            subtotal > 0 ? "text-emerald-400 money-glow" : "text-neutral-600"
          )}
        >
          {formatNumber(subtotal)}
          <span className="text-sm font-normal text-neutral-500 ml-1">CUP</span>
        </span>
      </div>
    </div>
  );
}
