import { atom, computed } from "nanostores";
import type { Currency } from "../lib/constants";

// ============================================
// Inventory Store - FIFO Lot Tracking
// Tracks purchase lots for accurate profit calculation
// ============================================

const STORAGE_KEY = "fulean2_inventory";

// A lot represents a purchase of foreign currency
export interface InventoryLot {
  id: string;
  currency: Currency;
  quantity: number; // Original quantity purchased
  remaining: number; // Remaining quantity (decreases on sales)
  costRate: number; // Rate at which you bought (CUP per unit)
  date: string; // ISO date string
  transactionId?: string; // Link to purchase transaction
}

// Result of consuming lots (for a sale)
export interface ConsumptionResult {
  totalCost: number; // Total CUP cost basis of sold units
  lotsConsumed: string[]; // IDs of lots that were used
  breakdown: {
    // Detailed breakdown
    lotId: string;
    quantity: number;
    costRate: number;
    cost: number;
  }[];
}

// Load from localStorage
function loadFromStorage(): InventoryLot[] {
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
function saveToStorage(lots: InventoryLot[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lots));
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

export const $inventoryLots = atom<InventoryLot[]>(loadFromStorage());

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
    0
  );
}

// Computed: Weighted average cost for a currency
export function getAverageCost(currency: Currency): number {
  const lots = getLotsForCurrency(currency);
  if (lots.length === 0) return 0;

  const totalCost = lots.reduce(
    (sum, lot) => sum + lot.remaining * lot.costRate,
    0
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
  transactionId?: string
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
  quantityToSell: number
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

// Subscribe to persist on changes
if (typeof window !== "undefined") {
  $inventoryLots.subscribe(persist);
}
