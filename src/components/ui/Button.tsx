import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

// ============================================
// Button Component
// Accessible, touch-friendly button with variants
// Theme-aware using CSS variables
// ============================================

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  children,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = cn(
    // Layout
    "inline-flex items-center justify-center gap-2",
    // Typography
    "font-semibold",
    // Shape
    "rounded-xl",
    // Touch target (44px minimum)
    "touch-target",
    // Transitions
    "transition-all duration-200 ease-out",
    // Active state
    "active:scale-[0.97]",
    // Disabled state
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
  );

  const variants = {
    primary: cn(
      "bg-[var(--accent)] text-[var(--text-inverted)]",
      "hover:bg-[var(--accent-hover)]",
      "shadow-md hover:shadow-lg",
      "focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]",
    ),
    secondary: cn(
      "bg-[var(--bg-secondary)] text-[var(--text-secondary)]",
      "border border-[var(--border-secondary)]",
      "hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-secondary)]",
      "focus-visible:ring-2 focus-visible:ring-[var(--text-muted)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]",
    ),
    ghost: cn(
      "bg-transparent text-[var(--text-muted)]",
      "hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]",
      "focus-visible:ring-2 focus-visible:ring-[var(--text-muted)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]",
    ),
    danger: cn(
      "bg-[var(--status-error-bg)] text-[var(--status-error)]",
      "border border-[var(--status-error)]/30",
      "hover:bg-[var(--status-error)]/20 hover:border-[var(--status-error)]/50",
      "focus-visible:ring-2 focus-visible:ring-[var(--status-error)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]",
    ),
  };

  const sizes = {
    sm: "px-3 py-2 text-sm min-h-[40px]",
    md: "px-4 py-3 text-base min-h-[48px]",
    lg: "px-6 py-4 text-lg min-h-[56px]",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled}
      {...props}
    >
      {leftIcon && <span className="shrink-0 -ml-0.5">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="shrink-0 -mr-0.5">{rightIcon}</span>}
    </button>
  );
}
