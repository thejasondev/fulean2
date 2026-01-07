import { useStore } from "@nanostores/react";
import { RefreshCw, Settings, Shield, WifiOff } from "lucide-react";
import {
  $effectiveRates,
  $isLoadingRates,
  $isOffline,
  refreshRates,
} from "../../stores/ratesStore";
import { openSettings, openSecurityModal } from "../../stores/uiStore";
import { CURRENCIES, CURRENCY_META, type Currency } from "../../lib/constants";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";

// ============================================
// RatesDashboard Component
// Compact Ticker with 6 Currency Cards
// ============================================

function RateTickerCard({
  currency,
  rate,
  isLoading,
  onClick,
}: {
  currency: Currency;
  rate: number;
  isLoading: boolean;
  onClick: () => void;
}) {
  const meta = CURRENCY_META[currency];
  const isDigital = meta.category === "digital";

  return (
    <button
      onClick={onClick}
      className={cn(
        "snap-start shrink-0",
        "flex flex-col justify-between",
        "w-[100px] h-full p-2.5",
        "bg-neutral-900/50 backdrop-blur-sm",
        "border border-white/5 rounded-xl",
        "transition-all duration-200 active:scale-95",
        "text-left hover:bg-neutral-800/50"
      )}
    >
      {/* Row 1: Header */}
      <div className="flex items-center justify-between w-full mb-1">
        <div className="flex items-center gap-1">
          <span className="text-xs">{meta.flag}</span>
          <span className="text-[10px] font-bold text-neutral-400">
            {currency}
          </span>
        </div>

        {/* Category Badge */}
        {isDigital && (
          <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-purple-500/20 text-purple-400">
            DIG
          </span>
        )}
      </div>

      {/* Row 2: Rate */}
      <div className="text-xl font-bold text-white tabular-nums tracking-tight leading-none">
        {isLoading ? (
          <div className="h-6 w-12 bg-neutral-800 rounded animate-pulse" />
        ) : (
          rate
        )}
      </div>

      {/* Row 3: Label */}
      <div className="text-[9px] font-medium text-neutral-500 leading-none mt-1 truncate">
        {meta.name}
      </div>
    </button>
  );
}

export function RatesDashboard() {
  const effectiveRates = useStore($effectiveRates);
  const isLoading = useStore($isLoadingRates) ?? false;
  const isOffline = useStore($isOffline) ?? false;

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
          <div className="flex items-center gap-2">
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

            {/* Offline Indicator */}
            {isOffline && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                <WifiOff size={12} className="text-amber-400" />
                <span className="text-[10px] font-bold text-amber-400">
                  OFFLINE
                </span>
              </div>
            )}
          </div>

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

        {/* Horizontal Ticker Scroll - All 6 Currencies */}
        <div className="flex gap-2 overflow-x-auto snap-x pb-3 pr-4 -mb-3 scrollbar-hide">
          {CURRENCIES.map((currency) => (
            <RateTickerCard
              key={currency}
              currency={currency}
              rate={effectiveRates[currency]}
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
