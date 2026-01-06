import { type InputHTMLAttributes, useCallback } from "react";
import { cn } from "../../lib/utils";

// ============================================
// Input Component
// Accessible, mobile-optimized numeric input
// ============================================

interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: "sm" | "md" | "lg";
  error?: boolean;
  /** If true, prevents invalid numeric characters (e, +, -) */
  numericOnly?: boolean;
}

export function Input({
  size = "md",
  error = false,
  numericOnly = false,
  className,
  onKeyDown,
  ...props
}: InputProps) {
  // Prevent invalid characters for numeric inputs
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (numericOnly && ["e", "E", "+", "-", "."].includes(e.key)) {
        e.preventDefault();
      }
      onKeyDown?.(e);
    },
    [numericOnly, onKeyDown]
  );

  const baseStyles = cn(
    // Base
    "w-full bg-neutral-900 text-white",
    "border border-neutral-700 rounded-xl",
    "placeholder:text-neutral-500",
    // Transitions
    "transition-all duration-200",
    // Focus states (accessible)
    "focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500",
    // Prevent iOS zoom (16px minimum)
    "text-base"
  );

  const sizes = {
    sm: "px-3 py-2 min-h-[40px] text-sm",
    md: "px-4 py-3 min-h-[48px] text-base",
    // Large inputs use 20px+ for prominent display but stay ≥16px base
    lg: "px-5 py-4 min-h-[56px] text-xl font-semibold tabular-nums",
  };

  const errorStyles = error
    ? "border-red-500 focus:border-red-500 focus:ring-red-500/40"
    : "";

  return (
    <input
      className={cn(baseStyles, sizes[size], errorStyles, className)}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
}
