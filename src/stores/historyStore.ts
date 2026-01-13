import { atom } from "nanostores";
import { DENOMINATIONS, type Denomination } from "../lib/constants";

// ============================================
// History Store
// Transaction records with localStorage persistence
// ============================================

// Operation types
export type OperationType = "BUY" | "SELL";

// Supported currencies (the 6 pillars)
export type TransactionCurrency =
  | "USD"
  | "EUR"
  | "CAD"
  | "MLC"
  | "CLASICA"
  | "ZELLE";

// Transaction record interface
export interface Transaction {
  id: string;
  date: string;
  // Core transaction fields
  operationType: OperationType;
  currency: TransactionCurrency;
  amountForeign: number;
  rate: number;
  totalCUP: number;
  // Profit tracking (NEW)
  profitCUP?: number; // Spread × amountForeign (potential profit from this transaction)
  cupImpact?: number; // + for SELL (CUP received), - for BUY (CUP paid)
  spreadUsed?: number; // Sell rate - Buy rate at transaction time
  // Legacy fields for backward compatibility with old records
  conversions?: { USD: number; EUR: number; CAD: number };
  ratesUsed?: Record<string, number>;
  billCounts?: Record<Denomination, number>;
}

// LocalStorage key
const STORAGE_KEY = "fulean2_transactions";

// Load from localStorage (SSR-safe)
function loadFromStorage(): Transaction[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Save to localStorage
function saveToStorage(transactions: Transaction[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch {
    // Ignore storage errors
  }
}

// Transactions atom
export const $transactions = atom<Transaction[]>(loadFromStorage());

// Subscribe to changes and persist
if (typeof window !== "undefined") {
  $transactions.subscribe((value) => {
    saveToStorage(value);
  });
}

// ============================================
// Actions
// ============================================

/**
 * Generate unique ID
 */
function generateId(): string {
  return `txn-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Save a new transaction with profit tracking
 */
export function saveTransaction(
  operationType: OperationType,
  currency: TransactionCurrency,
  amountForeign: number,
  rate: number,
  totalCUP: number,
  spreadUsed?: number // Optional: sellRate - buyRate for profit calculation
): Transaction {
  // Calculate profit and capital impact
  // IMPORTANT: Profit is only realized on SELL operations
  // BUY = acquire currency (no profit yet, just potential)
  // SELL = dispose currency (profit = spread × amount)
  const profitCUP =
    operationType === "SELL" && spreadUsed
      ? Math.round(spreadUsed * amountForeign)
      : 0;
  const cupImpact =
    operationType === "BUY" ? -Math.round(totalCUP) : Math.round(totalCUP);

  const transaction: Transaction = {
    id: generateId(),
    date: new Date().toISOString(),
    operationType,
    currency,
    amountForeign: Math.round(amountForeign * 100) / 100, // 2 decimal precision
    rate: Math.round(rate),
    totalCUP: Math.round(totalCUP),
    profitCUP,
    cupImpact,
    spreadUsed: spreadUsed ? Math.round(spreadUsed) : undefined,
  };

  const current = $transactions.get();
  $transactions.set([transaction, ...current]);

  return transaction;
}

/**
 * Legacy save function (for backward compatibility)
 * @deprecated Use saveTransaction with new parameters
 */
export function saveLegacyTransaction(
  totalCUP: number,
  conversions: { USD: number; EUR: number; CAD: number },
  ratesUsed: Record<string, number>,
  billCounts: Record<Denomination, number>
): void {
  const transaction: Transaction = {
    id: generateId(),
    date: new Date().toISOString(),
    operationType: "SELL", // Legacy transactions assumed to be sales
    currency: "USD",
    amountForeign: conversions.USD,
    rate: ratesUsed.USD || 320,
    totalCUP: Math.round(totalCUP),
    // Keep legacy fields
    conversions,
    ratesUsed,
    billCounts,
  };

  const current = $transactions.get();
  $transactions.set([transaction, ...current]);
}

/**
 * Delete a transaction by ID
 */
export function deleteTransaction(id: string): void {
  const current = $transactions.get();
  $transactions.set(current.filter((t) => t.id !== id));
}

/**
 * Clear all transaction history
 */
export function clearAllHistory(): void {
  $transactions.set([]);
}

/**
 * Get transactions count
 */
export function getTransactionCount(): number {
  return $transactions.get().length;
}
