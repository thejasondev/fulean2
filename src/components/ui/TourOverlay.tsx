import { useEffect, useState, useRef } from "react";
import { useStore } from "@nanostores/react";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import {
  $isTourActive,
  $currentTourStep,
  $tourStep,
  $isLastStep,
  TOUR_STEPS,
  nextTourStep,
  prevTourStep,
  skipTour,
  completeTour,
} from "../../stores/onboardingStore";
import { cn } from "../../lib/utils";
import { Button } from "./Button";

// ============================================
// TourOverlay Component
// Interactive onboarding tour with spotlight effect
// ============================================

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function TourOverlay() {
  const isActive = useStore($isTourActive);
  const currentStep = useStore($currentTourStep);
  const stepIndex = useStore($tourStep);
  const isLast = useStore($isLastStep);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);

  // Find and track target element position
  useEffect(() => {
    if (!isActive || !currentStep) {
      setTargetRect(null);
      return;
    }

    const updatePosition = () => {
      const target = document.querySelector(currentStep.target);
      if (target) {
        const rect = target.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      } else {
        setTargetRect(null);
      }
    };

    updatePosition();

    // Update on resize/scroll
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    // Small delay for DOM updates
    const timeout = setTimeout(updatePosition, 100);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      clearTimeout(timeout);
    };
  }, [isActive, currentStep]);

  if (!isActive || !currentStep) return null;

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect)
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

    const padding = 12;
    const tooltipHeight = 160;
    const tooltipWidth = 280;

    switch (currentStep.position) {
      case "bottom":
        return {
          top: targetRect.top + targetRect.height + padding,
          left: Math.max(
            padding,
            Math.min(
              targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
              window.innerWidth - tooltipWidth - padding,
            ),
          ),
        };
      case "top":
        return {
          top: targetRect.top - tooltipHeight - padding,
          left: Math.max(
            padding,
            Math.min(
              targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
              window.innerWidth - tooltipWidth - padding,
            ),
          ),
        };
      case "left":
        return {
          top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          left: targetRect.left - tooltipWidth - padding,
        };
      case "right":
        return {
          top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          left: targetRect.left + targetRect.width + padding,
        };
      default:
        return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }
  };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-auto">
      {/* Dark overlay with spotlight cutout */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: "auto" }}
      >
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#spotlight-mask)"
          onClick={skipTour}
        />
      </svg>

      {/* Spotlight ring glow */}
      {targetRect && (
        <div
          className="absolute rounded-xl ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-transparent animate-pulse pointer-events-none"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      )}

      {/* Tooltip Card */}
      <div
        className={cn(
          "absolute w-[280px] p-4 rounded-2xl",
          "bg-[var(--bg-primary)] border border-[var(--border-secondary)]",
          "shadow-2xl shadow-black/20",
          "animate-fade-in",
        )}
        style={getTooltipStyle()}
      >
        {/* Close button */}
        <button
          onClick={skipTour}
          className="absolute top-2 right-2 p-1.5 rounded-lg text-[var(--text-faint)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          <X size={16} />
        </button>

        {/* Content */}
        <div className="mb-4">
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">
            {currentStep.title}
          </h3>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            {currentStep.description}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 mb-4">
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                i === stepIndex
                  ? "w-4 bg-[var(--accent)]"
                  : i < stepIndex
                    ? "bg-[var(--accent)]/50"
                    : "bg-[var(--border-secondary)]",
              )}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          {stepIndex > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={prevTourStep}
              className="flex-1"
            >
              <ChevronLeft size={16} />
              Anterior
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={skipTour}
              className="flex-1 text-[var(--text-faint)]"
            >
              Saltar
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={isLast ? completeTour : nextTourStep}
            className="flex-1 gap-1"
          >
            {isLast ? (
              <>
                <Sparkles size={14} />
                ¡Listo!
              </>
            ) : (
              <>
                Siguiente
                <ChevronRight size={16} />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
