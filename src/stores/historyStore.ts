import { atom, computed } from "nanostores";
import {
  DENOMINATIONS,
  type Denomination,
  type Currency,
} from "../lib/constants";
import {
  addInventoryLot,
  consumeInventoryLots,
  getAverageCost,
} from "./inventoryStore";
import {
  $activeWalletId,
  $defaultWalletId,
  CONSOLIDATED_ID,
  initializeWallets,
} from "./walletStore";

// ============================================
// History Store
// Transaction records with localStorage persistence
// ============================================

// Operation types
export type OperationType = "BUY" | "SELL" | "EXCHANGE";

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
  walletId?: string; // Multi-wallet support
  // Core transaction fields
  operationType: OperationType;
  currency: TransactionCurrency;
  amountForeign: number;
  rate: number;
  totalCUP: number;
  // Optional note for tracking clients/debts
  note?: string;
  // FIFO Profit tracking (NEW - precise calculation)
  costBasis?: number; // Actual cost from FIFO lots (for SELL only)
  realProfitCUP?: number; // totalCUP - costBasis (actual profit)
  lotsConsumed?: string[]; // IDs of inventory lots used
  // EXCHANGE operation fields
  fromCurrency?: TransactionCurrency; // Source currency (what you gave)
  toCurrency?: TransactionCurrency; // Target currency (what you received)
  exchangeRate?: number; // e.g., 1.13 EUR->USD
  amountReceived?: number; // Amount of target currency received
  derivedCostRate?: number; // Cost rate for target: sourceCostRate / exchangeRate
  // Legacy fields (still supported)
  profitCUP?: number; // Old: Spread × amountForeign (estimate)
  cupImpact?: number; // + for SELL (CUP received), - for BUY (CUP paid)
  spreadUsed?: number; // Sell rate - Buy rate at transaction time
  // Backward compatibility
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
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

// Save to localStorage
function saveToStorage(transactions: Transaction[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch {
    // Ignore storage errors
  }
}

// Transaction store
export const $transactions = atom<Transaction[]>(loadFromStorage());

// Computed: Transactions filtered by active wallet
export const $walletTransactions = computed(
  [$transactions, $activeWalletId, $defaultWalletId],
  (transactions, activeWalletId, defaultWalletId) => {
    // Consolidated view: return all transactions
    if (!activeWalletId || activeWalletId === CONSOLIDATED_ID) {
      return transactions;
    }
    // Filter by wallet
    // Legacy transactions (without walletId) only appear in the default wallet
    return transactions.filter((t) => {
      if (t.walletId) {
        // Transaction has explicit wallet assignment
        return t.walletId === activeWalletId;
      } else {
        // Legacy transaction: only show in default wallet
        return activeWalletId === defaultWalletId;
      }
    });
  },
);

// Subscribe to persist on changes
if (typeof window !== "undefined") {
  $transactions.subscribe(saveToStorage);
  // Initialize wallet system on load
  initializeWallets();
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
 * Save a new transaction with FIFO profit tracking
 *
 * BUY: Creates inventory lot at the purchase rate
 * SELL: Consumes inventory lots (FIFO) and calculates real profit
 */
export function saveTransaction(
  operationType: OperationType,
  currency: TransactionCurrency,
  amountForeign: number,
  rate: number,
  totalCUP: number,
  spreadUsed?: number, // Optional: for legacy/estimated profit
  walletId?: string, // Target wallet ID
  note?: string, // Optional note for tracking
): Transaction {
  const txnId = generateId();

  let costBasis: number | undefined;
  let realProfitCUP: number | undefined;
  let lotsConsumed: string[] | undefined;

  // Legacy estimated profit (based on current spread)
  const estimatedProfit =
    operationType === "SELL" && spreadUsed
      ? Math.round(spreadUsed * amountForeign)
      : 0;

  if (operationType === "BUY") {
    // Create inventory lot at purchase rate
    addInventoryLot(currency as Currency, amountForeign, rate, txnId);
  } else {
    // SELL: Consume lots using FIFO and calculate real profit
    const consumption = consumeInventoryLots(
      currency as Currency,
      amountForeign,
    );

    if (consumption) {
      // We have inventory to consume - calculate real profit
      costBasis = consumption.totalCost;
      realProfitCUP = Math.round(totalCUP) - costBasis;
      lotsConsumed = consumption.lotsConsumed;
    } else {
      // No inventory (selling without prior purchase) - use average or 0
      const avgCost = getAverageCost(currency as Currency);
      if (avgCost > 0) {
        costBasis = Math.round(amountForeign * avgCost);
        realProfitCUP = Math.round(totalCUP) - costBasis;
      } else {
        // No inventory history - fall back to estimated profit
        realProfitCUP = estimatedProfit;
      }
    }
  }

  const cupImpact =
    operationType === "BUY" ? -Math.round(totalCUP) : Math.round(totalCUP);

  const transaction: Transaction = {
    id: txnId,
    date: new Date().toISOString(),
    walletId: walletId ?? $activeWalletId.get() ?? undefined,
    operationType,
    currency,
    amountForeign: Math.round(amountForeign * 100) / 100,
    rate: Math.round(rate),
    totalCUP: Math.round(totalCUP),
    // FIFO-based profit (accurate)
    costBasis,
    realProfitCUP,
    lotsConsumed,
    // Legacy profit (estimate)
    profitCUP:
      operationType === "SELL" ? (realProfitCUP ?? estimatedProfit) : 0,
    cupImpact,
    spreadUsed: spreadUsed ? Math.round(spreadUsed) : undefined,
    note: note?.trim() || undefined,
  };

  const current = $transactions.get();
  $transactions.set([transaction, ...current]);

  return transaction;
}

/**
 * Save a currency exchange transaction
 *
 * Handles lateral currency-to-currency exchange:
 * - Consumes inventory from source currency (FIFO)
 * - Adds inventory to target currency with derived cost rate
 * - Formula: derivedCostRate = sourceCostRate / exchangeRate
 *
 * Example: 100 EUR (bought at 520 CUP/EUR) → 113 USD at 1.13 rate
 * - Derived USD cost rate: 520 / 1.13 = 460 CUP/USD
 */
export function saveExchangeTransaction(
  fromCurrency: TransactionCurrency,
  toCurrency: TransactionCurrency,
  amountFrom: number, // Amount of source currency given
  exchangeRate: number, // e.g., 1.13 EUR->USD means 1 EUR = 1.13 USD
  walletId?: string, // Target wallet ID
  note?: string, // Optional note for tracking
): Transaction {
  const txnId = generateId();
  const amountReceived = Math.round(amountFrom * exchangeRate * 100) / 100;

  let costBasis: number | undefined;
  let lotsConsumed: string[] | undefined;
  let derivedCostRate: number | undefined;

  // 1. Consume inventory from source currency (FIFO)
  const consumption = consumeInventoryLots(
    fromCurrency as Currency,
    amountFrom,
  );

  if (consumption) {
    costBasis = consumption.totalCost;
    lotsConsumed = consumption.lotsConsumed;

    // 2. Calculate derived cost rate for target currency
    // Formula: derivedCostRate = (total cost / amount given) / exchangeRate
    // Or simplified: costPerSourceUnit / exchangeRate
    const sourceCostRate = costBasis / amountFrom;
    derivedCostRate = Math.round(sourceCostRate / exchangeRate);

    // 3. Add to target currency inventory at derived cost rate
    addInventoryLot(
      toCurrency as Currency,
      amountReceived,
      derivedCostRate,
      txnId,
    );
  } else {
    // No inventory to consume - use average cost if available
    const avgCost = getAverageCost(fromCurrency as Currency);
    if (avgCost > 0) {
      costBasis = Math.round(amountFrom * avgCost);
      derivedCostRate = Math.round(avgCost / exchangeRate);

      // Add to target inventory at derived cost
      addInventoryLot(
        toCurrency as Currency,
        amountReceived,
        derivedCostRate,
        txnId,
      );
    }
  }

  const transaction: Transaction = {
    id: txnId,
    date: new Date().toISOString(),
    walletId: walletId ?? $activeWalletId.get() ?? undefined,
    operationType: "EXCHANGE",
    // For EXCHANGE, currency field stores the source currency
    currency: fromCurrency,
    amountForeign: Math.round(amountFrom * 100) / 100,
    rate: Math.round(exchangeRate * 10000) / 10000, // Store with precision
    totalCUP: costBasis ?? 0, // Total CUP cost basis of exchanged amount
    // EXCHANGE-specific fields
    fromCurrency,
    toCurrency,
    exchangeRate: Math.round(exchangeRate * 10000) / 10000,
    amountReceived,
    derivedCostRate,
    // FIFO tracking
    costBasis,
    lotsConsumed,
    // No CUP impact for exchanges (lateral movement)
    cupImpact: 0,
    note: note?.trim() || undefined,
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
  billCounts: Record<Denomination, number>,
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
