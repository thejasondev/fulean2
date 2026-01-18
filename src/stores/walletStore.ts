import { atom, computed } from "nanostores";

// ============================================
// Wallet Store - Multi-Capital Management
// ============================================

const WALLETS_KEY = "fulean2_wallets";
const ACTIVE_WALLET_KEY = "fulean2_active_wallet";
const MAX_WALLETS = 5;

// Wallet colors for visual distinction
export const WALLET_COLORS = [
  { name: "cyan", value: "#06b6d4" },
  { name: "purple", value: "#a855f7" },
  { name: "orange", value: "#f97316" },
  { name: "pink", value: "#ec4899" },
  { name: "lime", value: "#84cc16" },
] as const;

export type WalletColor = (typeof WALLET_COLORS)[number]["name"];

export interface Wallet {
  id: string;
  name: string;
  color: WalletColor;
  createdAt: string;
  isArchived: boolean;
}

// Special ID for consolidated view
export const CONSOLIDATED_ID = "__ALL__";

// ============================================
// Storage Functions
// ============================================

function loadWallets(): Wallet[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(WALLETS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveWallets(wallets: Wallet[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WALLETS_KEY, JSON.stringify(wallets));
  } catch {
    // Ignore storage errors
  }
}

function loadActiveWalletId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ACTIVE_WALLET_KEY);
  } catch {
    return null;
  }
}

function saveActiveWalletId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACTIVE_WALLET_KEY, id);
  } catch {
    // Ignore storage errors
  }
}

function generateWalletId(): string {
  return `wallet_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ============================================
// State
// ============================================

export const $wallets = atom<Wallet[]>(loadWallets());
export const $activeWalletId = atom<string | null>(loadActiveWalletId());

// Computed: Active wallet object
export const $activeWallet = computed(
  [$wallets, $activeWalletId],
  (wallets, activeId) => {
    if (!activeId || activeId === CONSOLIDATED_ID) return null;
    return wallets.find((w) => w.id === activeId && !w.isArchived) ?? null;
  },
);

// Computed: Active (non-archived) wallets
export const $activeWallets = computed($wallets, (wallets) =>
  wallets.filter((w) => !w.isArchived),
);

// Computed: Default wallet ID (first/oldest wallet - inherits legacy transactions)
export const $defaultWalletId = computed($wallets, (wallets) => {
  const active = wallets.filter((w) => !w.isArchived);
  if (active.length === 0) return null;
  // Sort by createdAt and return the oldest
  const sorted = [...active].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  return sorted[0]?.id ?? null;
});

// Computed: Is viewing consolidated?
export const $isConsolidatedView = computed(
  $activeWalletId,
  (id) => id === CONSOLIDATED_ID,
);

// Computed: Can create more wallets?
export const $canCreateWallet = computed(
  $activeWallets,
  (wallets) => wallets.length < MAX_WALLETS,
);

// Persist on changes
if (typeof window !== "undefined") {
  $wallets.subscribe(saveWallets);
  $activeWalletId.subscribe((id) => {
    if (id) saveActiveWalletId(id);
  });
}

// ============================================
// Actions
// ============================================

/**
 * Initialize wallet system - creates default wallet if none exist
 * Should be called on app startup
 */
export function initializeWallets(): void {
  const wallets = $wallets.get();
  const activeId = $activeWalletId.get();

  // If no wallets exist, create "Principal"
  if (wallets.length === 0) {
    const defaultWallet: Wallet = {
      id: generateWalletId(),
      name: "Principal",
      color: "cyan",
      createdAt: new Date().toISOString(),
      isArchived: false,
    };
    $wallets.set([defaultWallet]);
    $activeWalletId.set(defaultWallet.id);
    return;
  }

  // If active wallet doesn't exist, set first active one
  const activeWallets = wallets.filter((w) => !w.isArchived);
  if (
    !activeId ||
    (!wallets.find((w) => w.id === activeId) && activeId !== CONSOLIDATED_ID)
  ) {
    if (activeWallets.length > 0) {
      $activeWalletId.set(activeWallets[0].id);
    }
  }
}

/**
 * Create a new wallet
 */
export function createWallet(
  name: string,
  color: WalletColor = "cyan",
): Wallet | null {
  const wallets = $wallets.get();
  const activeWallets = wallets.filter((w) => !w.isArchived);

  if (activeWallets.length >= MAX_WALLETS) {
    return null; // Limit reached
  }

  const newWallet: Wallet = {
    id: generateWalletId(),
    name: name.trim() || "Nueva Cartera",
    color,
    createdAt: new Date().toISOString(),
    isArchived: false,
  };

  $wallets.set([...wallets, newWallet]);
  return newWallet;
}

/**
 * Switch active wallet
 */
export function switchWallet(id: string): void {
  const wallets = $wallets.get();

  // Allow switching to consolidated view
  if (id === CONSOLIDATED_ID) {
    $activeWalletId.set(CONSOLIDATED_ID);
    return;
  }

  const wallet = wallets.find((w) => w.id === id && !w.isArchived);
  if (wallet) {
    $activeWalletId.set(id);
  }
}

/**
 * Rename a wallet
 */
export function renameWallet(id: string, newName: string): void {
  const wallets = $wallets.get();
  $wallets.set(
    wallets.map((w) =>
      w.id === id ? { ...w, name: newName.trim() || w.name } : w,
    ),
  );
}

/**
 * Change wallet color
 */
export function changeWalletColor(id: string, color: WalletColor): void {
  const wallets = $wallets.get();
  $wallets.set(wallets.map((w) => (w.id === id ? { ...w, color } : w)));
}

/**
 * Archive a wallet (soft delete)
 */
export function archiveWallet(id: string): boolean {
  const wallets = $wallets.get();
  const activeWallets = wallets.filter((w) => !w.isArchived);

  // Don't archive if it's the last wallet
  if (activeWallets.length <= 1) {
    return false;
  }

  $wallets.set(
    wallets.map((w) => (w.id === id ? { ...w, isArchived: true } : w)),
  );

  // Switch to another wallet if we archived the active one
  if ($activeWalletId.get() === id) {
    const remaining = wallets.filter((w) => w.id !== id && !w.isArchived);
    if (remaining.length > 0) {
      $activeWalletId.set(remaining[0].id);
    }
  }

  return true;
}

/**
 * Permanently delete a wallet and its data
 */
export function deleteWallet(id: string): boolean {
  const wallets = $wallets.get();
  const activeWallets = wallets.filter((w) => !w.isArchived);

  // Don't delete if it's the last active wallet
  if (activeWallets.length <= 1 && activeWallets[0]?.id === id) {
    return false;
  }

  // Remove wallet
  $wallets.set(wallets.filter((w) => w.id !== id));

  // Clean up wallet-specific data
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(`fulean2_transactions_${id}`);
      localStorage.removeItem(`fulean2_inventory_${id}`);
    } catch {
      // Ignore
    }
  }

  // Switch if deleted was active
  if ($activeWalletId.get() === id) {
    const remaining = $wallets.get().filter((w) => !w.isArchived);
    if (remaining.length > 0) {
      $activeWalletId.set(remaining[0].id);
    }
  }

  return true;
}

/**
 * Save current wallet and create a new one
 */
export function saveAndCreateNew(
  newWalletName: string,
  newColor: WalletColor = "purple",
): Wallet | null {
  const newWallet = createWallet(newWalletName, newColor);
  if (newWallet) {
    $activeWalletId.set(newWallet.id);
  }
  return newWallet;
}

/**
 * Get color hex value
 */
export function getWalletColorHex(colorName: WalletColor): string {
  return WALLET_COLORS.find((c) => c.name === colorName)?.value ?? "#06b6d4";
}
