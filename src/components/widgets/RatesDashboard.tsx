import { useEffect } from "react";
import { useStore } from "@nanostores/react";
import { RefreshCw, Settings, WifiOff, Zap, Pencil, Heart } from "lucide-react";
import {
  $buyRates,
  $sellRates,
  $spreads,
  $isLoadingRates,
  $isOffline,
  $elToqueRates,
  $isLoadingElToque,
  $manualElToqueRates,
  isManualElToqueCurrency,
  refreshRates,
  loadElToqueRates,
} from "../../stores/ratesStore";
import { openSettings, openDonation } from "../../stores/uiStore";
import { $visibleCurrencies } from "../../stores/visibilityStore";
import { CURRENCIES, CURRENCY_META, type Currency } from "../../lib/constants";
import { formatLastUpdate } from "../../lib/eltoque-api";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";

// ============================================
// RatesDashboard Component
// Shows Buy/Sell rates + El Toque reference
// ============================================

function RateTickerCard({
  currency,
  buyRate,
  sellRate,
  spread,
  elToqueRate,
  isManual,
  isLoading,
  onClick,
}: {
  currency: Currency;
  buyRate: number;
  sellRate: number;
  spread: number;
  elToqueRate?: number;
  isManual?: boolean;
  isLoading: boolean;
  onClick: () => void;
}) {
  const meta = CURRENCY_META[currency];
  const isDigital = meta.category === "digital";
  const hasSpread = spread > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "snap-start shrink-0",
        "flex flex-col justify-between",
        "w-[105px] h-full p-2.5",
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
        {isDigital && (
          <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-purple-500/20 text-purple-400">
            DIG
          </span>
        )}
      </div>

      {/* Row 2: Buy/Sell Rates */}
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold text-emerald-400 tabular-nums leading-none">
          {isLoading ? "-" : buyRate}
        </span>
        <span className="text-neutral-600">/</span>
        <span className="text-lg font-bold text-amber-400 tabular-nums leading-none">
          {isLoading ? "-" : sellRate}
        </span>
      </div>

      {/* Row 3: El Toque Reference or Spread */}
      <div className="flex items-center justify-between mt-1">
        {elToqueRate ? (
          <div className="flex items-center gap-1">
            {isManual ? (
              <Pencil size={8} className="text-purple-400" />
            ) : (
              <Zap size={8} className="text-blue-400" />
            )}
            <span
              className={cn(
                "text-[9px] tabular-nums font-bold",
                isManual ? "text-purple-400" : "text-blue-400"
              )}
            >
              {elToqueRate}
            </span>
          </div>
        ) : (
          <span className="text-[9px] text-neutral-500">{meta.name}</span>
        )}
        {hasSpread && (
          <span className="text-[9px] font-bold text-emerald-400 tabular-nums">
            +{spread}
          </span>
        )}
      </div>
    </button>
  );
}

// El Toque Info Banner
function ElToqueBanner() {
  const elToqueRates = useStore($elToqueRates);
  const isLoading = useStore($isLoadingElToque);

  if (!elToqueRates && !isLoading) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border-b border-blue-500/20">
      <Zap size={12} className="text-blue-400" />
      <span className="text-[10px] text-blue-400 font-medium">
        {isLoading
          ? "Cargando El Toque..."
          : `El Toque: ${formatLastUpdate(
              elToqueRates?.lastUpdate || new Date()
            )}`}
      </span>
      <span className="text-[10px] text-blue-400/60">
        • Referencia mercado informal
      </span>
    </div>
  );
}

export function RatesDashboard() {
  const buyRates = useStore($buyRates);
  const sellRates = useStore($sellRates);
  const spreads = useStore($spreads);
  const elToqueRates = useStore($elToqueRates);
  const manualElToqueRates = useStore($manualElToqueRates);
  const visibleCurrencies = useStore($visibleCurrencies);
  const isLoading = useStore($isLoadingRates) ?? false;
  const isOffline = useStore($isOffline) ?? false;

  // Load El Toque rates on mount
  useEffect(() => {
    loadElToqueRates();
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40",
        "bg-neutral-950/85 backdrop-blur-xl",
        "border-b border-neutral-800/60"
      )}
    >
      {/* Inner container with safe-area padding */}
      <div className="safe-top py-3 pl-4">
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
                  "bg-linear-to-tr from-emerald-400 to-green-300 bg-clip-text text-transparent",
                  "drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]"
                )}
              >
                2
              </span>
            </a>

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
              title="Actualizar tasas"
            >
              <RefreshCw
                size={14}
                className={cn(isLoading && "animate-spin")}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={openDonation}
              className="h-8 w-8 p-0 text-pink-400 hover:text-pink-300"
              title="Apoyar"
            >
              <Heart size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={openSettings}
              className="h-8 w-8 p-0 text-neutral-500 hover:text-white"
              title="Configuración"
            >
              <Settings size={14} />
            </Button>
          </div>
        </div>

        {/* Rate Legend */}
        <div className="flex items-center gap-2 pr-4 mb-2 text-[10px]">
          <span className="text-emerald-400">Compra</span>
          <span className="text-neutral-600">/</span>
          <span className="text-amber-400">Venta</span>
          {elToqueRates && (
            <>
              <span className="text-neutral-600 ml-2">•</span>
              <Zap size={10} className="text-blue-400" />
              <span className="text-blue-400">El Toque</span>
            </>
          )}
        </div>

        {/* Horizontal Ticker Scroll */}
        <div className="flex gap-2 overflow-x-auto snap-x pb-3 pr-4 -mb-3 scrollbar-hide">
          {visibleCurrencies.map((currency) => {
            // Use manual rate for CAD, ZELLE, CLASICA; API rate for others
            const isManual = isManualElToqueCurrency(currency);
            const elToqueRate = isManual
              ? manualElToqueRates[currency as "CAD" | "ZELLE" | "CLASICA"]
              : elToqueRates?.[currency];

            return (
              <RateTickerCard
                key={currency}
                currency={currency}
                buyRate={buyRates[currency]}
                sellRate={sellRates[currency]}
                spread={spreads[currency]}
                elToqueRate={elToqueRate}
                isManual={isManual}
                isLoading={isLoading}
                onClick={openSettings}
              />
            );
          })}
          <div className="w-1 shrink-0" />
        </div>
      </div>
    </header>
  );
}
