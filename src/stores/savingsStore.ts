import { atom, computed } from "nanostores";
import { $activeWalletId, $wallets, CONSOLIDATED_ID } from "./walletStore";
import {
  consumeInventoryLots,
  addInventoryLot,
  getAvailableQuantity,
  restoreLotsFromBreakdown,
} from "./inventoryStore";
import type { Currency } from "../lib/constants";

// ============================================
// Savings Store (Per-Wallet)
// Track hard currency savings sourced FROM inventory (portfolio)
// Flow: Buy → Inventory → Save → Savings (separate from business)
// ============================================

const STORAGE_PREFIX = "fulean2_savings_";

// Savings entry interface
export interface SavingsEntry {
  id: string;
  date: string;
  currency: Currency;
  amount: number; // Amount of foreign currency saved
  costRate: number; // CUP cost per unit from FIFO lots at save time
  totalCUP: number; // Total CUP cost basis (amount × costRate)
  note?: string;
  walletId?: string;
  consumptionBreakdown?: {
    lotId: string;
    quantity: number;
    costRate: number;
  }[];
}

// ============================================
// Storage Helpers
// ============================================

function getStorageKey(walletId: string): string {
  return `${STORAGE_PREFIX}${walletId}`;
}

function loadFromStorage(walletId: string | null): SavingsEntry[] {
  if (typeof window === "undefined" || !walletId) return [];

  if (walletId === CONSOLIDATED_ID) {
    const wallets = $wallets.get().filter((w) => !w.isArchived);
    const all: SavingsEntry[] = [];
    for (const wallet of wallets) {
      const key = getStorageKey(wallet.id);
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) all.push(...parsed);
        } catch {}
      }
    }
    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return all;
  }

  try {
    const key = getStorageKey(walletId);
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    }
    return [];
  } catch {
    return [];
  }
}

function saveToStorage(entries: readonly SavingsEntry[]): void {
  if (typeof window === "undefined") return;
  if (isLoadingWallet) return;

  const walletId = $activeWalletId.get();
  if (!walletId || walletId === CONSOLIDATED_ID) return;

  try {
    localStorage.setItem(getStorageKey(walletId), JSON.stringify(entries));
  } catch {}
}

// ============================================
// State
// ============================================

let isLoadingWallet = false;

export const $savings = atom<SavingsEntry[]>([]);

$activeWalletId.subscribe((id) => {
  if (id) {
    isLoadingWallet = true;
    $savings.set(loadFromStorage(id));
    isLoadingWallet = false;
  }
});

if (typeof window !== "undefined") {
  $savings.subscribe(saveToStorage);
}

// ============================================
// Computed
// ============================================

/** Total savings per currency: { USD: 150, EUR: 200, ... } */
export const $savingsPerCurrency = computed($savings, (entries) => {
  const totals: Partial<Record<Currency, number>> = {};
  for (const e of entries) {
    totals[e.currency] = (totals[e.currency] || 0) + e.amount;
  }
  return totals;
});

/** Total CUP cost basis invested in savings */
export const $savingsTotalCUP = computed($savings, (entries) =>
  entries.reduce((sum, e) => sum + e.totalCUP, 0),
);

// ============================================
// Actions
// ============================================

function generateId(): string {
  return `sav_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Save currency from inventory (portfolio) to savings.
 * Consumes inventory lots via FIFO (removes from portfolio).
 * Cost rate is user-defined — the actual CUP price paid,
 * not the FIFO average, since currencies can be bought
 * at varying rates from different clients.
 *
 * Returns the entry or null if insufficient inventory.
 */
export function addSaving(
  currency: Currency,
  amount: number,
  manualCostRate: number,
  note?: string,
): SavingsEntry | null {
  if (amount <= 0 || manualCostRate <= 0) return null;

  const walletId = $activeWalletId.get();
  if (!walletId || walletId === CONSOLIDATED_ID) return null;

  // Check availability
  const available = getAvailableQuantity(currency);
  if (available < amount) return null;

  // Consume from inventory via FIFO (removes quantity from portfolio)
  const consumed = consumeInventoryLots(currency, amount);
  if (!consumed) return null;

  // Use the user's manual cost rate, not FIFO-derived
  const totalCUP = Math.round(amount * manualCostRate);

  const entry: SavingsEntry = {
    id: generateId(),
    date: new Date().toISOString(),
    currency,
    amount,
    costRate: Math.round(manualCostRate),
    totalCUP,
    note,
    walletId,
    consumptionBreakdown: consumed.breakdown,
  };

  $savings.set([entry, ...$savings.get()]);
  return entry;
}

/**
 * Withdraw (partial or full) from a savings entry back to inventory.
 * Returns the withdrawn currency to inventory as a new lot
 * at the original cost rate (preserving FIFO integrity).
 *
 * @param savingId - ID of the savings entry
 * @param withdrawAmount - Amount to withdraw (if omitted or >= entry.amount, full withdrawal)
 * @returns { amountReturned, costRate } or null
 */
export function withdrawSaving(
  savingId: string,
  withdrawAmount?: number,
): { amountReturned: number; costRate: number; currency: Currency } | null {
  const entries = $savings.get();
  const entry = entries.find((e) => e.id === savingId);
  if (!entry) return null;

  // Determine actual withdrawal amount
  const actualAmount =
    withdrawAmount && withdrawAmount > 0
      ? Math.min(withdrawAmount, entry.amount)
      : entry.amount;

  const isFullWithdrawal = actualAmount >= entry.amount;

  if (isFullWithdrawal) {
    // Remove entire entry
    $savings.set(entries.filter((e) => e.id !== savingId));
  } else {
    // Partial withdrawal — reduce entry amount proportionally
    const ratio = actualAmount / entry.amount;
    const cupReduced = Math.round(entry.totalCUP * ratio);
    $savings.set(
      entries.map((e) =>
        e.id === savingId
          ? {
              ...e,
              amount: Math.round((e.amount - actualAmount) * 100) / 100,
              totalCUP: e.totalCUP - cupReduced,
            }
          : e,
      ),
    );
  }

  // Return to inventory as a new lot at the original cost rate
  addInventoryLot(
    entry.currency,
    actualAmount,
    entry.costRate,
    `withdraw_${savingId}`,
  );

  return {
    amountReturned: actualAmount,
    costRate: entry.costRate,
    currency: entry.currency,
  };
}

/**
 * Delete a savings entry and return the money to inventory (for corrections).
 * This is a data correction — the inventory is restored exactly as it was consumed.
 */
export function deleteSaving(savingId: string): void {
  const entries = $savings.get();
  const entry = entries.find((e) => e.id === savingId);
  if (!entry) return;

  // Restore the consumed inventory lots
  if (entry.consumptionBreakdown && entry.consumptionBreakdown.length > 0) {
    restoreLotsFromBreakdown(entry.consumptionBreakdown);
  } else {
    // Fallback for older entries without breakdown
    addInventoryLot(
      entry.currency,
      entry.amount,
      entry.costRate,
      `delete_fallback_${savingId}`,
    );
  }

  $savings.set(entries.filter((e) => e.id !== savingId));
}

/**
 * Clear all savings for the active wallet.
 */
export function clearSavings(): void {
  const walletId = $activeWalletId.get();
  if (!walletId || walletId === CONSOLIDATED_ID) return;
  $savings.set([]);
}

/**
 * Transfer savings from one wallet to another (for merge).
 */
export function transferSavings(
  fromWalletId: string,
  toWalletId: string,
): number {
  if (typeof window === "undefined") return 0;
  if (fromWalletId === toWalletId) return 0;

  try {
    const fromKey = getStorageKey(fromWalletId);
    const fromRaw = localStorage.getItem(fromKey);
    const fromEntries: SavingsEntry[] = fromRaw ? JSON.parse(fromRaw) : [];

    if (fromEntries.length === 0) return 0;

    const transferred = fromEntries.map((e) => ({
      ...e,
      id: generateId(),
      walletId: toWalletId,
    }));

    const toKey = getStorageKey(toWalletId);
    const toRaw = localStorage.getItem(toKey);
    const toEntries: SavingsEntry[] = toRaw ? JSON.parse(toRaw) : [];

    const merged = [...transferred, ...toEntries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    localStorage.setItem(toKey, JSON.stringify(merged));
    localStorage.setItem(fromKey, JSON.stringify([]));

    const activeId = $activeWalletId.get();
    if (activeId === toWalletId) {
      isLoadingWallet = true;
      $savings.set(merged);
      isLoadingWallet = false;
    }

    return transferred.length;
  } catch (e) {
    console.error("Failed to transfer savings:", e);
    return 0;
  }
}
