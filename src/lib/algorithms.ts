import { DENOMINATIONS, type Denomination } from "./constants";

// ============================================
// Bill Breakdown Algorithm
// Optimal coin-change with dynamic programming
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
 * Uses dynamic programming to find exact solutions when possible
 *
 * @param targetCUP - The target amount in CUP
 * @param activeDenominations - Optional array of denominations to use (defaults to all)
 * @returns BreakdownResult with bill counts and any remainder
 */
export function calculateBillBreakdown(
  targetCUP: unknown,
  activeDenominations?: Denomination[],
): BreakdownResult {
  const safeTarget = toSafePositiveInt(targetCUP);
  const denoms = activeDenominations?.length
    ? [...activeDenominations].sort((a, b) => b - a) // Sort descending
    : DENOMINATIONS;

  if (safeTarget === 0) {
    return {
      targetCUP: 0,
      breakdown: denoms.map((d) => ({
        denomination: d,
        count: 0,
        subtotal: 0,
      })),
      totalBills: 0,
      remainder: 0,
    };
  }

  // Try to find an exact solution using DP
  const exactSolution = findExactBreakdown(safeTarget, denoms);

  if (exactSolution) {
    return exactSolution;
  }

  // Fallback: Find the closest solution (minimize remainder)
  return findClosestBreakdown(safeTarget, denoms);
}

/**
 * Dynamic Programming approach to find exact bill breakdown
 * Returns null if no exact solution exists
 */
function findExactBreakdown(
  target: number,
  denoms: Denomination[],
): BreakdownResult | null {
  // dp[i] = minimum number of bills to make amount i, or Infinity if impossible
  // We also track which denomination was used at each step for reconstruction
  const dp: number[] = new Array(target + 1).fill(Infinity);
  const parent: (Denomination | null)[] = new Array(target + 1).fill(null);

  dp[0] = 0;

  for (let amount = 1; amount <= target; amount++) {
    for (const denom of denoms) {
      if (denom <= amount && dp[amount - denom] + 1 < dp[amount]) {
        dp[amount] = dp[amount - denom] + 1;
        parent[amount] = denom;
      }
    }
  }

  // No exact solution found
  if (dp[target] === Infinity) {
    return null;
  }

  // Reconstruct the solution
  const billCounts = new Map<Denomination, number>();
  denoms.forEach((d) => billCounts.set(d, 0));

  let remaining = target;
  while (remaining > 0 && parent[remaining]) {
    const denom = parent[remaining]!;
    billCounts.set(denom, (billCounts.get(denom) || 0) + 1);
    remaining -= denom;
  }

  const breakdown: BillBreakdown[] = denoms.map((d) => ({
    denomination: d,
    count: billCounts.get(d) || 0,
    subtotal: (billCounts.get(d) || 0) * d,
  }));

  const totalBills = breakdown.reduce((sum, b) => sum + b.count, 0);

  return {
    targetCUP: target,
    breakdown,
    totalBills,
    remainder: 0,
  };
}

/**
 * Greedy fallback when no exact solution exists
 * Finds the combination with minimum remainder
 */
function findClosestBreakdown(
  target: number,
  denoms: Denomination[],
): BreakdownResult {
  const breakdown: BillBreakdown[] = [];
  let remaining = target;
  let totalBills = 0;

  // Greedy: largest first
  for (const denom of denoms) {
    if (remaining >= denom) {
      const count = Math.floor(remaining / denom);
      const subtotal = count * denom;
      breakdown.push({ denomination: denom, count, subtotal });
      remaining -= subtotal;
      totalBills += count;
    } else {
      breakdown.push({ denomination: denom, count: 0, subtotal: 0 });
    }
  }

  return {
    targetCUP: target,
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
          "es-CU",
        )} CUP`,
    );

  return lines.join("\n");
}
