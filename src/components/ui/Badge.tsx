import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

// ============================================
// Badge Component
// Status indicators with semantic variants
// ============================================

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "error";
  size?: "sm" | "md";
}

export function Badge({
  children,
  variant = "default",
  size = "md",
}: BadgeProps) {
  const variants = {
    default: "bg-neutral-800 text-neutral-400 border-neutral-700",
    success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    error: "bg-red-500/15 text-red-400 border-red-500/30",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border",
        "transition-colors duration-200",
        variants[variant],
        sizes[size]
      )}
    >
      {children}
    </span>
  );
}
