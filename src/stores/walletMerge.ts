import { $wallets, $activeWalletId, archiveWallet } from "./walletStore";
import { mergeCapital, getWalletBalance } from "./capitalStore";
import { transferInventoryLots } from "./inventoryStore";
import { transferExpenses } from "./expensesStore";
import { transferTransactions } from "./historyStore";

// ============================================
// Wallet Merge (Reunification)
// Orchestrates cross-wallet asset transfers
// Separated from walletStore to avoid circular dependencies
// ============================================

export interface MergeResult {
  cupTransferred: number;
  lotsTransferred: number;
  expensesTransferred: number;
  transactionsTransferred: number;
  sourceArchived: boolean;
}

/**
 * Get inventory summary from a wallet by reading localStorage directly.
 * Returns { currency: { quantity, totalCost } } map for preview UI.
 */
export function getWalletInventorySummary(
  walletId: string,
): Record<string, { quantity: number; totalCost: number }> {
  if (typeof window === "undefined") return {};

  try {
    const key = `fulean2_inventory_${walletId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return {};

    const lots = JSON.parse(raw);
    if (!Array.isArray(lots)) return {};

    const summary: Record<string, { quantity: number; totalCost: number }> = {};
    for (const lot of lots) {
      if (lot.remaining > 0) {
        if (!summary[lot.currency]) {
          summary[lot.currency] = { quantity: 0, totalCost: 0 };
        }
        summary[lot.currency].quantity += lot.remaining;
        summary[lot.currency].totalCost += lot.remaining * lot.costRate;
      }
    }
    return summary;
  } catch {
    return {};
  }
}

/**
 * Get total expenses for a wallet by reading localStorage directly.
 */
export function getWalletExpensesTotal(walletId: string): number {
  if (typeof window === "undefined") return 0;

  try {
    const key = `fulean2_expenses_${walletId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return 0;

    const expenses = JSON.parse(raw);
    if (!Array.isArray(expenses)) return 0;

    return expenses.reduce(
      (sum: number, e: { amount?: number }) => sum + (e.amount || 0),
      0,
    );
  } catch {
    return 0;
  }
}

/**
 * Get transaction count for a wallet by reading localStorage directly.
 */
export function getWalletTransactionCount(walletId: string): number {
  if (typeof window === "undefined") return 0;

  try {
    const key = `fulean2_transactions_${walletId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return 0;

    const transactions = JSON.parse(raw);
    return Array.isArray(transactions) ? transactions.length : 0;
  } catch {
    return 0;
  }
}

/**
 * Merge a source wallet into a target wallet.
 * Transfers all remaining assets (capital, inventory, expenses, transactions)
 * and archives the source.
 *
 * Key design decisions:
 * - Capital: merges initialCapital + movements (not fake IN/OUT) → preserves Variación Real
 * - Transactions: transferred with [fusionado] tag for traceability
 * - Inventory: FIFO lots preserve costRate for accurate profit calculation
 * - Source wallet is archived (not deleted) for historical reference
 */
export function mergeWallet(
  sourceWalletId: string,
  targetWalletId: string,
): MergeResult {
  const result: MergeResult = {
    cupTransferred: 0,
    lotsTransferred: 0,
    expensesTransferred: 0,
    transactionsTransferred: 0,
    sourceArchived: false,
  };

  // Validate wallets exist and are different
  const wallets = $wallets.get();
  const source = wallets.find((w) => w.id === sourceWalletId && !w.isArchived);
  const target = wallets.find((w) => w.id === targetWalletId && !w.isArchived);

  if (!source || !target || sourceWalletId === targetWalletId) {
    return result;
  }

  // 1. Merge capital (initialCapital + movements — preserves Variación Real)
  result.cupTransferred = mergeCapital(sourceWalletId, targetWalletId);

  // 2. Transfer inventory lots (preserves FIFO cost basis)
  result.lotsTransferred = transferInventoryLots(
    sourceWalletId,
    targetWalletId,
  );

  // 3. Transfer expenses
  result.expensesTransferred = transferExpenses(sourceWalletId, targetWalletId);

  // 4. Transfer transaction history (with source wallet name for traceability)
  result.transactionsTransferred = transferTransactions(
    sourceWalletId,
    targetWalletId,
    source.name,
  );

  // 5. Archive source wallet
  result.sourceArchived = archiveWallet(sourceWalletId);

  // 6. Switch to target wallet
  $activeWalletId.set(targetWalletId);

  return result;
}
