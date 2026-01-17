import { atom } from "nanostores";

// ============================================
// Theme Store
// Manages theme state (dark/sunlight) with persistence
// ============================================

export type Theme = "dark" | "sunlight";

const STORAGE_KEY = "fulean2-theme";

// Theme atom - defaults to dark
export const $theme = atom<Theme>("dark");

/**
 * Initialize theme from localStorage
 * Call this on app mount
 */
export function initializeTheme() {
  if (typeof window === "undefined") return;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "sunlight") {
      $theme.set(stored);
      applyTheme(stored);
    } else {
      // Apply default dark theme
      applyTheme("dark");
    }
  } catch {
    // localStorage not available, use default
    applyTheme("dark");
  }
}

/**
 * Set theme and persist to localStorage
 */
export function setTheme(theme: Theme) {
  $theme.set(theme);
  applyTheme(theme);
  persistTheme(theme);
}

/**
 * Toggle between dark and sunlight themes
 */
export function toggleTheme() {
  const current = $theme.get();
  const next = current === "dark" ? "sunlight" : "dark";
  setTheme(next);
}

/**
 * Apply theme class to document and update meta theme-color
 */
function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  // Remove existing theme classes
  root.classList.remove("theme-dark", "theme-sunlight");

  // Add new theme class
  root.classList.add(`theme-${theme}`);

  // Update meta theme-color for mobile browsers
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute(
      "content",
      theme === "sunlight" ? "#FFFFFF" : "#0a0a0a",
    );
  }
}

/**
 * Persist theme preference to localStorage
 */
function persistTheme(theme: Theme) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage not available, ignore
  }
}
