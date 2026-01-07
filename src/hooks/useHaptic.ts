import { useCallback } from "react";

// ============================================
// useHaptic Hook
// Provides tactile feedback patterns for mobile UX
// ============================================

type HapticPattern = "light" | "medium" | "heavy" | "success" | "error";

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10, // Typing, tab changes
  medium: 40, // Adding bundles, confirming
  heavy: 70, // Delete, clear all
  success: [10, 50, 20], // Success confirmation
  error: [50, 30, 50], // Error feedback
};

/**
 * Safe wrapper around navigator.vibrate
 * Returns a function that triggers haptic feedback
 */
export function useHaptic() {
  const vibrate = useCallback((pattern: HapticPattern = "light") => {
    // Check if vibration API is supported
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(PATTERNS[pattern]);
      } catch {
        // Silently fail - some browsers block vibration
      }
    }
  }, []);

  return {
    vibrate,
    light: () => vibrate("light"),
    medium: () => vibrate("medium"),
    heavy: () => vibrate("heavy"),
    success: () => vibrate("success"),
    error: () => vibrate("error"),
  };
}

// Standalone function for use outside of React components
export function hapticFeedback(pattern: HapticPattern = "light") {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(PATTERNS[pattern]);
    } catch {
      // Silently fail
    }
  }
}
