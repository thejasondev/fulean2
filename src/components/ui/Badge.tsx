import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

// ============================================
// Badge Component
// Status indicators with semantic variants
// Theme-aware using CSS variables
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
    default:
      "bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border-secondary)]",
    success:
      "bg-[var(--status-success-bg)] text-[var(--status-success)] border-[var(--status-success)]/30",
    warning:
      "bg-[var(--status-warning-bg)] text-[var(--status-warning)] border-[var(--status-warning)]/30",
    error:
      "bg-[var(--status-error-bg)] text-[var(--status-error)] border-[var(--status-error)]/30",
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
        sizes[size],
      )}
    >
      {children}
    </span>
  );
}
