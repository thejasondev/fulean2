// ============================================
// Currency Formatters
// Safe formatting with edge case handling
// ============================================

/**
 * Safely format a number, handling NaN, undefined, Infinity
 */
function safeNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  if (Number.isNaN(num) || !Number.isFinite(num)) return 0;
  return num;
}

/**
 * Format a number as Cuban Peso currency
 * Always returns a valid string, never throws
 */
export function formatCUP(amount: unknown): string {
  const safeAmount = safeNumber(amount);
  return (
    new Intl.NumberFormat("es-CU", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(safeAmount)) + " CUP"
  );
}

/**
 * Format a number as foreign currency (USD, EUR, CAD)
 * Uses 2 decimal places for foreign currencies
 */
export function formatCurrency(
  amount: unknown,
  currency: "USD" | "EUR" | "CAD"
): string {
  const safeAmount = safeNumber(amount);
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    CAD: "C$",
  };

  return (
    symbols[currency] +
    new Intl.NumberFormat("es-CU", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeAmount)
  );
}

/**
 * Format a large number with thousand separators
 * Rounds to integer for CUP display
 */
export function formatNumber(value: unknown): string {
  const safeValue = safeNumber(value);
  return new Intl.NumberFormat("es-CU", {
    maximumFractionDigits: 0,
  }).format(Math.round(safeValue));
}

/**
 * Convert CUP to foreign currency
 * Prevents division by zero
 */
export function convertFromCUP(cupAmount: unknown, rate: unknown): number {
  const safeCup = safeNumber(cupAmount);
  const safeRate = safeNumber(rate);

  if (safeRate <= 0) return 0;
  return safeCup / safeRate;
}

/**
 * Parse numeric input safely
 * Returns 0 for invalid input, clamps negatives to 0
 */
export function parseNumericInput(value: string): number {
  if (!value || value.trim() === "") return 0;

  // Remove non-numeric characters except decimal
  const cleaned = value.replace(/[^0-9.]/g, "");
  const parsed = parseFloat(cleaned);

  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) return 0;
  return Math.max(0, parsed); // Clamp to 0 (no negatives)
}

/**
 * Parse integer input (for bill counts)
 * Returns 0 for invalid input, clamps negatives to 0
 */
export function parseIntegerInput(value: string): number {
  if (!value || value.trim() === "") return 0;

  // Remove non-numeric characters
  const cleaned = value.replace(/[^0-9]/g, "");
  const parsed = parseInt(cleaned, 10);

  if (Number.isNaN(parsed)) return 0;
  return Math.max(0, parsed);
}

/**
 * Privacy mask for amounts
 */
export function maskAmount(): string {
  return "••••";
}
