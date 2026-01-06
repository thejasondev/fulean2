import { useStore } from "@nanostores/react";
import {
  RefreshCw,
  Settings,
  Shield,
  TrendingDown,
  TrendingUp,
  Minus,
} from "lucide-react";
import {
  $effectiveRates,
  $isLoadingRates,
  $baseRates,
  refreshRates,
} from "../../stores/ratesStore";
import { openSettings, openSecurityModal } from "../../stores/uiStore";
import { type Currency } from "../../lib/constants";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";

// ============================================
// RatesDashboard Component (Refactored)
// Compact Ticker with Smart Cards
// ============================================

const CURRENCY_INFO: Record<Currency, { symbol: string; flag: string }> = {
  USD: { symbol: "$", flag: "🇺🇸" },
  EUR: { symbol: "€", flag: "🇪🇺" },
  CAD: { symbol: "C$", flag: "🇨🇦" },
};

function RateTickerCard({
  currency,
  userRate,
  marketRate,
  isLoading,
  onClick,
}: {
  currency: Currency;
  userRate: number;
  marketRate: number;
  isLoading: boolean;
  onClick: () => void;
}) {
  // Logic: User Rate vs Market Rate
  // User < Market = Buying Opportunity (Green)
  // User > Market = Selling Premium (Red/Orange)
  const diff = userRate - marketRate;
  const isLower = diff < 0;
  const isHigher = diff > 0;
  const isEqual = diff === 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "snap-start shrink-0",
        "flex flex-col justify-between",
        "w-[120px] h-full p-3",
        "bg-neutral-900/50 backdrop-blur-sm",
        "border border-white/5 rounded-2xl",
        "transition-all duration-200 active:scale-95",
        "text-left hover:bg-neutral-800/50"
      )}
    >
      {/* Row 1: Header */}
      <div className="flex items-center justify-between w-full mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{CURRENCY_INFO[currency].flag}</span>
          <span className="text-xs font-bold text-neutral-400">{currency}</span>
        </div>

        {/* Visual Indicator */}
        {!isEqual && (
          <div
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              isLower
                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                : "bg-amber-500"
            )}
          />
        )}
      </div>

      {/* Row 2: Main Number (User Rate) */}
      <div className="text-2xl font-bold text-white tabular-nums tracking-tight leading-none">
        {userRate}
      </div>

      {/* Row 3: Market Context */}
      <div className="flex items-center gap-1 text-[10px] font-medium text-neutral-500 leading-none mt-1.5">
        {isLoading ? (
          <div className="h-3 w-16 bg-neutral-800 rounded animate-pulse" />
        ) : (
          <>
            <span>El Toque: {marketRate}</span>
            {isLower && <TrendingDown size={10} className="text-emerald-500" />}
            {isHigher && <TrendingUp size={10} className="text-amber-500" />}
            {!isEqual && (
              <span
                className={cn(
                  "tabular-nums",
                  isLower ? "text-emerald-500" : "text-amber-500"
                )}
              >
                {Math.abs(diff)}
              </span>
            )}
          </>
        )}
      </div>
    </button>
  );
}

export function RatesDashboard() {
  const effectiveRates = useStore($effectiveRates) ?? {
    USD: 320,
    EUR: 335,
    CAD: 280,
  };
  const baseRates = useStore($baseRates) ?? { USD: 320, EUR: 335, CAD: 280 };
  const isLoading = useStore($isLoadingRates) ?? false;

  return (
    <header
      className={cn(
        "sticky top-0 z-40",
        "bg-neutral-950/85 backdrop-blur-xl",
        "border-b border-neutral-800/60",
        "safe-top"
      )}
    >
      <div className="py-3 pl-4">
        {/* Top Row: Brand + Actions */}
        <div className="flex items-center justify-between pr-4 mb-3">
          <a
            href="/"
            onClick={(e) => e.preventDefault()}
            className="group flex items-center cursor-pointer hover:opacity-80 transition-opacity"
          >
            <span className="font-sans font-extrabold text-xl md:text-2xl tracking-tighter text-white">
              Fulean
            </span>
            <span
              className={cn(
                "font-sans font-extrabold text-xl md:text-2xl tracking-tighter",
                "bg-gradient-to-tr from-emerald-400 to-green-300 bg-clip-text text-transparent",
                "drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]"
              )}
            >
              2
            </span>
          </a>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshRates}
              className="h-8 w-8 p-0 text-neutral-500 hover:text-white"
            >
              <RefreshCw
                size={14}
                className={cn(isLoading && "animate-spin")}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={openSecurityModal}
              className="h-8 w-8 p-0 text-neutral-500 hover:text-white"
            >
              <Shield size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={openSettings}
              className="h-8 w-8 p-0 text-neutral-500 hover:text-white"
            >
              <Settings size={14} />
            </Button>
          </div>
        </div>

        {/* Horizontal Ticker Scroll */}
        <div
          className="flex gap-3 overflow-x-auto snap-x pb-4 pr-4 -mb-4 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {(Object.keys(effectiveRates) as Currency[]).map((currency) => (
            <RateTickerCard
              key={currency}
              currency={currency}
              userRate={effectiveRates[currency]}
              marketRate={baseRates[currency]}
              isLoading={isLoading}
              onClick={openSettings}
            />
          ))}

          {/* Spacer for right padding in scroll view */}
          <div className="w-1 shrink-0" />
        </div>
      </div>
    </header>
  );
}
