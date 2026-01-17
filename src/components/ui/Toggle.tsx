import { cn } from "../../lib/utils";

// ============================================
// Toggle Component
// Accessible switch with smooth animations
// Theme-aware using CSS variables
// ============================================

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: "sm" | "md";
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  size = "md",
}: ToggleProps) {
  const sizes = {
    sm: { track: "h-6 w-10", thumb: "h-4 w-4", translate: "translate-x-5" },
    md: { track: "h-7 w-12", thumb: "h-5 w-5", translate: "translate-x-6" },
  };

  const { track, thumb, translate } = sizes[size];

  return (
    <label
      className={cn(
        "inline-flex items-center gap-3 cursor-pointer select-none",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked ? "true" : "false"}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          // Base track styles
          "relative inline-flex shrink-0 items-center rounded-full",
          track,
          // Transition
          "transition-colors duration-200 ease-in-out",
          // Touch target
          "touch-target",
          // Focus styles (accessible)
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]",
          // State colors
          checked ? "bg-[var(--accent)]" : "bg-[var(--bg-tertiary)]",
        )}
      >
        <span
          className={cn(
            // Thumb styles
            "pointer-events-none inline-block transform rounded-full",
            "bg-[var(--text-primary)] shadow-lg",
            // Transition
            "transition-transform duration-200 ease-in-out",
            thumb,
            // Position
            checked ? translate : "translate-x-1",
          )}
        />
      </button>
      {label && (
        <span className="text-[var(--text-secondary)] text-sm">{label}</span>
      )}
    </label>
  );
}
