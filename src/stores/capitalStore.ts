import { atom, computed } from "nanostores";

// ============================================
// Capital Store
// Track operating capital for cambista
// ============================================

const STORAGE_KEY = "fulean2_capital";

// Capital movement record
export interface CapitalMovement {
  id: string;
  type: "IN" | "OUT"; // IN = received CUP, OUT = paid CUP
  amount: number;
  date: string;
  transactionId?: string; // Link to transaction
}

interface CapitalState {
  initialCapital: number;
  movements: CapitalMovement[];
}

// Load from localStorage
function loadFromStorage(): CapitalState {
  if (typeof window === "undefined") {
    return { initialCapital: 0, movements: [] };
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { initialCapital: 0, movements: [] };
    const parsed = JSON.parse(stored);
    return {
      initialCapital: parsed.initialCapital || 0,
      movements: Array.isArray(parsed.movements) ? parsed.movements : [],
    };
  } catch {
    return { initialCapital: 0, movements: [] };
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
  initialState.movements
);

// Computed: Total money out (purchases)
export const $totalOut = computed($capitalMovements, (movements) => {
  return movements
    .filter((m) => m.type === "OUT")
    .reduce((sum, m) => sum + m.amount, 0);
});

// Computed: Total money in (sales)
export const $totalIn = computed($capitalMovements, (movements) => {
  return movements
    .filter((m) => m.type === "IN")
    .reduce((sum, m) => sum + m.amount, 0);
});

// Computed: Current balance
export const $currentBalance = computed(
  [$initialCapital, $totalIn, $totalOut],
  (initial, totalIn, totalOut) => {
    return initial + totalIn - totalOut;
  }
);

// Computed: Net change (profit/loss from operations)
export const $netChange = computed(
  [$totalIn, $totalOut],
  (totalIn, totalOut) => {
    return totalIn - totalOut;
  }
);

// Computed: Percentage change
export const $percentageChange = computed(
  [$initialCapital, $netChange],
  (initial, netChange) => {
    if (initial === 0) return 0;
    return (netChange / initial) * 100;
  }
);

// ============================================
// Actions
// ============================================

function persist() {
  saveToStorage({
    initialCapital: $initialCapital.get(),
    movements: $capitalMovements.get(),
  });
}

/**
 * Set initial operating capital
 */
export function setInitialCapital(amount: number) {
  const validAmount = Math.max(0, Math.floor(amount));
  $initialCapital.set(validAmount);
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
 */
export function recordCapitalMovement(
  type: "IN" | "OUT",
  amount: number,
  transactionId?: string
) {
  const movement: CapitalMovement = {
    id: generateId(),
    type,
    amount: Math.abs(amount),
    date: new Date().toISOString(),
    transactionId,
  };

  $capitalMovements.set([movement, ...$capitalMovements.get()]);
  persist();
}

/**
 * Clear all capital movements (reset)
 */
export function clearCapitalMovements() {
  $capitalMovements.set([]);
  persist();
}

/**
 * Reset everything
 */
export function resetCapital() {
  $initialCapital.set(0);
  $capitalMovements.set([]);
  persist();
}

// Subscribe and persist on changes
if (typeof window !== "undefined") {
  $initialCapital.subscribe(persist);
  $capitalMovements.subscribe(persist);
}
