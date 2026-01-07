import { useStore } from "@nanostores/react";
import { useStore as useNanoStore } from "@nanostores/react";
import { $effectiveRates, setRate, resetRates } from "../../stores/ratesStore";
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
// Grouped rate editing for 6 currencies
// ============================================

function RateCard({ currency }: { currency: Currency }) {
  const rates = useStore($effectiveRates);
  const meta = CURRENCY_META[currency];
  const currentRate = rates[currency];

  const handleRateChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      setRate(currency, numValue);
    }
  };

  return (
    <div
      className={cn(
        "bg-neutral-900 rounded-xl p-3 border border-neutral-800",
        "flex items-center gap-3"
      )}
    >
      {/* Currency Icon */}
      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0",
          meta.category === "digital" ? "bg-purple-500/10" : "bg-emerald-500/10"
        )}
      >
        {meta.flag}
      </div>

      {/* Currency Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-white text-sm">{currency}</span>
          {meta.category === "digital" && (
            <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-purple-500/20 text-purple-400">
              DIG
            </span>
          )}
        </div>
        <span className="text-xs text-neutral-500 truncate">{meta.name}</span>
      </div>

      {/* Rate Input */}
      <div className="w-24 shrink-0">
        <Input
          type="number"
          value={currentRate}
          onChange={(e) => handleRateChange(e.target.value)}
          size="sm"
          numericOnly
          className="text-center font-bold tabular-nums text-emerald-400"
          min={1}
        />
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
      <div className="p-5 space-y-4">
        {/* Explanation */}
        <div className="bg-neutral-950/50 rounded-xl p-3 border border-neutral-800/40">
          <p className="text-sm text-neutral-300 font-medium">
            Edita las tasas de cambio manualmente
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            Los valores se guardan automáticamente.
          </p>
        </div>

        {/* Cash Currencies */}
        <div>
          <div className="text-xs text-neutral-500 font-bold uppercase tracking-wide mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Efectivo
          </div>
          <div className="space-y-2">
            {CASH_CURRENCIES.map((currency) => (
              <RateCard key={currency} currency={currency} />
            ))}
          </div>
        </div>

        {/* Digital Currencies */}
        <div>
          <div className="text-xs text-neutral-500 font-bold uppercase tracking-wide mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            Digital
          </div>
          <div className="space-y-2">
            {DIGITAL_CURRENCIES.map((currency) => (
              <RateCard key={currency} currency={currency} />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={resetRates} className="flex-1">
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
