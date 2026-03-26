import { atom } from "nanostores";
import { getSunTimes } from "../lib/solar";

// ============================================
// Theme Store
// Manages theme state (dark/sunlight) with persistence
// Auto-switches based on real sunrise/sunset for Cuba
// ============================================

export type Theme = "dark" | "sunlight";
export type ThemeMode = "auto" | "manual";

const STORAGE_KEY = "fulean2-theme";
const MODE_KEY = "fulean2-theme-mode";

// Twilight buffers (minutes)
const SUNSET_BUFFER = 30; // Dark mode starts 30min after sunset (twilight)
const SUNRISE_BUFFER = 20; // Light mode starts 20min before sunrise (pre-dawn)

// Theme atom - defaults to dark
export const $theme = atom<Theme>("dark");
// Theme mode - auto (time-based) or manual (user-set)
export const $themeMode = atom<ThemeMode>("auto");

/**
 * Check if current time is in dark mode hours
 * Uses real sunrise/sunset calculation for Cuba
 */
function isDarkModeTime(): boolean {
  const now = new Date();
  const { sunrise, sunset } = getSunTimes(now);

  // Add twilight buffers
  const darkStart = new Date(sunset.getTime() + SUNSET_BUFFER * 60000);
  const lightStart = new Date(sunrise.getTime() - SUNRISE_BUFFER * 60000);

  // Dark mode: after sunset+buffer OR before sunrise-buffer
  return now >= darkStart || now < lightStart;
}

/**
 * Get the recommended theme based on current time
 */
function getTimeBasedTheme(): Theme {
  return isDarkModeTime() ? "dark" : "sunlight";
}

/**
 * Initialize theme from localStorage or auto-detect
 * Call this on app mount
 */
export function initializeTheme() {
  if (typeof window === "undefined") return;

  try {
    // Check if user has set a manual preference
    const storedMode = localStorage.getItem(MODE_KEY);
    const storedTheme = localStorage.getItem(STORAGE_KEY);

    if (
      storedMode === "manual" &&
      (storedTheme === "dark" || storedTheme === "sunlight")
    ) {
      // User has manually set a theme - respect it
      $themeMode.set("manual");
      $theme.set(storedTheme);
      applyTheme(storedTheme);
    } else {
      // Auto mode - set theme based on time
      $themeMode.set("auto");
      const autoTheme = getTimeBasedTheme();
      $theme.set(autoTheme);
      applyTheme(autoTheme);

      // Set up interval to check time every minute
      startAutoThemeChecker();
    }
  } catch {
    // localStorage not available, use auto mode
    const autoTheme = getTimeBasedTheme();
    $theme.set(autoTheme);
    applyTheme(autoTheme);
  }
}

/**
 * Start interval to check and update theme based on time
 */
let autoThemeInterval: ReturnType<typeof setInterval> | null = null;

function startAutoThemeChecker() {
  // Clear existing interval if any
  if (autoThemeInterval) {
    clearInterval(autoThemeInterval);
  }

  // Check every minute
  autoThemeInterval = setInterval(() => {
    if ($themeMode.get() === "auto") {
      const timeTheme = getTimeBasedTheme();
      if ($theme.get() !== timeTheme) {
        $theme.set(timeTheme);
        applyTheme(timeTheme);
      }
    }
  }, 60000); // Check every 60 seconds
}

/**
 * Set theme manually and persist to localStorage
 */
export function setTheme(theme: Theme) {
  $theme.set(theme);
  $themeMode.set("manual");
  applyTheme(theme);
  persistTheme(theme);
  persistThemeMode("manual");

  // Stop auto checker when manual mode is set
  if (autoThemeInterval) {
    clearInterval(autoThemeInterval);
    autoThemeInterval = null;
  }
}

/**
 * Toggle between dark and sunlight themes (sets manual mode)
 */
export function toggleTheme() {
  const current = $theme.get();
  const next = current === "dark" ? "sunlight" : "dark";
  setTheme(next);
}

/**
 * Reset to auto mode (time-based)
 */
export function setAutoTheme() {
  $themeMode.set("auto");
  persistThemeMode("auto");

  // Clear manual theme from storage
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }

  // Apply time-based theme
  const autoTheme = getTimeBasedTheme();
  $theme.set(autoTheme);
  applyTheme(autoTheme);

  // Restart auto checker
  startAutoThemeChecker();
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

/**
 * Persist theme mode to localStorage
 */
function persistThemeMode(mode: ThemeMode) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    // localStorage not available, ignore
  }
}
