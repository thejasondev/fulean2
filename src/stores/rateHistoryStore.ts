import { atom, computed } from "nanostores";
import type { Currency } from "../lib/constants";

// ============================================
// Rate History Store
// Tracks daily rate snapshots for trend analysis
// ============================================

const STORAGE_KEY = "fulean2_rate_history";
const MAX_DAYS = 30; // Keep last 30 days

export interface RateSnapshot {
  date: string; // YYYY-MM-DD format
  rates: Record<string, number>; // Currency -> rate
  timestamp: string; // Full ISO timestamp
}

// Load from localStorage
function loadFromStorage(): RateSnapshot[] {
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
function saveToStorage(history: RateSnapshot[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Ignore storage errors
  }
}

// State
export const $rateHistory = atom<RateSnapshot[]>(loadFromStorage());

// Get today's date in YYYY-MM-DD format
function getTodayString(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

/**
 * Record a rate snapshot for today
 * Only saves if we don't already have today's snapshot
 */
export function recordRateSnapshot(rates: Record<Currency, number>): void {
  const today = getTodayString();
  const current = $rateHistory.get();

  // Check if we already have today's snapshot
  const existingToday = current.find((s) => s.date === today);
  if (existingToday) {
    // Update today's snapshot with latest rates
    const updated = current.map((s) =>
      s.date === today
        ? { ...s, rates: { ...rates }, timestamp: new Date().toISOString() }
        : s
    );
    $rateHistory.set(updated);
    saveToStorage(updated);
    return;
  }

  // Add new snapshot
  const newSnapshot: RateSnapshot = {
    date: today,
    rates: { ...rates },
    timestamp: new Date().toISOString(),
  };

  // Keep only last MAX_DAYS entries
  const updated = [newSnapshot, ...current].slice(0, MAX_DAYS);
  $rateHistory.set(updated);
  saveToStorage(updated);
}

/**
 * Get rate history for a specific currency
 * Returns array of { date, rate } sorted oldest to newest
 */
export function getRateHistoryForCurrency(
  currency: Currency,
  days: number = 7
): { date: string; rate: number }[] {
  const history = $rateHistory.get();

  return history
    .slice(0, days)
    .filter((s) => s.rates[currency] !== undefined)
    .map((s) => ({
      date: s.date,
      rate: s.rates[currency],
    }))
    .reverse(); // Oldest first for charting
}

/**
 * Get trend info for a currency
 * Returns change from oldest to newest in the period
 */
export function getCurrencyTrend(
  currency: Currency,
  days: number = 7
): {
  startRate: number;
  endRate: number;
  change: number;
  changePercent: number;
  isUp: boolean;
} {
  const history = getRateHistoryForCurrency(currency, days);

  if (history.length < 2) {
    return {
      startRate: 0,
      endRate: 0,
      change: 0,
      changePercent: 0,
      isUp: true,
    };
  }

  const startRate = history[0].rate;
  const endRate = history[history.length - 1].rate;
  const change = endRate - startRate;
  const changePercent = startRate > 0 ? (change / startRate) * 100 : 0;

  return {
    startRate,
    endRate,
    change,
    changePercent,
    isUp: change >= 0,
  };
}

/**
 * Computed: Has enough history for trends
 */
export const $hasRateHistory = computed($rateHistory, (history) => {
  return history.length >= 2;
});

// Subscribe to persist
if (typeof window !== "undefined") {
  $rateHistory.subscribe((history) => {
    saveToStorage(history);
  });
}
