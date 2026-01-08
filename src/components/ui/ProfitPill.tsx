import { useState } from "react";
import { Lock } from "lucide-react";
import { cn } from "../../lib/utils";
import { formatNumber } from "../../lib/formatters";
import { useHaptic } from "../../hooks/useHaptic";

// ============================================
// ProfitPill Component
// Blurred profit display with long-press reveal
// ============================================

interface ProfitPillProps {
  profit: number;
  className?: string;
}

export function ProfitPill({ profit, className }: ProfitPillProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const haptic = useHaptic();

  const handleLongPress = () => {
    haptic.medium();
    setIsRevealed(true);
  };

  const handleRelease = () => {
    setIsRevealed(false);
  };

  const isPositive = profit > 0;
  const displayValue = isPositive
    ? `+${formatNumber(profit)}`
    : formatNumber(profit);

  return (
    <button
      onMouseDown={handleLongPress}
      onMouseUp={handleRelease}
      onMouseLeave={handleRelease}
      onTouchStart={handleLongPress}
      onTouchEnd={handleRelease}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-full",
        "border transition-all duration-200",
        isPositive
          ? "bg-emerald-500/10 border-emerald-500/20"
          : "bg-red-500/10 border-red-500/20",
        className
      )}
    >
      {!isRevealed && <Lock size={10} className="text-neutral-500" />}
      <span
        className={cn(
          "text-[10px] font-bold tabular-nums transition-all duration-200",
          isRevealed ? "" : "blur-sm select-none",
          isPositive ? "text-emerald-400" : "text-red-400"
        )}
      >
        G: {displayValue}
      </span>
    </button>
  );
}
