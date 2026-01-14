import { useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";
import { ToastProvider } from "../ui/Toast";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { RatesDashboard } from "../widgets/RatesDashboard";
import { AppTabs } from "../widgets/AppTabs";
import { TotalsFooter } from "../widgets/TotalsFooter";
import { SettingsSheet } from "../widgets/SettingsSheet";
import { SecurityModal } from "../widgets/SecurityModal";
import { HistoryDrawer } from "../widgets/HistoryDrawer";
import { ClientViewModal } from "../widgets/ClientViewModal";
import { initializeRates } from "../../stores/ratesStore";

// ============================================
// App Component
// Single React tree with all providers
// Solves Astro island context isolation issue
// ============================================

export function App() {
  // Initialize rates from localStorage on mount
  useEffect(() => {
    initializeRates();
  }, []);

  return (
    <ToastProvider>
      <div className="flex flex-col min-h-dvh">
        {/* Header with exchange rates */}
        <RatesDashboard />

        {/* Main content with tabs (Counter / Calculator) */}
        <AppTabs />

        {/* Sticky footer with totals */}
        <TotalsFooter />

        {/* Modals and Drawers */}
        <SettingsSheet />
        <SecurityModal />
        <HistoryDrawer />
        <ClientViewModal />
      </div>

      {/* Confirm Dialog (global) */}
      <ConfirmDialog />

      {/* Vercel Analytics */}
      <Analytics />
    </ToastProvider>
  );
}
