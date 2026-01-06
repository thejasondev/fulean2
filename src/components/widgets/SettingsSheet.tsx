import { useStore } from "@nanostores/react";
import { Plus, Minus } from "lucide-react";
import {
  $baseRates,
  $spreads,
  $effectiveRates,
  setBaseRate,
  setSpread,
  resetSpreads,
} from "../../stores/ratesStore";
import { $isSettingsOpen, closeSettings } from "../../stores/uiStore";
import { type Currency } from "../../lib/constants";
import { cn } from "../../lib/utils";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

// ============================================
// SettingsSheet Component
// Rate and spread configuration
// ============================================

const CURRENCIES: { id: Currency; label: string; flag: string }[] = [
  { id: "USD", label: "Dólar estadounidense", flag: "🇺🇸" },
  { id: "EUR", label: "Euro", flag: "🇪🇺" },
  { id: "CAD", label: "Dólar canadiense", flag: "🇨🇦" },
];

export function SettingsSheet() {
  const isOpen = useStore($isSettingsOpen) ?? false;
  const baseRates = useStore($baseRates) ?? { USD: 320, EUR: 335, CAD: 280 };
  const spreads = useStore($spreads) ?? { USD: 0, EUR: 0, CAD: 0 };
  const effectiveRates = useStore($effectiveRates) ?? {
    USD: 320,
    EUR: 335,
    CAD: 280,
  };

  const handleBaseRateChange = (currency: Currency, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      setBaseRate(currency, numValue);
    }
  };

  const handleSpreadChange = (currency: Currency, delta: number) => {
    const current = spreads[currency] || 0;
    setSpread(currency, current + delta);
  };

  const handleSpreadInput = (currency: Currency, value: string) => {
    // Allow negative numbers
    const cleaned = value.replace(/[^0-9-]/g, "");
    if (cleaned === "" || cleaned === "-") {
      setSpread(currency, 0);
      return;
    }
    const numValue = parseInt(cleaned, 10);
    if (!isNaN(numValue)) {
      setSpread(currency, numValue);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeSettings}
      title="Configurar Tasas"
      size="md"
    >
      <div className="p-5 space-y-5">
        {/* Explanation */}
        <div className="bg-neutral-950/50 rounded-xl p-4 border border-neutral-800/40">
          <p className="text-sm text-neutral-300 font-medium">
            Tasa Efectiva = Tasa Base + Margen
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            Usa el margen para ajustar según si compras (-) o vendes (+).
          </p>
        </div>

        {/* Rate Cards */}
        {CURRENCIES.map((curr) => (
          <div
            key={curr.id}
            className={cn(
              "bg-neutral-900 rounded-xl p-4",
              "border border-neutral-800"
            )}
          >
            {/* Currency Header */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{curr.flag}</span>
              <div>
                <div className="font-semibold text-white">{curr.id}</div>
                <div className="text-xs text-neutral-500">{curr.label}</div>
              </div>
            </div>

            {/* Base Rate */}
            <div className="mb-4">
              <label className="block text-xs text-neutral-500 mb-1.5 font-medium">
                Tasa Base
              </label>
              <Input
                type="number"
                value={baseRates[curr.id]}
                onChange={(e) => handleBaseRateChange(curr.id, e.target.value)}
                size="md"
                numericOnly
                className="text-center font-bold tabular-nums"
                min={1}
              />
            </div>

            {/* Spread */}
            <div className="mb-4">
              <label className="block text-xs text-neutral-500 mb-1.5 font-medium">
                Margen (+/-)
              </label>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => handleSpreadChange(curr.id, -5)}
                  className="w-12 h-12 p-0"
                  aria-label="Reducir margen"
                >
                  <Minus className="w-5 h-5" />
                </Button>

                <Input
                  type="text"
                  inputMode="numeric"
                  value={spreads[curr.id]}
                  onChange={(e) => handleSpreadInput(curr.id, e.target.value)}
                  size="md"
                  className={cn(
                    "text-center font-bold tabular-nums flex-1",
                    spreads[curr.id] > 0 && "text-emerald-400",
                    spreads[curr.id] < 0 && "text-red-400"
                  )}
                />

                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => handleSpreadChange(curr.id, 5)}
                  className="w-12 h-12 p-0"
                  aria-label="Aumentar margen"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Effective Rate Preview */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
              <span className="text-sm text-neutral-500 font-medium">
                Tasa Efectiva
              </span>
              <span className="text-xl font-bold text-emerald-400 tabular-nums money-glow">
                {effectiveRates[curr.id]} CUP
              </span>
            </div>
          </div>
        ))}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={resetSpreads} className="flex-1">
            Resetear
          </Button>
          <Button variant="primary" onClick={closeSettings} className="flex-1">
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
