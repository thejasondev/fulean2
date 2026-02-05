import { atom, computed } from "nanostores";
import { $activeWalletId, $wallets, CONSOLIDATED_ID } from "./walletStore";

// ============================================
// Expenses Store (Per-Wallet)
// Track operational expenses that reduce patrimony
// ============================================

const STORAGE_PREFIX = "fulean2_expenses_";

// Expense categories
export type ExpenseCategory = "transport" | "commission" | "food" | "other";

export const EXPENSE_CATEGORIES: Record<
  ExpenseCategory,
  { label: string; emoji: string }
> = {
  transport: { label: "Transporte", emoji: "🚗" },
  commission: { label: "Comisión", emoji: "💸" },
  food: { label: "Alimentación", emoji: "🍔" },
  other: { label: "Otro", emoji: "📦" },
};

// Expense record interface
export interface Expense {
  id: string;
  description: string;
  amount: number; // In CUP (always positive, will be subtracted)
  category: ExpenseCategory;
  date: string;
  walletId?: string;
}

// Load from localStorage
function loadFromStorage(walletId: string | null): Expense[] {
  if (typeof window === "undefined" || !walletId) return [];

  // Handle consolidated view - aggregate all wallets
  if (walletId === CONSOLIDATED_ID) {
    const wallets = $wallets.get().filter((w) => !w.isArchived);
    const allExpenses: Expense[] = [];

    for (const wallet of wallets) {
      const key = `${STORAGE_PREFIX}${wallet.id}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            allExpenses.push(...parsed);
          }
        } catch {}
      }
    }

    // Sort by date (newest first)
    allExpenses.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    return allExpenses;
  }

  try {
    const key = `${STORAGE_PREFIX}${walletId}`;
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

// Save to localStorage
function saveToStorage(expenses: readonly Expense[]): void {
  if (typeof window === "undefined") return;
  if (isLoadingWallet) return;

  const walletId = $activeWalletId.get();
  if (!walletId || walletId === CONSOLIDATED_ID) return;

  try {
    const key = `${STORAGE_PREFIX}${walletId}`;
    localStorage.setItem(key, JSON.stringify(expenses));
  } catch {}
}

// Flag to prevent race condition during wallet switching
let isLoadingWallet = false;

// ============================================
// State Atoms
// ============================================

export const $expenses = atom<Expense[]>([]);

// Subscribe to wallet changes to reload data
$activeWalletId.subscribe((id) => {
  if (id) {
    isLoadingWallet = true;
    $expenses.set(loadFromStorage(id));
    isLoadingWallet = false;
  }
});

// Subscribe to persist on changes
if (typeof window !== "undefined") {
  $expenses.subscribe(saveToStorage);
}

// ============================================
// Computed Stores
// ============================================

// Total expenses for active wallet
export const $totalExpenses = computed($expenses, (expenses) =>
  expenses.reduce((sum, e) => sum + e.amount, 0),
);

// Expenses grouped by category
export const $expensesByCategory = computed($expenses, (expenses) => {
  const grouped: Record<ExpenseCategory, number> = {
    transport: 0,
    commission: 0,
    food: 0,
    other: 0,
  };

  for (const expense of expenses) {
    grouped[expense.category] += expense.amount;
  }

  return grouped;
});

// ============================================
// Actions
// ============================================

/**
 * Generate unique expense ID
 */
function generateId(): string {
  return `exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Add a new expense
 */
export function addExpense(
  description: string,
  amount: number,
  category: ExpenseCategory = "other",
): Expense | null {
  const walletId = $activeWalletId.get();
  if (!walletId || walletId === CONSOLIDATED_ID) return null;

  const trimmedDesc = description.trim();
  if (!trimmedDesc || amount <= 0) return null;

  const expense: Expense = {
    id: generateId(),
    description: trimmedDesc,
    amount: Math.round(amount),
    category,
    date: new Date().toISOString(),
    walletId,
  };

  $expenses.set([expense, ...$expenses.get()]);
  return expense;
}

/**
 * Delete an expense by ID
 */
export function deleteExpense(id: string): void {
  const expenses = $expenses.get();
  $expenses.set(expenses.filter((e) => e.id !== id));
}

/**
 * Clear all expenses for active wallet
 */
export function clearExpenses(): void {
  const walletId = $activeWalletId.get();
  if (!walletId || walletId === CONSOLIDATED_ID) return;

  $expenses.set([]);
}
