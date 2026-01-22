import { atom } from "nanostores";
import {
  DENOMINATIONS,
  CURRENCIES,
  type Denomination,
  type Currency,
} from "../lib/constants";

// ============================================
// Visibility Store
// Controls which bills and currencies are visible
// ============================================

const STORAGE_KEY = "fulean2_visibility";

// Types
type VisibilityState = {
  denominations: Denomination[];
  currencies: Currency[];
};

// Default: all visible except BTC and USDT_TRC20 for first-time users
const defaultState: VisibilityState = {
  denominations: [...DENOMINATIONS],
  currencies: CURRENCIES.filter(
    (c) => c !== "BTC" && c !== "USDT_TRC20",
  ) as Currency[],
};

// Load from localStorage
function loadFromStorage(): VisibilityState {
  if (typeof window === "undefined") return { ...defaultState };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate denominations
      const validDenoms = (parsed.denominations || []).filter((d: number) =>
        DENOMINATIONS.includes(d as Denomination),
      );
      // Validate currencies
      const validCurrencies = (parsed.currencies || []).filter((c: string) =>
        CURRENCIES.includes(c as Currency),
      );
      return {
        denominations:
          validDenoms.length > 0 ? validDenoms : [...DENOMINATIONS],
        currencies:
          validCurrencies.length > 0 ? validCurrencies : [...CURRENCIES],
      };
    }
  } catch {
    // Ignore
  }
  return { ...defaultState };
}

// Save to localStorage
function saveToStorage(state: VisibilityState) {
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore
    }
  }
}

// ============================================
// Atoms
// ============================================

const initialState = loadFromStorage();

export const $visibleDenominations = atom<Denomination[]>(
  initialState.denominations,
);
export const $visibleCurrencies = atom<Currency[]>(initialState.currencies);

// ============================================
// Actions
// ============================================

/**
 * Toggle a denomination's visibility
 */
export function toggleDenomination(denom: Denomination) {
  const current = $visibleDenominations.get();
  const isVisible = current.includes(denom);

  // Prevent hiding all denominations (minimum 1)
  if (isVisible && current.length <= 1) return;

  const updated = isVisible
    ? current.filter((d) => d !== denom)
    : [...current, denom].sort((a, b) => b - a); // Keep sorted descending

  $visibleDenominations.set(updated);
  saveToStorage({
    denominations: updated,
    currencies: $visibleCurrencies.get(),
  });
}

/**
 * Toggle a currency's visibility
 */
export function toggleCurrency(currency: Currency) {
  const current = $visibleCurrencies.get();
  const isVisible = current.includes(currency);

  // Prevent hiding all currencies (minimum 1)
  if (isVisible && current.length <= 1) return;

  const updated = isVisible
    ? current.filter((c) => c !== currency)
    : [...current, currency];

  // Keep original order from CURRENCIES
  const sorted = CURRENCIES.filter((c) => updated.includes(c));

  $visibleCurrencies.set(sorted);
  saveToStorage({
    denominations: $visibleDenominations.get(),
    currencies: sorted,
  });
}

/**
 * Check if a denomination is visible
 */
export function isDenominationVisible(denom: Denomination): boolean {
  return $visibleDenominations.get().includes(denom);
}

/**
 * Check if a currency is visible
 */
export function isCurrencyVisible(currency: Currency): boolean {
  return $visibleCurrencies.get().includes(currency);
}

/**
 * Reset all visibility to defaults
 */
export function resetVisibility() {
  $visibleDenominations.set([...DENOMINATIONS]);
  $visibleCurrencies.set([...CURRENCIES]);
  saveToStorage({
    denominations: [...DENOMINATIONS],
    currencies: [...CURRENCIES],
  });
}
