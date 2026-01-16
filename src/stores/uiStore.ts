import { atom } from "nanostores";

// ============================================
// UI Store
// Global UI state management
// ============================================

// Tab IDs - 4 main tabs
export type TabId = "contar" | "calcular" | "operar" | "reportes";

// Active tab
export const $activeTab = atom<TabId>("contar");

// Modal/Drawer states
export const $isSettingsOpen = atom<boolean>(false);
export const $isSecurityModalOpen = atom<boolean>(false);
export const $isHistoryDrawerOpen = atom<boolean>(false);

// Pending CUP amount (from Counter → Transaction flow)
export const $pendingCUP = atom<number | null>(null);

// ============================================
// Tab Actions
// ============================================

export function setActiveTab(tab: TabId) {
  $activeTab.set(tab);
}

export function goToCounter() {
  $activeTab.set("contar");
}

export function goToCalculator() {
  $activeTab.set("calcular");
}

export function goToTransaction() {
  $activeTab.set("operar");
}

export function goToReports() {
  $activeTab.set("reportes");
}

/**
 * Navigate to Transaction tab with pre-filled CUP amount
 * Used when clicking "Use in Trade" from Counter
 */
export function useInTransaction(cupAmount: number) {
  $pendingCUP.set(cupAmount);
  $activeTab.set("operar");
}

/**
 * Clear pending CUP (after it's been consumed by Transaction form)
 */
export function clearPendingCUP() {
  $pendingCUP.set(null);
}

// ============================================
// Modal/Drawer Actions
// ============================================

export function openSettings() {
  $isSettingsOpen.set(true);
}

export function closeSettings() {
  $isSettingsOpen.set(false);
}

export function openSecurityModal() {
  $isSecurityModalOpen.set(true);
}

export function closeSecurityModal() {
  $isSecurityModalOpen.set(false);
}

export function openHistoryDrawer() {
  $isHistoryDrawerOpen.set(true);
}

export function closeHistoryDrawer() {
  $isHistoryDrawerOpen.set(false);
}

// Client View Modal (customer-facing display)
export const $isClientViewOpen = atom<boolean>(false);
export const $clientViewData = atom<{
  foreignAmount: number;
  foreignCurrency: string;
  cupAmount: number;
  rate: number;
  operation: "BUY" | "SELL";
} | null>(null);

export function openClientView(data: {
  foreignAmount: number;
  foreignCurrency: string;
  cupAmount: number;
  rate: number;
  operation: "BUY" | "SELL";
}) {
  $clientViewData.set(data);
  $isClientViewOpen.set(true);
}

export function closeClientView() {
  $isClientViewOpen.set(false);
  $clientViewData.set(null);
}

// Donation Modal
export const $isDonationOpen = atom<boolean>(false);

export function openDonation() {
  $isDonationOpen.set(true);
}

export function closeDonation() {
  $isDonationOpen.set(false);
}
