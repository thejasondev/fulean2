import { atom, computed } from "nanostores";
import type { Currency } from "../lib/constants";

// ============================================
// Calculator Form Store
// Shared state between CalculatorTab and TotalsFooter
// ============================================

export type CalculatorMode = "BUY" | "SELL" | "COMPARE";

// Form state interface
export interface CalculatorFormState {
  mode: CalculatorMode;
  resultCUP: number;
  currency: Currency;
  amount: number;
  rate: number;
  // COMPARE-specific
  sourceCurrency?: Currency;
  intermediateCurrency?: Currency;
  directWins?: boolean;
  difference?: number;
  percentDiff?: number;
  compareAmount?: number; // Amount being compared
  forexRate?: number; // Exchange rate used (e.g., EUR→USD)
}

// Initial state
const initialState: CalculatorFormState = {
  mode: "BUY",
  resultCUP: 0,
  currency: "USD",
  amount: 0,
  rate: 0,
};

// State atom
export const $calculatorFormState = atom<CalculatorFormState>(initialState);

// Computed: Check if there's a result to copy
export const $canCopyResult = computed(
  $calculatorFormState,
  (state) => state.resultCUP > 0,
);

// ============================================
// Actions
// ============================================

/**
 * Update form state from CalculatorTab component
 */
export function setCalculatorFormState(state: Partial<CalculatorFormState>) {
  const current = $calculatorFormState.get();
  $calculatorFormState.set({ ...current, ...state });
}

/**
 * Clear form state (when leaving Calculator tab)
 */
export function clearCalculatorFormState() {
  $calculatorFormState.set(initialState);
}
