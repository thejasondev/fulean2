import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes with tailwind-merge for deduplication
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-green-500', 'px-6')
 * // Returns: 'py-2 px-6 bg-green-500' (if isActive is true)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Common style presets for reuse across components
 */
export const styles = {
  // Touch-friendly minimum size (44x44px per Apple HIG)
  touchTarget: "min-h-[44px] min-w-[44px]",

  // Card styles
  card: "bg-neutral-900 rounded-xl border border-neutral-800",
  cardHover: "hover:bg-neutral-800/80 transition-colors duration-200",

  // Glassmorphism effects
  glassHeader:
    "bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800/50",
  glassFooter:
    "bg-neutral-900/90 backdrop-blur-xl border-t border-neutral-800/50",

  // Money/accent text
  moneyText: "text-emerald-400 tabular-nums",
  moneyGlow:
    "text-emerald-400 tabular-nums drop-shadow-[0_0_12px_rgba(52,211,153,0.3)]",

  // Input styles
  input:
    "bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500",
  inputFocus:
    "focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500",

  // Button base
  buttonBase:
    "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 active:scale-[0.98]",

  // Safe area for mobile home indicator
  safeBottom: "pb-[env(safe-area-inset-bottom,16px)]",
} as const;
