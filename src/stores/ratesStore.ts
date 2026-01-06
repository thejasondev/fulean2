import { atom, computed } from "nanostores";
import { DEFAULT_RATES, type Currency } from "../lib/constants";

// ============================================
// Rates Store
// Manages exchange rates with Base Rate + Spread logic
// ============================================

// Rate mode: API (read-only) or Manual (editable)
export type RateMode = "api" | "manual";

// Base rates (before spread adjustment)
export const $baseRates = atom<Record<Currency, number>>({ ...DEFAULT_RATES });

// Spread/margin for each currency (can be positive or negative)
export const $spreads = atom<Record<Currency, number>>({
  USD: 0,
  EUR: 0,
  CAD: 0,
});

// Current rate mode
export const $rateMode = atom<RateMode>("api");

// Loading state for API simulation
export const $isLoadingRates = atom<boolean>(false);

// Last update timestamp
export const $lastUpdate = atom<Date>(new Date());

// ============================================
// Computed: Effective Rates (Base + Spread)
// This is what the entire app uses for calculations
// ============================================
export const $effectiveRates = computed(
  [$baseRates, $spreads],
  (baseRates, spreads) => {
    // Handle SSR where values might be undefined
    const safeBaseRates = baseRates || DEFAULT_RATES;
    const safeSpreads = spreads || { USD: 0, EUR: 0, CAD: 0 };

    return {
      USD: Math.max(1, safeBaseRates.USD + safeSpreads.USD),
      EUR: Math.max(1, safeBaseRates.EUR + safeSpreads.EUR),
      CAD: Math.max(1, safeBaseRates.CAD + safeSpreads.CAD),
    };
  }
);

// Legacy alias for backward compatibility
export const $rates = $effectiveRates;

// ============================================
// Actions
// ============================================

export function setBaseRate(currency: Currency, value: number) {
  const validValue = Math.max(1, Math.floor(value));
  $baseRates.set({
    ...$baseRates.get(),
    [currency]: validValue,
  });
  $lastUpdate.set(new Date());
}

export function setSpread(currency: Currency, value: number) {
  // Spread can be negative (for buying) or positive (for selling)
  const validValue = Math.floor(value);
  $spreads.set({
    ...$spreads.get(),
    [currency]: validValue,
  });
  $lastUpdate.set(new Date());
}

export function setAllSpreads(spread: number) {
  const validValue = Math.floor(spread);
  $spreads.set({
    USD: validValue,
    EUR: validValue,
    CAD: validValue,
  });
  $lastUpdate.set(new Date());
}

export function resetSpreads() {
  $spreads.set({ USD: 0, EUR: 0, CAD: 0 });
  $lastUpdate.set(new Date());
}

export function toggleRateMode() {
  $rateMode.set($rateMode.get() === "api" ? "manual" : "api");
}

export function setRateMode(mode: RateMode) {
  $rateMode.set(mode);
}

// Simulate API fetch (updates base rates with slight variation)
export async function refreshRates() {
  $isLoadingRates.set(true);

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Simulate slight rate variations (±5%)
  const variation = () => 1 + (Math.random() - 0.5) * 0.1;

  $baseRates.set({
    USD: Math.round(DEFAULT_RATES.USD * variation()),
    EUR: Math.round(DEFAULT_RATES.EUR * variation()),
    CAD: Math.round(DEFAULT_RATES.CAD * variation()),
  });

  $lastUpdate.set(new Date());
  $isLoadingRates.set(false);
}

// Get current effective rate for a specific currency
export function getEffectiveRate(currency: Currency): number {
  const rates = $effectiveRates.get();
  return rates?.[currency] ?? DEFAULT_RATES[currency];
}
