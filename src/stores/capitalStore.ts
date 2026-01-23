import { atom, computed } from "nanostores";
import {
  $activeWalletId,
  $defaultWalletId,
  CONSOLIDATED_ID,
} from "./walletStore";

// ============================================
// Capital Store (Per-Wallet)
// Track operating capital for each wallet
// ============================================

const STORAGE_KEY = "fulean2_capital";

// Capital movement record
export interface CapitalMovement {
  id: string;
  type: "IN" | "OUT"; // IN = received CUP, OUT = paid CUP
  amount: number;
  date: string;
  transactionId?: string; // Link to transaction
  walletId?: string; // Multi-wallet support
}

interface CapitalState {
  initialCapital: number; // Legacy: global capital (deprecated)
  movements: CapitalMovement[];
  // Per-wallet capital
  walletCapitals: Record<string, number>; // walletId -> initial capital
}

// Load from localStorage
function loadFromStorage(): CapitalState {
  if (typeof window === "undefined") {
    return { initialCapital: 0, movements: [], walletCapitals: {} };
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored)
      return { initialCapital: 0, movements: [], walletCapitals: {} };
    const parsed = JSON.parse(stored);
    return {
      initialCapital: parsed.initialCapital || 0,
      movements: Array.isArray(parsed.movements) ? parsed.movements : [],
      walletCapitals: parsed.walletCapitals || {},
    };
  } catch {
    return { initialCapital: 0, movements: [], walletCapitals: {} };
  }
}

// Save to localStorage
function saveToStorage(state: CapitalState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

// State atoms
const initialState = loadFromStorage();
export const $initialCapital = atom<number>(initialState.initialCapital);
export const $capitalMovements = atom<CapitalMovement[]>(
  initialState.movements,
);
export const $walletCapitals = atom<Record<string, number>>(
  initialState.walletCapitals,
);

// ============================================
// Per-Wallet Computed Stores
// ============================================

// Get movements filtered by active wallet
export const $walletCapitalMovements = computed(
  [$capitalMovements, $activeWalletId, $defaultWalletId],
  (movements, activeWalletId, defaultWalletId) => {
    // Consolidated view: return all movements
    if (!activeWalletId || activeWalletId === CONSOLIDATED_ID) {
      return movements;
    }
    // Filter by wallet
    return movements.filter((m) => {
      if (m.walletId) {
        return m.walletId === activeWalletId;
      } else {
        // Legacy movements only belong to default wallet
        return activeWalletId === defaultWalletId;
      }
    });
  },
);

// Get initial capital for active wallet
export const $walletInitialCapital = computed(
  [$walletCapitals, $initialCapital, $activeWalletId, $defaultWalletId],
  (walletCapitals, globalCapital, activeWalletId, defaultWalletId) => {
    // Consolidated view: sum all wallet capitals + legacy
    if (!activeWalletId || activeWalletId === CONSOLIDATED_ID) {
      const walletSum = Object.values(walletCapitals).reduce(
        (sum, c) => sum + c,
        0,
      );
      return walletSum + globalCapital;
    }
    // Specific wallet: use wallet capital or 0, legacy goes to default
    if (walletCapitals[activeWalletId] !== undefined) {
      return walletCapitals[activeWalletId];
    }
    // Default wallet inherits global/legacy capital
    if (activeWalletId === defaultWalletId) {
      return globalCapital;
    }
    return 0;
  },
);

// Computed: Total money out for active wallet
export const $totalOut = computed($walletCapitalMovements, (movements) => {
  return movements
    .filter((m) => m.type === "OUT")
    .reduce((sum, m) => sum + m.amount, 0);
});

// Computed: Total money in for active wallet
export const $totalIn = computed($walletCapitalMovements, (movements) => {
  return movements
    .filter((m) => m.type === "IN")
    .reduce((sum, m) => sum + m.amount, 0);
});

// Computed: Current balance for active wallet
export const $currentBalance = computed(
  [$walletInitialCapital, $totalIn, $totalOut],
  (initial, totalIn, totalOut) => {
    return initial + totalIn - totalOut;
  },
);

// Computed: Net change for active wallet
export const $netChange = computed(
  [$totalIn, $totalOut],
  (totalIn, totalOut) => {
    return totalIn - totalOut;
  },
);

// Computed: Percentage change for active wallet
export const $percentageChange = computed(
  [$walletInitialCapital, $netChange],
  (initial, netChange) => {
    if (initial === 0) return 0;
    return (netChange / initial) * 100;
  },
);

// ============================================
// Actions
// ============================================

function persist() {
  saveToStorage({
    initialCapital: $initialCapital.get(),
    movements: $capitalMovements.get(),
    walletCapitals: $walletCapitals.get(),
  });
}

/**
 * Set initial capital for a specific wallet
 */
export function setWalletInitialCapital(walletId: string, amount: number) {
  const validAmount = Math.max(0, Math.floor(amount));
  const current = $walletCapitals.get();
  $walletCapitals.set({ ...current, [walletId]: validAmount });
  persist();
}

/**
 * Set initial operating capital (legacy - uses active wallet)
 */
export function setInitialCapital(amount: number) {
  const walletId = $activeWalletId.get();
  const defaultId = $defaultWalletId.get();
  const validAmount = Math.max(0, Math.floor(amount));

  // If viewing consolidated or no wallet, set global
  if (!walletId || walletId === CONSOLIDATED_ID) {
    $initialCapital.set(validAmount);
  } else if (walletId === defaultId) {
    // Default wallet uses legacy global capital for backward compatibility
    $initialCapital.set(validAmount);
  } else {
    // Other wallets use per-wallet capital
    const current = $walletCapitals.get();
    $walletCapitals.set({ ...current, [walletId]: validAmount });
  }
  persist();
}

/**
 * Generate unique movement ID
 */
function generateId(): string {
  return `mov_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Record a capital movement from a transaction
 * @param type - IN (received CUP from sale) or OUT (paid CUP for purchase)
 * @param amount - CUP amount
 * @param transactionId - Optional link to transaction
 * @param walletId - Target wallet ID
 */
export function recordCapitalMovement(
  type: "IN" | "OUT",
  amount: number,
  transactionId?: string,
  walletId?: string,
) {
  const movement: CapitalMovement = {
    id: generateId(),
    type,
    amount: Math.abs(amount),
    date: new Date().toISOString(),
    transactionId,
    walletId: walletId ?? $activeWalletId.get() ?? undefined,
  };

  $capitalMovements.set([movement, ...$capitalMovements.get()]);
  persist();
}

/**
 * Clear capital movements for active wallet
 */
export function clearCapitalMovements() {
  const walletId = $activeWalletId.get();
  const defaultId = $defaultWalletId.get();

  if (!walletId || walletId === CONSOLIDATED_ID) {
    // Clear all
    $capitalMovements.set([]);
  } else {
    // Clear only for this wallet
    const movements = $capitalMovements.get();
    $capitalMovements.set(
      movements.filter((m) => {
        if (m.walletId) {
          return m.walletId !== walletId;
        } else {
          // Legacy movements belong to default wallet
          return walletId !== defaultId;
        }
      }),
    );
  }
  persist();
}

/**
 * Delete capital movement by transaction ID (for rollback)
 */
export function deleteCapitalMovementByTransactionId(
  transactionId: string,
): void {
  const movements = $capitalMovements.get();
  const filtered = movements.filter((m) => m.transactionId !== transactionId);
  $capitalMovements.set(filtered);
  persist();
}

/**
 * Reset capital for active wallet
 */
export function resetCapital() {
  const walletId = $activeWalletId.get();
  const defaultId = $defaultWalletId.get();

  if (!walletId || walletId === CONSOLIDATED_ID) {
    // Reset everything
    $initialCapital.set(0);
    $capitalMovements.set([]);
    $walletCapitals.set({});
  } else if (walletId === defaultId) {
    // Reset default wallet (legacy)
    $initialCapital.set(0);
    clearCapitalMovements();
  } else {
    // Reset specific wallet
    const current = $walletCapitals.get();
    const updated = { ...current };
    delete updated[walletId];
    $walletCapitals.set(updated);
    clearCapitalMovements();
  }
  persist();
}

// Subscribe and persist on changes
if (typeof window !== "undefined") {
  $initialCapital.subscribe(persist);
  $capitalMovements.subscribe(persist);
  $walletCapitals.subscribe(persist);
}
