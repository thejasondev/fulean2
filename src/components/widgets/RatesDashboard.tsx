import { useEffect } from "react";
import { useStore } from "@nanostores/react";
import {
  RefreshCw,
  Settings,
  WifiOff,
  Zap,
  Pencil,
  Heart,
  Clock,
  MessageCircle,
} from "lucide-react";
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
import {
  openSettings,
  openDonation,
  openHistoryDrawer,
} from "../../stores/uiStore";
import { $visibleCurrencies } from "../../stores/visibilityStore";
import { CURRENCY_META, type Currency } from "../../lib/constants";
import { formatLastUpdate } from "../../lib/eltoque-api";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";

// ============================================
// RatesDashboard Component
// Shows Buy/Sell rates + El Toque reference
// Theme-aware using CSS variables
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
        "bg-[var(--bg-primary)]/50 backdrop-blur-sm",
        "border border-[var(--border-muted)] rounded-xl",
        "transition-all duration-200 active:scale-95",
        "text-left hover:bg-[var(--bg-hover)]",
      )}
    >
      {/* Row 1: Header */}
      <div className="flex items-center justify-between w-full mb-1">
        <div className="flex items-center gap-1">
          <span className="text-xs">{meta.flag}</span>
          <span className="text-[10px] font-bold text-[var(--text-muted)]">
            {currency}
          </span>
        </div>
        {isDigital && (
          <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-[var(--purple-bg)] text-[var(--purple)]">
            DIG
          </span>
        )}
      </div>

      {/* Row 2: Buy/Sell Rates */}
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold text-[var(--status-success)] tabular-nums leading-none">
          {isLoading ? "-" : buyRate}
        </span>
        <span className="text-[var(--text-faint)]">/</span>
        <span className="text-lg font-bold text-[var(--status-warning)] tabular-nums leading-none">
          {isLoading ? "-" : sellRate}
        </span>
      </div>

      {/* Row 3: El Toque Reference or Spread */}
      <div className="flex items-center justify-between mt-1">
        {elToqueRate ? (
          <div className="flex items-center gap-1">
            {isManual ? (
              <Pencil size={8} className="text-[var(--purple)]" />
            ) : (
              <Zap size={8} className="text-[var(--blue)]" />
            )}
            <span
              className={cn(
                "text-[9px] tabular-nums font-bold",
                isManual ? "text-[var(--purple)]" : "text-[var(--blue)]",
              )}
            >
              {elToqueRate}
            </span>
          </div>
        ) : (
          <span className="text-[9px] text-[var(--text-faint)]">
            {meta.name}
          </span>
        )}
        {hasSpread && (
          <span className="text-[9px] font-bold text-[var(--status-success)] tabular-nums">
            +{spread}
          </span>
        )}
      </div>
    </button>
  );
}

// Special Ticker Card for Refresh (Mobile Only)
function RefreshTickerCard({
  isLoading,
  onClick,
}: {
  isLoading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "snap-start shrink-0 md:hidden", // Visible only on mobile
        "flex flex-col items-center justify-center gap-2 mt-5",
        "w-[50px] h-full p-2.5",
        "bg-[var(--blue-bg)]/30 backdrop-blur-sm",
        "border border-[var(--blue)]/30 rounded-xl",
        "transition-all duration-200 active:scale-95",
        "hover:bg-[var(--blue-bg)]/50",
      )}
      title="Actualizar Tasas"
    >
      <RefreshCw
        size={18}
        className={cn("text-[var(--blue)]", isLoading && "animate-spin")}
      />
    </button>
  );
}

// El Toque Info Banner
function ElToqueBanner() {
  const elToqueRates = useStore($elToqueRates);
  const isLoading = useStore($isLoadingElToque);

  if (!elToqueRates && !isLoading) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 bg-[var(--blue-bg)] border-b border-[var(--blue)]/20">
      <Zap size={12} className="text-[var(--blue)]" />
      <span className="text-[10px] text-[var(--blue)] font-medium">
        {isLoading
          ? "Cargando El Toque..."
          : `El Toque: ${formatLastUpdate(
              elToqueRates?.lastUpdate || new Date(),
            )}`}
      </span>
      <span className="text-[10px] text-[var(--blue)]/60">
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
        "bg-[var(--bg-base)]/85 backdrop-blur-xl",
        "border-b border-[var(--border-primary)]/60",
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
              <span className="font-sans font-extrabold text-xl md:text-2xl tracking-tighter text-[var(--text-primary)]">
                Fulean
              </span>
              <span
                className={cn(
                  "font-sans font-extrabold text-xl md:text-2xl tracking-tighter",
                  "bg-linear-to-tr from-emerald-400 to-green-300 bg-clip-text text-transparent",
                  "drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]",
                )}
              >
                2
              </span>
            </a>

            {isOffline && (
              <div className="flex items-center gap-1.5 px-2 md:px-2.5 py-1 rounded-full bg-[var(--status-warning-bg)] border border-[var(--status-warning)]/30 animate-pulse">
                <WifiOff size={14} className="text-[var(--status-warning)]" />
                <span className="hidden md:inline text-[11px] font-bold text-[var(--status-warning)]">
                  Sin conexión
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshRates}
              className="hidden md:flex h-8 w-8 p-0 text-[var(--text-faint)] hover:text-[var(--text-primary)]"
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
              onClick={openSettings}
              className="h-8 w-8 p-0 text-[var(--text-faint)] hover:text-[var(--text-primary)]"
              title="Configuración"
            >
              <Settings size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={openHistoryDrawer}
              className="h-8 w-8 p-0 text-[var(--text-faint)] hover:text-[var(--text-primary)]"
              title="Historial"
            >
              <Clock size={14} />
            </Button>
            <a
              href="https://t.me/fulean2"
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 w-8 flex items-center justify-center rounded-xl transition-all duration-200 hover:bg-[var(--bg-secondary)] text-emerald-400 hover:text-emerald-300"
              title="Unirse al Grupo Telegram"
            >
              <MessageCircle size={14} />
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={openDonation}
              className="h-8 w-8 p-0 text-[var(--pink)] hover:text-[var(--pink)]"
              title="Apoyar"
            >
              <Heart size={14} />
            </Button>
          </div>
        </div>

        {/* Rate Legend + Last Update */}
        <div className="flex items-center justify-between pr-4 mb-2 text-[10px] flex-wrap gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[var(--status-success)]">Compra</span>
            <span className="text-[var(--text-faint)]">/</span>
            <span className="text-[var(--status-warning)]">Venta</span>
            {elToqueRates && (
              <>
                <span className="text-[var(--text-faint)] ml-1">•</span>
                <Zap size={10} className="text-[var(--blue)]" />
                <span className="text-[var(--blue)]">El Toque</span>
              </>
            )}
          </div>
          {/* Timestamp indicator */}
          {elToqueRates && (
            <div className="flex items-center gap-1 text-[var(--text-faint)]">
              <span>{formatLastUpdate(elToqueRates.lastUpdate)}</span>
              {isOffline && (
                <span className="text-[var(--status-warning)] font-medium">
                  (cache)
                </span>
              )}
            </div>
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

          {/* Refresh Card - Mobile Only (At the end) */}
          <RefreshTickerCard isLoading={isLoading} onClick={refreshRates} />

          <div className="w-1 shrink-0" />
        </div>
      </div>
    </header>
  );
}
