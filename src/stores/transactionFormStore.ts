import { atom, computed } from "nanostores";
import type { OperationType, TransactionCurrency } from "./historyStore";

// ============================================
// Transaction Form Store
// Shared state between TransactionForm and TotalsFooter
// ============================================

// Form state interface
export interface TransactionFormState {
  operation: OperationType;
  amount: number;
  currency: TransactionCurrency;
  rate: number;
  totalCUP: number;
  isValid: boolean;
  walletId?: string;
  // Exchange-specific
  fromCurrency?: TransactionCurrency;
  toCurrency?: TransactionCurrency;
  exchangeRate?: number;
  amountReceived?: number;
}

// Initial state
const initialState: TransactionFormState = {
  operation: "BUY",
  amount: 0,
  currency: "USD",
  rate: 0,
  totalCUP: 0,
  isValid: false,
};

// State atom
export const $transactionFormState = atom<TransactionFormState>(initialState);

// Client view modal state
export const $isClientViewOpen = atom<boolean>(false);

// Computed: Check if form has valid data for submission
export const $canSubmitTransaction = computed(
  $transactionFormState,
  (state) => {
    if (state.operation === "EXCHANGE") {
      return (
        state.amount > 0 &&
        state.exchangeRate !== undefined &&
        state.exchangeRate > 0 &&
        state.fromCurrency !== state.toCurrency
      );
    }
    return state.amount > 0 && state.rate > 0 && state.totalCUP > 0;
  },
);

// ============================================
// Actions
// ============================================

/**
 * Update form state from TransactionForm component
 */
export function setTransactionFormState(state: Partial<TransactionFormState>) {
  const current = $transactionFormState.get();
  $transactionFormState.set({ ...current, ...state });
}

/**
 * Clear form state (when leaving Operar tab)
 */
export function clearTransactionFormState() {
  $transactionFormState.set(initialState);
}

/**
 * Open client view modal
 */
export function openClientView() {
  $isClientViewOpen.set(true);
}

/**
 * Close client view modal
 */
export function closeClientView() {
  $isClientViewOpen.set(false);
}

// Submit callback - will be set by TransactionForm
let submitCallback: (() => void) | null = null;

/**
 * Register submit callback from TransactionForm
 */
export function registerSubmitCallback(callback: () => void) {
  submitCallback = callback;
}

/**
 * Unregister submit callback
 */
export function unregisterSubmitCallback() {
  submitCallback = null;
}

/**
 * Execute submit from footer
 */
export function executeSubmitFromFooter() {
  if (submitCallback) {
    submitCallback();
  }
}
