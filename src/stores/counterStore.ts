import { atom, computed } from "nanostores";
import { DENOMINATIONS, type Denomination } from "../lib/constants";
import { $buyRates, $sellRates } from "./ratesStore";

// ============================================
// Counter Store
// Bill counting state with Buy/Sell operation
// ============================================

// Operation type for counter
export type CounterOperation = "BUY" | "SELL";

// Bill counts for each denomination
type BillCounts = Record<Denomination, number>;

const initialCounts: BillCounts = DENOMINATIONS.reduce(
  (acc, denom) => ({ ...acc, [denom]: 0 }),
  {} as BillCounts
);

// Current bill counts
export const $billCounts = atom<BillCounts>({ ...initialCounts });

// Current operation (affects which rate is used for conversion)
export const $counterOperation = atom<CounterOperation>("BUY");

// Privacy mode (blur totals)
export const $privacyMode = atom<boolean>(false);

// ============================================
// Computed Values (with SSR safety)
// ============================================

// Computed: subtotal for a specific denomination
export function getSubtotal(denomination: Denomination): number {
  const counts = $billCounts.get();
  const count = counts?.[denomination] ?? 0;
  // Integer multiplication - no floating point issues
  return count * denomination;
}

// Computed: grand total in CUP (always integer)
export const $grandTotalCUP = computed($billCounts, (counts) => {
  if (!counts) return 0;

  return DENOMINATIONS.reduce((total, denom) => {
    const count = counts[denom] ?? 0;
    // Integer math only - no floating point issues
    return total + count * denom;
  }, 0);
});

// Computed: totals in foreign currencies based on current operation
// BUY = customer gives you foreign, you give CUP → use buyRate
// SELL = you give foreign, customer gives CUP → use sellRate
export const $foreignTotals = computed(
  [$grandTotalCUP, $buyRates, $sellRates, $counterOperation],
  (cupTotal, buyRates, sellRates, operation) => {
    // SSR safety - default rates for all 6 currencies
    const defaultRates = {
      USD: 320,
      EUR: 335,
      CAD: 280,
      MLC: 275,
      CLASICA: 250,
      ZELLE: 310,
    };

    // Use buy or sell rates based on operation
    const rates =
      operation === "BUY"
        ? buyRates || defaultRates
        : sellRates || defaultRates;

    const safeCupTotal = cupTotal ?? 0;

    // Calculate conversions for all 6 currencies
    return {
      USD: rates.USD > 0 ? safeCupTotal / rates.USD : 0,
      EUR: rates.EUR > 0 ? safeCupTotal / rates.EUR : 0,
      CAD: rates.CAD > 0 ? safeCupTotal / rates.CAD : 0,
      MLC: rates.MLC > 0 ? safeCupTotal / rates.MLC : 0,
      CLASICA: rates.CLASICA > 0 ? safeCupTotal / rates.CLASICA : 0,
      ZELLE: rates.ZELLE > 0 ? safeCupTotal / rates.ZELLE : 0,
    };
  }
);

// ============================================
// Actions
// ============================================

/**
 * Set counter operation (BUY or SELL)
 */
export function setCounterOperation(operation: CounterOperation) {
  $counterOperation.set(operation);
}

// ============================================
// Actions (with input validation)
// ============================================

/**
 * Set bill count for a denomination
 * Validates input: must be non-negative integer
 */
export function setBillCount(denomination: Denomination, count: unknown) {
  // Validate denomination exists
  if (!DENOMINATIONS.includes(denomination)) return;

  // Parse and validate count
  let validCount: number;

  if (typeof count === "number") {
    validCount = Math.max(0, Math.floor(count));
  } else if (typeof count === "string") {
    const parsed = parseInt(count, 10);
    validCount = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
  } else {
    validCount = 0;
  }

  // Prevent excessively large numbers (max 10,000 bills per denomination)
  validCount = Math.min(validCount, 10000);

  $billCounts.set({
    ...$billCounts.get(),
    [denomination]: validCount,
  });
}

/**
 * Add bills to a denomination
 */
export function addBills(denomination: Denomination, amount: number) {
  const current = $billCounts.get()[denomination] ?? 0;
  const safeAmount = Math.max(0, Math.floor(amount));
  setBillCount(denomination, current + safeAmount);
}

/**
 * Add a "fajo" (bundle of 100 bills)
 */
export function addFajo(denomination: Denomination) {
  addBills(denomination, 100);
}

/**
 * Clear all bill counts (reset to zero)
 */
export function clearAll() {
  $billCounts.set({ ...initialCounts });
}

/**
 * Toggle privacy mode
 */
export function togglePrivacyMode() {
  $privacyMode.set(!$privacyMode.get());
}

/**
 * Set privacy mode explicitly
 */
export function setPrivacyMode(enabled: boolean) {
  $privacyMode.set(Boolean(enabled));
}
