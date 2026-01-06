import { DENOMINATIONS, type Denomination } from "./constants";

// ============================================
// Bill Breakdown Algorithm
// Greedy algorithm with safety checks
// ============================================

export interface BillBreakdown {
  denomination: Denomination;
  count: number;
  subtotal: number;
}

export interface BreakdownResult {
  targetCUP: number;
  breakdown: BillBreakdown[];
  totalBills: number;
  remainder: number;
}

/**
 * Safely convert to positive integer
 */
function toSafePositiveInt(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  if (Number.isNaN(num) || !Number.isFinite(num)) return 0;
  return Math.max(0, Math.floor(num));
}

/**
 * Calculate the optimal breakdown of bills for a target CUP amount
 * Uses a greedy algorithm starting with the largest denomination
 *
 * @param targetCUP - The target amount in CUP
 * @returns BreakdownResult with bill counts and any remainder
 */
export function calculateBillBreakdown(targetCUP: unknown): BreakdownResult {
  // Ensure we're working with a positive integer
  const safeTarget = toSafePositiveInt(targetCUP);
  let remaining = safeTarget;
  const breakdown: BillBreakdown[] = [];
  let totalBills = 0;

  // Greedy approach: start with largest denomination
  for (const denomination of DENOMINATIONS) {
    if (remaining >= denomination) {
      const count = Math.floor(remaining / denomination);
      const subtotal = count * denomination;

      breakdown.push({
        denomination,
        count,
        subtotal,
      });

      remaining -= subtotal;
      totalBills += count;
    } else {
      // Include zero-count denominations for complete display
      breakdown.push({
        denomination,
        count: 0,
        subtotal: 0,
      });
    }
  }

  return {
    targetCUP: safeTarget,
    breakdown,
    totalBills,
    remainder: remaining,
  };
}

/**
 * Calculate CUP amount from foreign currency
 * Uses Math.round to avoid floating point issues
 *
 * @param amount - Amount in foreign currency
 * @param rate - Exchange rate (CUP per 1 unit of foreign currency)
 * @returns Amount in CUP (integer)
 */
export function convertToCUP(amount: unknown, rate: unknown): number {
  const safeAmount = Number(amount);
  const safeRate = Number(rate);

  // Validate inputs
  if (
    Number.isNaN(safeAmount) ||
    Number.isNaN(safeRate) ||
    !Number.isFinite(safeAmount) ||
    !Number.isFinite(safeRate) ||
    safeRate <= 0 ||
    safeAmount < 0
  ) {
    return 0;
  }

  // Round to avoid floating point precision issues
  return Math.round(safeAmount * safeRate);
}

/**
 * Calculate foreign currency amount from CUP
 *
 * @param cupAmount - Amount in CUP
 * @param rate - Exchange rate (CUP per 1 unit of foreign currency)
 * @returns Amount in foreign currency
 */
export function convertFromCUP(cupAmount: unknown, rate: unknown): number {
  const safeCup = Number(cupAmount);
  const safeRate = Number(rate);

  // Validate inputs
  if (
    Number.isNaN(safeCup) ||
    Number.isNaN(safeRate) ||
    !Number.isFinite(safeCup) ||
    !Number.isFinite(safeRate) ||
    safeRate <= 0 ||
    safeCup < 0
  ) {
    return 0;
  }

  return safeCup / safeRate;
}

/**
 * Format breakdown for display or sharing
 */
export function formatBreakdownText(result: BreakdownResult): string {
  if (!result || !result.breakdown) return "";

  const lines = result.breakdown
    .filter((b) => b.count > 0)
    .map(
      (b) =>
        `${b.count}x ${b.denomination} CUP = ${b.subtotal.toLocaleString(
          "es-CU"
        )} CUP`
    );

  return lines.join("\n");
}
