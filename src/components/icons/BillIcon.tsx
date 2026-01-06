import type { Denomination } from "../../lib/constants";
import { cn } from "../../lib/utils";

// ============================================
// BillIcon Component
// Visual representation of Cuban peso denominations
// Uses CSS classes instead of inline styles for better performance
// ============================================

interface BillIconProps {
  denomination: Denomination;
  size?: "sm" | "md" | "lg";
}

// Color schemes for each denomination (Tailwind classes)
const BILL_STYLES: Record<
  Denomination,
  { bg: string; border: string; text: string }
> = {
  1000: { bg: "bg-blue-950", border: "border-blue-400", text: "text-blue-400" },
  500: {
    bg: "bg-fuchsia-950",
    border: "border-fuchsia-400",
    text: "text-fuchsia-400",
  },
  200: {
    bg: "bg-orange-950",
    border: "border-orange-400",
    text: "text-orange-400",
  },
  100: {
    bg: "bg-neutral-800",
    border: "border-neutral-400",
    text: "text-neutral-400",
  },
  50: {
    bg: "bg-green-950",
    border: "border-green-400",
    text: "text-green-400",
  },
  20: {
    bg: "bg-amber-950",
    border: "border-amber-400",
    text: "text-amber-400",
  },
};

const SIZES = {
  sm: { container: "w-12 h-7", text: "text-xs" },
  md: { container: "w-16 h-9", text: "text-sm" },
  lg: { container: "w-20 h-11", text: "text-base" },
};

export function BillIcon({ denomination, size = "md" }: BillIconProps) {
  const colors = BILL_STYLES[denomination];
  const sizeStyles = SIZES[size];

  return (
    <div
      className={cn(
        // Layout
        "flex items-center justify-center",
        // Size
        sizeStyles.container,
        // Shape
        "rounded-md border-2",
        // Colors
        colors.bg,
        colors.border,
        colors.text,
        // Typography
        "font-bold tabular-nums",
        sizeStyles.text,
        // Interaction
        "transition-transform duration-150",
        "hover:scale-105",
        // Shadow for depth
        "shadow-sm"
      )}
      aria-hidden="true"
    >
      {denomination}
    </div>
  );
}
