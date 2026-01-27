import { atom, computed } from "nanostores";
import type { Currency } from "../lib/constants";

// ============================================
// Inventory Store - FIFO Lot Tracking
// Tracks purchase lots for accurate profit calculation
// ============================================

import {
  $activeWalletId,
  $defaultWalletId,
  $wallets,
  CONSOLIDATED_ID,
} from "./walletStore";

const STORAGE_PREFIX = "fulean2_inventory_";
const LEGACY_STORAGE_KEY = "fulean2_inventory";

// Helper: Get storage key for a wallet
function getStorageKey(walletId: string): string {
  return `${STORAGE_PREFIX}${walletId}`;
}

// Load from localStorage with legacy migration support
function loadFromStorage(walletId: string | null): InventoryLot[] {
  if (typeof window === "undefined" || !walletId) return [];

  // Handle consolidated view
  if (walletId === CONSOLIDATED_ID) {
    const wallets = $wallets.get().filter((w) => !w.isArchived);
    const allLots: InventoryLot[] = [];

    for (const wallet of wallets) {
      const key = getStorageKey(wallet.id);
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            allLots.push(...parsed);
          }
        } catch {}
      }
    }
    // No specific sort needed as they are filtered by currency later,
    // but stable sort by date helps
    allLots.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    return allLots;
  }

  try {
    const key = getStorageKey(walletId);
    const stored = localStorage.getItem(key);

    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    }

    // MIGRATION: If specific data missing, check if this is the DEFAULT wallet and legacy data exists
    const defaultId = $defaultWalletId.get();
    if (walletId === defaultId) {
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        console.log("Migrating inventory to default wallet...");
        const parsed = JSON.parse(legacy);
        // Save to new key immediately
        if (Array.isArray(parsed)) {
          localStorage.setItem(key, legacy);
          return parsed;
        }
      }
    }

    return [];
  } catch {
    return [];
  }
}

// Save to localStorage
function saveToStorage(lots: InventoryLot[]): void {
  if (typeof window === "undefined") return;
  const walletId = $activeWalletId.get();

  if (!walletId || walletId === CONSOLIDATED_ID) return;

  try {
    const key = getStorageKey(walletId);
    localStorage.setItem(key, JSON.stringify(lots));
  } catch {
    // Ignore storage errors
  }
}

// Generate unique lot ID
function generateLotId(): string {
  return `lot_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ============================================
// State
// ============================================

// Initialize with current active wallet
export const $inventoryLots = atom<InventoryLot[]>([]);

// Subscribe to wallet changes to reload data
$activeWalletId.subscribe((id) => {
  if (id) {
    $inventoryLots.set(loadFromStorage(id));
  }
});

// Computed: Get lots for a specific currency (sorted oldest first - FIFO)
export function getLotsForCurrency(currency: Currency): InventoryLot[] {
  return $inventoryLots
    .get()
    .filter((lot) => lot.currency === currency && lot.remaining > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Computed: Total quantity available for a currency
export function getAvailableQuantity(currency: Currency): number {
  return getLotsForCurrency(currency).reduce(
    (sum, lot) => sum + lot.remaining,
    0,
  );
}

// Computed: Weighted average cost for a currency
export function getAverageCost(currency: Currency): number {
  const lots = getLotsForCurrency(currency);
  if (lots.length === 0) return 0;

  const totalCost = lots.reduce(
    (sum, lot) => sum + lot.remaining * lot.costRate,
    0,
  );
  const totalQuantity = lots.reduce((sum, lot) => sum + lot.remaining, 0);

  return totalQuantity > 0 ? Math.round(totalCost / totalQuantity) : 0;
}

// Computed: Inventory summary by currency
export const $inventorySummary = computed($inventoryLots, (lots) => {
  const summary: Record<
    string,
    { quantity: number; totalCost: number; avgCost: number }
  > = {};

  lots
    .filter((lot) => lot.remaining > 0)
    .forEach((lot) => {
      if (!summary[lot.currency]) {
        summary[lot.currency] = { quantity: 0, totalCost: 0, avgCost: 0 };
      }
      summary[lot.currency].quantity += lot.remaining;
      summary[lot.currency].totalCost += lot.remaining * lot.costRate;
    });

  // Calculate average cost for each currency
  Object.keys(summary).forEach((currency) => {
    const s = summary[currency];
    s.avgCost = s.quantity > 0 ? Math.round(s.totalCost / s.quantity) : 0;
  });

  return summary;
});

// ============================================
// Actions
// ============================================

function persist() {
  saveToStorage($inventoryLots.get());
}

/**
 * Add a new inventory lot (called on BUY)
 */
export function addInventoryLot(
  currency: Currency,
  quantity: number,
  costRate: number,
  transactionId?: string,
): InventoryLot {
  const lot: InventoryLot = {
    id: generateLotId(),
    currency,
    quantity: Math.round(quantity * 100) / 100, // 2 decimal precision
    remaining: Math.round(quantity * 100) / 100,
    costRate: Math.round(costRate),
    date: new Date().toISOString(),
    transactionId,
  };

  $inventoryLots.set([...$inventoryLots.get(), lot]);
  persist();

  return lot;
}

/**
 * Consume inventory lots using FIFO method (called on SELL)
 * Returns the cost basis and details of consumed lots
 */
export function consumeInventoryLots(
  currency: Currency,
  quantityToSell: number,
): ConsumptionResult | null {
  const lots = getLotsForCurrency(currency);
  const available = lots.reduce((sum, lot) => sum + lot.remaining, 0);

  // Check if we have enough inventory
  if (available < quantityToSell) {
    // Not enough inventory - this is a sale without prior purchase
    // Return null to indicate we can't track cost basis
    return null;
  }

  let remainingToConsume = quantityToSell;
  const consumedLots: ConsumptionResult["breakdown"] = [];
  const lotsConsumed: string[] = [];
  let totalCost = 0;

  // Update lots in place
  const updatedLots = $inventoryLots.get().map((lot) => {
    if (
      lot.currency !== currency ||
      lot.remaining <= 0 ||
      remainingToConsume <= 0
    ) {
      return lot;
    }

    const consumeFromThisLot = Math.min(lot.remaining, remainingToConsume);
    const costFromThisLot = consumeFromThisLot * lot.costRate;

    consumedLots.push({
      lotId: lot.id,
      quantity: consumeFromThisLot,
      costRate: lot.costRate,
      cost: costFromThisLot,
    });
    lotsConsumed.push(lot.id);
    totalCost += costFromThisLot;
    remainingToConsume -= consumeFromThisLot;

    return {
      ...lot,
      remaining: Math.round((lot.remaining - consumeFromThisLot) * 100) / 100,
    };
  });

  $inventoryLots.set(updatedLots);
  persist();

  return {
    totalCost: Math.round(totalCost),
    lotsConsumed,
    breakdown: consumedLots,
  };
}

/**
 * Simulate a FIFO sale without modifying inventory
 * Returns projected cost basis and profit info
 */
export function simulateFIFO(
  currency: Currency,
  quantityToSell: number,
): { totalCost: number; avgCost: number } | null {
  // Logic mirrors consumeInventoryLots but read-only
  const lots = getLotsForCurrency(currency);
  const available = lots.reduce((sum, lot) => sum + lot.remaining, 0);

  if (available < quantityToSell) return null;

  let remainingToConsume = quantityToSell;
  let totalCost = 0;

  for (const lot of lots) {
    if (remainingToConsume <= 0) break;

    const consume = Math.min(lot.remaining, remainingToConsume);
    totalCost += consume * lot.costRate;
    remainingToConsume -= consume;
  }

  return {
    totalCost: Math.round(totalCost),
    avgCost: quantityToSell > 0 ? Math.round(totalCost / quantityToSell) : 0,
  };
}

/**
 * Clear all inventory lots
 */
export function clearInventory() {
  $inventoryLots.set([]);
  persist();
}

/**
 * Remove empty lots (cleanup)
 */
export function cleanupEmptyLots() {
  const lots = $inventoryLots.get().filter((lot) => lot.remaining > 0);
  $inventoryLots.set(lots);
  persist();
}

// ============================================
// Rollback Functions (for transaction deletion)
// ============================================

/**
 * Get a lot by its ID
 */
export function getLotById(lotId: string): InventoryLot | undefined {
  return $inventoryLots.get().find((lot) => lot.id === lotId);
}

/**
 * Remove a lot by its transaction ID (for BUY rollback)
 * Returns true if the lot was found and removed
 */
export function removeLotByTransactionId(transactionId: string): boolean {
  const lots = $inventoryLots.get();
  const lotIndex = lots.findIndex((lot) => lot.transactionId === transactionId);

  if (lotIndex === -1) return false;

  const updatedLots = lots.filter((lot) => lot.transactionId !== transactionId);
  $inventoryLots.set(updatedLots);
  persist();
  return true;
}

/**
 * Restore consumed quantity to a lot (for SELL rollback)
 * Returns true if the lot was found and updated
 */
export function restoreLotQuantity(lotId: string, quantity: number): boolean {
  const lots = $inventoryLots.get();
  const lotIndex = lots.findIndex((lot) => lot.id === lotId);

  if (lotIndex === -1) return false;

  const lot = lots[lotIndex];
  const updatedLot: InventoryLot = {
    ...lot,
    remaining: Math.round((lot.remaining + quantity) * 100) / 100,
  };

  const updatedLots = [...lots];
  updatedLots[lotIndex] = updatedLot;
  $inventoryLots.set(updatedLots);
  persist();
  return true;
}

/**
 * Restore multiple lots from a consumption breakdown (for SELL/EXCHANGE rollback)
 * breakdown: array of { lotId, quantity } to restore
 */
export function restoreLotsFromBreakdown(
  breakdown: { lotId: string; quantity: number }[],
): void {
  if (breakdown.length === 0) return;

  const lots = $inventoryLots.get();
  const updatedLots = lots.map((lot) => {
    const restoration = breakdown.find((b) => b.lotId === lot.id);
    if (restoration) {
      return {
        ...lot,
        remaining:
          Math.round((lot.remaining + restoration.quantity) * 100) / 100,
      };
    }
    return lot;
  });

  $inventoryLots.set(updatedLots);
  persist();
}

// Subscribe to persist on changes
if (typeof window !== "undefined") {
  $inventoryLots.subscribe(persist);
}
