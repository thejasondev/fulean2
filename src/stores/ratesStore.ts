import { atom, computed } from "nanostores";
import { CURRENCIES, DEFAULT_RATES, type Currency } from "../lib/constants";

// ============================================
// Rates Store - Local Vault
// Fully local-first persistence, no API calls
// ============================================

const STORAGE_KEY = "fulean2_rates";

// Offline state (for UI indicator)
export const $isOffline = atom<boolean>(false);

// Base rates per currency
export const $baseRates = atom<Record<Currency, number>>({ ...DEFAULT_RATES });

// Loading state (for UI feedback during save)
export const $isLoadingRates = atom<boolean>(false);

// Last update timestamp
export const $lastUpdate = atom<Date>(new Date());

// ============================================
// LocalStorage Helpers
// ============================================
function saveRatesToStorage(rates: Record<Currency, number>) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ rates, timestamp: Date.now() })
    );
  } catch {
    console.warn("Failed to save rates to localStorage");
  }
}

function loadRatesFromStorage(): Record<Currency, number> | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const { rates } = JSON.parse(stored);
      // Validate that all currencies exist
      const isValid = CURRENCIES.every((c) => typeof rates[c] === "number");
      if (isValid) return rates;
    }
  } catch {
    console.warn("Failed to load rates from localStorage");
  }
  return null;
}

// ============================================
// Computed: Effective Rates
// Currently same as base rates (no spread logic)
// ============================================
export const $effectiveRates = computed([$baseRates], (baseRates) => {
  const safeRates = baseRates || DEFAULT_RATES;
  // Ensure all currencies have valid values
  const result: Record<Currency, number> = {} as Record<Currency, number>;
  for (const currency of CURRENCIES) {
    result[currency] = Math.max(
      1,
      safeRates[currency] || DEFAULT_RATES[currency]
    );
  }
  return result;
});

// Legacy alias
export const $rates = $effectiveRates;

// ============================================
// Actions
// ============================================

/**
 * Set rate for a specific currency
 * Immediately persists to localStorage
 */
export function setRate(currency: Currency, value: number) {
  const validValue = Math.max(1, Math.floor(value));
  const newRates = { ...$baseRates.get(), [currency]: validValue };
  $baseRates.set(newRates);
  $lastUpdate.set(new Date());
  saveRatesToStorage(newRates);
}

/**
 * Set all rates at once
 */
export function setAllRates(rates: Partial<Record<Currency, number>>) {
  const currentRates = $baseRates.get();
  const newRates = { ...currentRates };

  for (const [currency, value] of Object.entries(rates)) {
    if (
      CURRENCIES.includes(currency as Currency) &&
      typeof value === "number"
    ) {
      newRates[currency as Currency] = Math.max(1, Math.floor(value));
    }
  }

  $baseRates.set(newRates);
  $lastUpdate.set(new Date());
  saveRatesToStorage(newRates);
}

/**
 * Reset all rates to defaults
 */
export function resetRates() {
  $baseRates.set({ ...DEFAULT_RATES });
  $lastUpdate.set(new Date());
  saveRatesToStorage({ ...DEFAULT_RATES });
}

/**
 * Simulate refresh (just triggers a visual feedback)
 * No actual API call - we're fully local now
 */
export async function refreshRates(): Promise<{ offline: boolean }> {
  $isLoadingRates.set(true);

  // Brief delay for visual feedback
  await new Promise((resolve) => setTimeout(resolve, 300));

  $isLoadingRates.set(false);
  return { offline: false };
}

/**
 * Get current effective rate for a specific currency
 */
export function getEffectiveRate(currency: Currency): number {
  const rates = $effectiveRates.get();
  return rates?.[currency] ?? DEFAULT_RATES[currency];
}

/**
 * Initialize rates from localStorage on app load
 * If no stored rates, save defaults immediately
 */
export function initializeRates() {
  const storedRates = loadRatesFromStorage();

  if (storedRates) {
    $baseRates.set(storedRates);
  } else {
    // First time - save defaults to storage
    saveRatesToStorage({ ...DEFAULT_RATES });
  }

  // Set up online/offline listeners
  if (typeof window !== "undefined") {
    $isOffline.set(!navigator.onLine);

    window.addEventListener("online", () => {
      $isOffline.set(false);
    });

    window.addEventListener("offline", () => {
      $isOffline.set(true);
    });
  }
}

// ============================================
// Legacy exports for backward compatibility
// ============================================
export const $spreads = atom<Record<Currency, number>>({
  USD: 0,
  EUR: 0,
  CAD: 0,
  MLC: 0,
  CLASICA: 0,
  ZELLE: 0,
});

export function setSpread(currency: Currency, value: number) {
  // No-op for now, keeping for compatibility
}

export function setBaseRate(currency: Currency, value: number) {
  setRate(currency, value);
}
