import { atom, computed } from "nanostores";
import {
  $activeWalletId,
  $defaultWalletId,
  $wallets,
  CONSOLIDATED_ID,
} from "./walletStore";

// ============================================
// Capital Store (Per-Wallet)
// Track operating capital for each wallet
// ============================================

const STORAGE_PREFIX = "fulean2_capital_";
const LEGACY_STORAGE_KEY = "fulean2_capital";

// Capital movement record
export interface CapitalMovement {
  id: string;
  type: "IN" | "OUT"; // IN = received CUP, OUT = paid CUP
  amount: number;
  date: string;
  transactionId?: string; // Link to transaction
  walletId?: string; // Multi-wallet support (kept for data shape compatibility)
}

interface CapitalState {
  initialCapital: number;
  movements: CapitalMovement[];
  walletCapitals: Record<string, number>; // Legacy map, kept for type compatibility but unused in new logic
}

// Load from localStorage
function loadFromStorage(walletId: string | null): CapitalState {
  // Default empty state
  const empty: CapitalState = {
    initialCapital: 0,
    movements: [],
    walletCapitals: {},
  };

  if (typeof window === "undefined" || !walletId) return empty;

  if (walletId === CONSOLIDATED_ID) {
    const wallets = $wallets.get().filter((w) => !w.isArchived);
    let totalInitial = 0;
    const allMovements: CapitalMovement[] = [];

    for (const wallet of wallets) {
      const key = `${STORAGE_PREFIX}${wallet.id}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          totalInitial += parsed.initialCapital || 0;
          if (Array.isArray(parsed.movements)) {
            allMovements.push(...parsed.movements);
          }
        } catch {}
      }
    }

    // Sort combined movements by date (newest first)
    allMovements.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return {
      initialCapital: totalInitial,
      movements: allMovements,
      walletCapitals: {},
    };
  }

  try {
    const key = `${STORAGE_PREFIX}${walletId}`;
    const stored = localStorage.getItem(key);

    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        initialCapital: parsed.initialCapital ?? 0,
        movements: Array.isArray(parsed.movements) ? parsed.movements : [],
        walletCapitals: {},
      };
    }

    // MIGRATION: Smart Split from Legacy Monolithic Store
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      console.log(`Migrating capital data for wallet ${walletId}...`);
      try {
        const parsed = JSON.parse(legacy);
        const legacyMovements = Array.isArray(parsed.movements)
          ? (parsed.movements as CapitalMovement[])
          : [];
        const legacyCapitals = parsed.walletCapitals || {};
        const globalCapital = parsed.initialCapital || 0;
        const defaultId = $defaultWalletId.get();

        // 1. Determine Initial Capital for THIS wallet
        let myInitialCapital = 0;
        if (legacyCapitals[walletId] !== undefined) {
          myInitialCapital = legacyCapitals[walletId];
        } else if (walletId === defaultId) {
          myInitialCapital = globalCapital;
        }

        // 2. Filter movements for THIS wallet
        // If movement has no walletId, it belongs to default wallet
        const myMovements = legacyMovements.filter((m) => {
          const mWalletId = m.walletId;
          if (mWalletId) return mWalletId === walletId;
          // Legacy movement allocation
          return walletId === defaultId;
        });

        // 3. Save migrated data for this wallet immediately
        const newState = {
          initialCapital: myInitialCapital,
          movements: myMovements,
          walletCapitals: {},
        };
        localStorage.setItem(key, JSON.stringify(newState));

        return newState;
      } catch (e) {
        console.error("Capital migration failed", e);
      }
    }

    return empty;
  } catch {
    return empty;
  }
}

// Save to localStorage
function saveToStorage(state: CapitalState): void {
  if (typeof window === "undefined") return;
  if (isLoadingWallet) return; // Prevent saving during wallet switch

  const walletId = $activeWalletId.get();
  if (!walletId || walletId === CONSOLIDATED_ID) return;

  try {
    const key = `${STORAGE_PREFIX}${walletId}`;
    // We only save relevant fields, ignoring walletCapitals map
    const dataToSave = {
      initialCapital: state.initialCapital,
      movements: state.movements,
      walletCapitals: {}, // We don't use this anymore
    };
    localStorage.setItem(key, JSON.stringify(dataToSave));
  } catch {}
}

// Flag to prevent race condition during wallet switching
let isLoadingWallet = false;

// ============================================
// State Atoms (representing ACTIVE wallet)
// ============================================

// Initialize with empty, will be populated by subscription
export const $initialCapital = atom<number>(0);
export const $capitalMovements = atom<CapitalMovement[]>([]);
export const $walletCapitals = atom<Record<string, number>>({}); // Kept for interface compatibility, mostly empty

// Helper computed to aggregate state for saving
const $currentState = computed(
  [$initialCapital, $capitalMovements],
  (initial, movements) => ({
    initialCapital: initial,
    movements,
    walletCapitals: {},
  }),
);

// Subscribe to wallet changes to reload data
$activeWalletId.subscribe((id) => {
  if (id) {
    isLoadingWallet = true;
    const data = loadFromStorage(id);
    $initialCapital.set(data.initialCapital);
    $capitalMovements.set(data.movements);
    isLoadingWallet = false;
    // We don't populate $walletCapitals map as logically it's not needed per wallet
  }
});

// Subscribe to persist on changes
if (typeof window !== "undefined") {
  $currentState.subscribe(saveToStorage);
}

// ============================================
// Per-Wallet Computed Stores
// ============================================

// Return movements for active wallet (Identity)
export const $walletCapitalMovements = computed(
  $capitalMovements,
  (movements) => movements,
);

// Return initial capital for active wallet (Identity)
export const $walletInitialCapital = computed(
  $initialCapital,
  (capital) => capital,
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

/**
 * Set initial capital for a specific wallet
 * Note: In isolated architecture, we can only easily set capital for the ACTIVE wallet.
 * Attempting to set for another wallet will warn or no-op unless loaded.
 */
export function setWalletInitialCapital(walletId: string, amount: number) {
  const activeId = $activeWalletId.get();
  if (walletId === activeId) {
    setInitialCapital(amount);
  } else {
    console.warn(
      "Cannot set capital for inactive wallet in isolated mode without switching.",
    );
  }
}

/**
 * Set initial operating capital for ACTIVE wallet
 */
export function setInitialCapital(amount: number) {
  const walletId = $activeWalletId.get();
  if (!walletId || walletId === CONSOLIDATED_ID) return;

  const validAmount = Math.max(0, Math.floor(amount));
  $initialCapital.set(validAmount);
  // Persist handled by subscription
}

/**
 * Generate unique movement ID
 */
function generateId(): string {
  return `mov_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Record a capital movement from a transaction
 */
export function recordCapitalMovement(
  type: "IN" | "OUT",
  amount: number,
  transactionId?: string,
  walletId?: string,
) {
  const activeId = $activeWalletId.get();

  // Guard: If trying to record for another wallet, we ignore it in this store instance
  // (Transactions should typically trigger this for relevant wallet)
  if (walletId && walletId !== activeId) {
    console.warn("Ignoring capital movement for inactive wallet", walletId);
    return;
  }

  const movement: CapitalMovement = {
    id: generateId(),
    type,
    amount: Math.abs(amount),
    date: new Date().toISOString(),
    transactionId,
    walletId: activeId ?? undefined,
  };

  $capitalMovements.set([movement, ...$capitalMovements.get()]);
}

/**
 * Clear capital movements for active wallet
 */
export function clearCapitalMovements() {
  const walletId = $activeWalletId.get();
  if (!walletId || walletId === CONSOLIDATED_ID) return;

  $capitalMovements.set([]);
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
}

/**
 * Reset capital for active wallet
 */
export function resetCapital() {
  const walletId = $activeWalletId.get();
  if (!walletId || walletId === CONSOLIDATED_ID) return;

  $initialCapital.set(0);
  $capitalMovements.set([]);
}

/**
 * Transfer capital (CUP) from one wallet to another.
 * Creates IN/OUT movements for ad-hoc transfers between wallets during operations.
 */
export function transferCapital(
  fromWalletId: string,
  toWalletId: string,
  amount: number,
): boolean {
  if (typeof window === "undefined") return false;
  if (amount <= 0 || fromWalletId === toWalletId) return false;

  const transferId = `transfer_${Date.now()}`;
  const now = new Date().toISOString();

  const outMovement: CapitalMovement = {
    id: `${transferId}_out`,
    type: "OUT",
    amount: Math.abs(amount),
    date: now,
    walletId: fromWalletId,
  };

  const inMovement: CapitalMovement = {
    id: `${transferId}_in`,
    type: "IN",
    amount: Math.abs(amount),
    date: now,
    walletId: toWalletId,
  };

  try {
    const fromKey = `${STORAGE_PREFIX}${fromWalletId}`;
    const fromRaw = localStorage.getItem(fromKey);
    const fromData = fromRaw
      ? JSON.parse(fromRaw)
      : { initialCapital: 0, movements: [], walletCapitals: {} };

    fromData.movements = [outMovement, ...(fromData.movements || [])];
    localStorage.setItem(fromKey, JSON.stringify(fromData));

    const toKey = `${STORAGE_PREFIX}${toWalletId}`;
    const toRaw = localStorage.getItem(toKey);
    const toData = toRaw
      ? JSON.parse(toRaw)
      : { initialCapital: 0, movements: [], walletCapitals: {} };

    toData.movements = [inMovement, ...(toData.movements || [])];
    localStorage.setItem(toKey, JSON.stringify(toData));

    const activeId = $activeWalletId.get();
    if (activeId === fromWalletId || activeId === toWalletId) {
      const reloaded = loadFromStorage(activeId);
      isLoadingWallet = true;
      $initialCapital.set(reloaded.initialCapital);
      $capitalMovements.set(reloaded.movements);
      isLoadingWallet = false;
    }

    return true;
  } catch (e) {
    console.error("Failed to transfer capital:", e);
    return false;
  }
}

/**
 * Merge all capital data from source wallet into target wallet.
 * Unlike transferCapital (which creates IN/OUT movements), this function
 * merges the initialCapital and all movements, preserving correct
 * Variación Real calculations.
 *
 * Formula preserved: netPatrimony = (initialCapital + totalIn - totalOut) + inventory - expenses
 * realNetChange = netPatrimony - initialCapital → only real gains/losses
 */
export function mergeCapital(fromWalletId: string, toWalletId: string): number {
  if (typeof window === "undefined") return 0;
  if (fromWalletId === toWalletId) return 0;

  try {
    // Read source capital data
    const fromKey = `${STORAGE_PREFIX}${fromWalletId}`;
    const fromRaw = localStorage.getItem(fromKey);
    const fromData = fromRaw
      ? JSON.parse(fromRaw)
      : { initialCapital: 0, movements: [], walletCapitals: {} };

    const sourceInitial = fromData.initialCapital || 0;
    const sourceMovements: CapitalMovement[] = fromData.movements || [];

    // Read target capital data
    const toKey = `${STORAGE_PREFIX}${toWalletId}`;
    const toRaw = localStorage.getItem(toKey);
    const toData = toRaw
      ? JSON.parse(toRaw)
      : { initialCapital: 0, movements: [], walletCapitals: {} };

    // Merge: add source initialCapital to target's initialCapital
    toData.initialCapital = (toData.initialCapital || 0) + sourceInitial;

    // Merge: combine all movements and sort by date (newest first)
    const allMovements: CapitalMovement[] = [
      ...(toData.movements || []),
      ...sourceMovements,
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    toData.movements = allMovements;

    // Save target
    localStorage.setItem(toKey, JSON.stringify(toData));

    // Calculate how much CUP the source had
    let sourceBalance = sourceInitial;
    for (const m of sourceMovements) {
      sourceBalance += m.type === "IN" ? m.amount : -m.amount;
    }

    // Reload in-memory state if target is active
    const activeId = $activeWalletId.get();
    if (activeId === toWalletId) {
      const reloaded = loadFromStorage(activeId);
      isLoadingWallet = true;
      $initialCapital.set(reloaded.initialCapital);
      $capitalMovements.set(reloaded.movements);
      isLoadingWallet = false;
    }

    return sourceBalance;
  } catch (e) {
    console.error("Failed to merge capital:", e);
    return 0;
  }
}

/**
 * Get the net CUP balance for a specific wallet by reading localStorage directly.
 */
export function getWalletBalance(walletId: string): number {
  if (typeof window === "undefined") return 0;

  try {
    const key = `${STORAGE_PREFIX}${walletId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return 0;

    const data = JSON.parse(raw);
    const initial = data.initialCapital || 0;
    const movements: CapitalMovement[] = data.movements || [];

    let balance = initial;
    for (const m of movements) {
      balance += m.type === "IN" ? m.amount : -m.amount;
    }
    return balance;
  } catch {
    return 0;
  }
}
