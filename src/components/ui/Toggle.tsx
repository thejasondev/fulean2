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

  // iOS-specific dimensions (typically 51x31px)
  // We use scale to adjust size while keeping proportion
  const iosTrack = size === "md" ? "w-[51px] h-[31px]" : "w-[40px] h-[24px]";
  const iosThumb = size === "md" ? "w-[27px] h-[27px]" : "w-[20px] h-[20px]";
  const iosTranslate =
    size === "md" ? "translate-x-[20px]" : "translate-x-[16px]";

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
          // Base track styles - iOS-like switch
          "relative inline-flex shrink-0 items-center rounded-full",
          "border-2 border-transparent",
          "transition-colors duration-200 ease-in-out cursor-pointer",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]",
          iosTrack,
          // State colors - Using app's accent (Emerald)
          checked
            ? "bg-[var(--accent)]"
            : "bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)]",
        )}
      >
        <span
          className={cn(
            // Thumb styles
            "pointer-events-none inline-block transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
            iosThumb,
            "translate-y-[0px] ml-[1px]", // Fine tuning center
            checked ? iosTranslate : "translate-x-0",
          )}
        />
      </button>
      {label && (
        <span className="text-[var(--text-secondary)] text-sm">{label}</span>
      )}
    </label>
  );
}
