import { useStore } from "@nanostores/react";
import { RotateCcw, TrendingUp, Zap, RefreshCw, Pencil } from "lucide-react";
import {
  $buyRates,
  $sellRates,
  $spreads,
  $elToqueRates,
  $isLoadingElToque,
  $manualElToqueRates,
  setBuyRate,
  setSellRate,
  setManualElToqueRate,
  isManualElToqueCurrency,
  resetRates,
  loadElToqueRates,
} from "../../stores/ratesStore";
import { $isSettingsOpen, closeSettings } from "../../stores/uiStore";
import {
  CURRENCIES,
  CURRENCY_META,
  CASH_CURRENCIES,
  DIGITAL_CURRENCIES,
  type Currency,
} from "../../lib/constants";
import { cn } from "../../lib/utils";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { useHaptic } from "../../hooks/useHaptic";

// ============================================
// SettingsSheet Component
// Buy/Sell rate editing with El Toque reference
// ============================================

function RateRow({ currency }: { currency: Currency }) {
  const buyRates = useStore($buyRates);
  const sellRates = useStore($sellRates);
  const spreads = useStore($spreads);
  const elToqueRates = useStore($elToqueRates);
  const manualElToqueRates = useStore($manualElToqueRates);

  const meta = CURRENCY_META[currency];
  const buyRate = buyRates[currency];
  const sellRate = sellRates[currency];
  const spread = spreads[currency];

  // Check if this currency uses manual El Toque rate
  const isManual = isManualElToqueCurrency(currency);
  const elToqueRate = isManual
    ? manualElToqueRates[currency as "CAD" | "ZELLE" | "CLASICA"]
    : elToqueRates?.[currency];

  const handleBuyChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      setBuyRate(currency, numValue);
    }
  };

  const handleSellChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      setSellRate(currency, numValue);
    }
  };

  const handleManualElToqueChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0 && isManual) {
      setManualElToqueRate(currency as "CAD" | "ZELLE" | "CLASICA", numValue);
    }
  };

  return (
    <div
      className={cn("bg-neutral-900 rounded-xl p-4 border border-neutral-800")}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{meta.flag}</span>
          <span className="font-bold text-white">{currency}</span>
          {meta.category === "digital" && (
            <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-purple-500/20 text-purple-400">
              DIG
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* El Toque Reference - Editable for manual currencies */}
          {isManual ? (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
              <Pencil size={10} className="text-purple-400" />
              <input
                type="number"
                value={elToqueRate || 0}
                onChange={(e) => handleManualElToqueChange(e.target.value)}
                className="w-12 bg-transparent text-[10px] font-bold text-purple-400 tabular-nums text-center outline-none"
                min={1}
              />
            </div>
          ) : elToqueRate ? (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
              <Zap size={10} className="text-blue-400" />
              <span className="text-[10px] font-bold text-blue-400 tabular-nums">
                {elToqueRate}
              </span>
            </div>
          ) : null}

          {/* Spread Badge */}
          {spread > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <TrendingUp size={12} className="text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 tabular-nums">
                +{spread}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Buy/Sell Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-neutral-500 mb-1 font-medium uppercase tracking-wide">
            Compra
          </label>
          <Input
            type="number"
            value={buyRate}
            onChange={(e) => handleBuyChange(e.target.value)}
            size="sm"
            numericOnly
            className="text-center font-bold tabular-nums text-emerald-400"
            min={1}
          />
        </div>
        <div>
          <label className="block text-[10px] text-neutral-500 mb-1 font-medium uppercase tracking-wide">
            Venta
          </label>
          <Input
            type="number"
            value={sellRate}
            onChange={(e) => handleSellChange(e.target.value)}
            size="sm"
            numericOnly
            className="text-center font-bold tabular-nums text-amber-400"
            min={1}
          />
        </div>
      </div>
    </div>
  );
}

export function SettingsSheet() {
  const isOpen = useStore($isSettingsOpen) ?? false;
  const isLoadingElToque = useStore($isLoadingElToque);
  const elToqueRates = useStore($elToqueRates);
  const haptic = useHaptic();

  const handleRefreshElToque = () => {
    haptic.medium();
    loadElToqueRates();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeSettings}
      title="Configurar Tasas"
      size="md"
    >
      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Explanation */}
        <div className="bg-neutral-950/50 rounded-xl p-3 border border-neutral-800/40">
          <p className="text-sm text-neutral-300 font-medium">Compra / Venta</p>
          <p className="text-xs text-neutral-500 mt-1">
            Define las tasas a las que compras y vendes cada moneda.
          </p>
        </div>

        {/* El Toque Reference Section */}
        <div className="bg-blue-500/5 rounded-xl p-3 border border-blue-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-blue-400" />
              <div>
                <p className="text-sm text-blue-400 font-bold">El Toque</p>
                <p className="text-[10px] text-blue-400/60">
                  Referencia mercado informal
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshElToque}
              className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300"
              title="Actualizar El Toque"
            >
              <RefreshCw
                size={14}
                className={cn(isLoadingElToque && "animate-spin")}
              />
            </Button>
          </div>
          {elToqueRates && (
            <p className="text-[10px] text-blue-400/60 mt-2">
              Usa estos valores como guía para ajustar tus tasas
            </p>
          )}
        </div>

        {/* Cash Currencies */}
        <div>
          <div className="text-xs text-neutral-500 font-bold uppercase tracking-wide mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Efectivo
          </div>
          <div className="space-y-3">
            {CASH_CURRENCIES.map((currency) => (
              <RateRow key={currency} currency={currency} />
            ))}
          </div>
        </div>

        {/* Digital Currencies */}
        <div>
          <div className="text-xs text-neutral-500 font-bold uppercase tracking-wide mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            Digital
          </div>
          <div className="space-y-3">
            {DIGITAL_CURRENCIES.map((currency) => (
              <RateRow key={currency} currency={currency} />
            ))}
          </div>
        </div>

        {/* Actions - Fixed Footer */}
        <div className="flex gap-3 pt-4 mt-4 border-t border-neutral-800">
          <Button
            variant="secondary"
            onClick={resetRates}
            className="flex-1 gap-2"
          >
            <RotateCcw size={14} />
            Resetear
          </Button>
          <Button variant="primary" onClick={closeSettings} className="flex-1">
            Listo
          </Button>
        </div>
      </div>
    </Modal>
  );
}
