import { useEffect } from "react";
import { useStore } from "@nanostores/react";
import { Analytics } from "@vercel/analytics/react";
import { ToastProvider } from "../ui/Toast";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { RatesDashboard } from "../widgets/RatesDashboard";
import { AppTabs } from "../widgets/AppTabs";
import { TotalsFooter } from "../widgets/TotalsFooter";
import { SettingsSheet } from "../widgets/SettingsSheet";
import { HistoryDrawer } from "../widgets/HistoryDrawer";
import { ClientViewModal } from "../widgets/ClientViewModal";
import { DonationSheet } from "../widgets/DonationSheet";
import { PinScreen } from "../widgets/PinScreen";
import { initializeRates } from "../../stores/ratesStore";
import { $theme, initializeTheme } from "../../stores/themeStore";

// ============================================
// App Component
// Single React tree with all providers
// Solves Astro island context isolation issue
// ============================================

export function App() {
  const theme = useStore($theme);

  // Initialize rates and theme from localStorage on mount
  useEffect(() => {
    initializeRates();
    initializeTheme();
  }, []);

  // Apply theme class to document when theme changes
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-dark", "theme-sunlight");
    root.classList.add(`theme-${theme}`);

    // Update meta theme-color
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute(
        "content",
        theme === "sunlight" ? "#FFFFFF" : "#0a0a0a",
      );
    }
  }, [theme]);

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
        <HistoryDrawer />
        <ClientViewModal />
        <DonationSheet />
        <PinScreen />
      </div>

      {/* Confirm Dialog (global) */}
      <ConfirmDialog />

      {/* Vercel Analytics */}
      <Analytics />
    </ToastProvider>
  );
}
