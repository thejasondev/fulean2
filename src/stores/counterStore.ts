import { atom, computed } from "nanostores";
import { DENOMINATIONS, type Denomination } from "../lib/constants";
import { $effectiveRates } from "./ratesStore";

// ============================================
// Counter Store
// Bill counting state with input validation
// ============================================

// Bill counts for each denomination
type BillCounts = Record<Denomination, number>;

const initialCounts: BillCounts = DENOMINATIONS.reduce(
  (acc, denom) => ({ ...acc, [denom]: 0 }),
  {} as BillCounts
);

// Current bill counts
export const $billCounts = atom<BillCounts>({ ...initialCounts });

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

// Computed: totals in foreign currencies
// NOTE: nanostores v1.1.0 passes values directly, not as array
export const $foreignTotals = computed(
  [$grandTotalCUP, $effectiveRates],
  (cupTotal, rates) => {
    // SSR safety - default rates for all 6 currencies
    const safeRates = rates || {
      USD: 320,
      EUR: 335,
      CAD: 280,
      MLC: 275,
      CLASICA: 250,
      ZELLE: 310,
    };
    const safeCupTotal = cupTotal ?? 0;

    // Calculate conversions for all 6 currencies
    return {
      USD: safeRates.USD > 0 ? safeCupTotal / safeRates.USD : 0,
      EUR: safeRates.EUR > 0 ? safeCupTotal / safeRates.EUR : 0,
      CAD: safeRates.CAD > 0 ? safeCupTotal / safeRates.CAD : 0,
      MLC: safeRates.MLC > 0 ? safeCupTotal / safeRates.MLC : 0,
      CLASICA: safeRates.CLASICA > 0 ? safeCupTotal / safeRates.CLASICA : 0,
      ZELLE: safeRates.ZELLE > 0 ? safeCupTotal / safeRates.ZELLE : 0,
    };
  }
);

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
