import { atom, computed } from "nanostores";
import { CURRENCIES, DEFAULT_RATES, type Currency } from "../lib/constants";

// ============================================
// Rates Store - Buy/Sell Rate System
// Each currency has buyRate and sellRate
// ============================================

const STORAGE_KEY = "fulean2_rates";

// Offline state
export const $isOffline = atom<boolean>(false);

// Buy rates per currency (what you pay to acquire foreign currency)
export const $buyRates = atom<Record<Currency, number>>({ ...DEFAULT_RATES });

// Sell rates per currency (what you receive when selling foreign currency)
export const $sellRates = atom<Record<Currency, number>>({ ...DEFAULT_RATES });

// Loading state
export const $isLoadingRates = atom<boolean>(false);

// Last update timestamp
export const $lastUpdate = atom<Date>(new Date());

// ============================================
// LocalStorage Helpers
// ============================================
function saveToStorage() {
  try {
    const data = {
      buyRates: $buyRates.get(),
      sellRates: $sellRates.get(),
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    console.warn("Failed to save rates to localStorage");
  }
}

function loadFromStorage(): {
  buyRates: Record<Currency, number>;
  sellRates: Record<Currency, number>;
} | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);

      // Support legacy format (marketRates + spreads)
      if (data.marketRates && !data.buyRates) {
        const legacy = data.marketRates;
        return {
          buyRates: legacy,
          sellRates: legacy,
        };
      }

      const hasBuyRates =
        data.buyRates &&
        CURRENCIES.every((c) => typeof data.buyRates[c] === "number");
      const hasSellRates =
        data.sellRates &&
        CURRENCIES.every((c) => typeof data.sellRates[c] === "number");

      if (hasBuyRates && hasSellRates) {
        return {
          buyRates: data.buyRates,
          sellRates: data.sellRates,
        };
      }
    }
  } catch {
    console.warn("Failed to load rates from localStorage");
  }
  return null;
}

// ============================================
// Computed Values
// ============================================

// Spread per currency (sellRate - buyRate = profit margin)
export const $spreads = computed(
  [$buyRates, $sellRates],
  (buyRates, sellRates) => {
    const result: Record<Currency, number> = {} as Record<Currency, number>;
    for (const currency of CURRENCIES) {
      result[currency] = (sellRates[currency] || 0) - (buyRates[currency] || 0);
    }
    return result;
  }
);

// Use sell rate as "effective rate" for conversions (display purposes)
export const $effectiveRates = $sellRates;
export const $commercialRates = $sellRates;
export const $rates = $sellRates;

// Legacy aliases
export const $marketRates = $buyRates;
export const $baseRates = $buyRates;

// ============================================
// Actions
// ============================================

/**
 * Set buy rate for a currency
 */
export function setBuyRate(currency: Currency, value: number) {
  const validValue = Math.max(1, Math.floor(value));
  $buyRates.set({ ...$buyRates.get(), [currency]: validValue });
  $lastUpdate.set(new Date());
  saveToStorage();
}

/**
 * Set sell rate for a currency
 */
export function setSellRate(currency: Currency, value: number) {
  const validValue = Math.max(1, Math.floor(value));
  $sellRates.set({ ...$sellRates.get(), [currency]: validValue });
  $lastUpdate.set(new Date());
  saveToStorage();
}

/**
 * Set both buy and sell rates at once
 */
export function setRates(
  currency: Currency,
  buyRate: number,
  sellRate: number
) {
  setBuyRate(currency, buyRate);
  setSellRate(currency, sellRate);
}

/**
 * Reset all rates to defaults
 */
export function resetRates() {
  $buyRates.set({ ...DEFAULT_RATES });
  $sellRates.set({ ...DEFAULT_RATES });
  $lastUpdate.set(new Date());
  saveToStorage();
}

/**
 * Legacy: Set rate (sets both buy and sell to same value)
 */
export function setRate(currency: Currency, value: number) {
  setBuyRate(currency, value);
  setSellRate(currency, value);
}

export function setMarketRate(currency: Currency, value: number) {
  setBuyRate(currency, value);
}

export function setSpread(currency: Currency, value: number) {
  // Spread adjusts sell rate: sellRate = buyRate + spread
  const buyRate = $buyRates.get()[currency] || 0;
  setSellRate(currency, buyRate + value);
}

export function resetSpreads() {
  // Make sell rates equal to buy rates (zero spread)
  $sellRates.set({ ...$buyRates.get() });
  $lastUpdate.set(new Date());
  saveToStorage();
}

/**
 * Simulate refresh
 */
export async function refreshRates(): Promise<{ offline: boolean }> {
  $isLoadingRates.set(true);
  await new Promise((resolve) => setTimeout(resolve, 300));
  $isLoadingRates.set(false);
  return { offline: false };
}

/**
 * Get effective rate for a specific currency
 */
export function getEffectiveRate(currency: Currency): number {
  const rates = $sellRates.get();
  return rates?.[currency] ?? DEFAULT_RATES[currency];
}

/**
 * Get the correct rate based on operation type
 * From the cambista's perspective:
 * - BUY: You buy foreign currency FROM customer → use your buyRate (compra)
 * - SELL: You sell foreign currency TO customer → use your sellRate (venta)
 */
export function getRateForOperation(
  currency: Currency,
  operation: "BUY" | "SELL"
): number {
  const rates = operation === "BUY" ? $buyRates.get() : $sellRates.get();
  return rates?.[currency] ?? DEFAULT_RATES[currency];
}

/**
 * Calculate profit for a transaction
 */
export function calculateProfit(
  currency: Currency,
  foreignAmount: number
): number {
  const buyRate = $buyRates.get()[currency] || 0;
  const sellRate = $sellRates.get()[currency] || 0;
  return (sellRate - buyRate) * foreignAmount;
}

/**
 * Initialize rates from localStorage on app load
 */
export function initializeRates() {
  const stored = loadFromStorage();

  if (stored) {
    $buyRates.set(stored.buyRates);
    $sellRates.set(stored.sellRates);
  } else {
    saveToStorage();
  }

  if (typeof window !== "undefined") {
    $isOffline.set(!navigator.onLine);
    window.addEventListener("online", () => $isOffline.set(false));
    window.addEventListener("offline", () => $isOffline.set(true));
  }
}
