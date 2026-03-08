import { WalletSelector } from "./WalletSelector";
import { cn } from "../../lib/utils";
import {
  LiquidityAlert,
  CapitalCard,
  PortfolioCard,
  SellSimulator,
  SavingsCard,
  ProfitSummary,
} from "./reports";

// ============================================
// ReportsTab Component
// Capital Management + Investment Metrics
// ============================================

export function ReportsTab() {
  return (
    <main className={cn("flex-1", "px-4 py-4", "pb-32", "space-y-4")}>
      {/* Wallet Selector Header */}
      <div className="flex items-center justify-between">
        <WalletSelector />
      </div>

      <LiquidityAlert />
      <CapitalCard />
      <PortfolioCard />
      <SellSimulator />
      <SavingsCard />
      <ProfitSummary />
    </main>
  );
}
