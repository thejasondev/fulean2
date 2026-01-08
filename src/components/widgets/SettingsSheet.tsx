import { useStore } from "@nanostores/react";
import { RotateCcw, TrendingUp } from "lucide-react";
import {
  $buyRates,
  $sellRates,
  $spreads,
  setBuyRate,
  setSellRate,
  resetRates,
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

// ============================================
// SettingsSheet Component
// Buy/Sell rate editing with spread display
// ============================================

function RateRow({ currency }: { currency: Currency }) {
  const buyRates = useStore($buyRates);
  const sellRates = useStore($sellRates);
  const spreads = useStore($spreads);

  const meta = CURRENCY_META[currency];
  const buyRate = buyRates[currency];
  const sellRate = sellRates[currency];
  const spread = spreads[currency];

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

        {/* Actions */}
        <div className="flex gap-3 pt-2 sticky bottom-0 bg-neutral-950 pb-1">
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
