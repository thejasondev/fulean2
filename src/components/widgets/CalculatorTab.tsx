import { useState, useMemo } from "react";
import { useStore } from "@nanostores/react";
import { ArrowRight } from "lucide-react";
import { $effectiveRates } from "../../stores/ratesStore";
import { type Currency } from "../../lib/constants";
import { calculateBillBreakdown, convertToCUP } from "../../lib/algorithms";
import { formatNumber } from "../../lib/formatters";
import { cn } from "../../lib/utils";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { BillBreakdown } from "./BillBreakdown";

// ============================================
// CalculatorTab Component
// Reverse calculator: Foreign currency → CUP → Bill breakdown
// ============================================

type CalculatorCurrency = "USD" | "EUR" | "CAD";

const CURRENCY_OPTIONS: {
  id: CalculatorCurrency;
  label: string;
  flag: string;
}[] = [
  { id: "USD", label: "USD", flag: "🇺🇸" },
  { id: "EUR", label: "EUR", flag: "🇪🇺" },
  { id: "CAD", label: "CAD", flag: "🇨🇦" },
];

export function CalculatorTab() {
  const rates = useStore($effectiveRates) ?? { USD: 320, EUR: 335, CAD: 280 };

  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState<CalculatorCurrency>("USD");

  // Calculate CUP and breakdown
  const { cupAmount, breakdown } = useMemo(() => {
    const numAmount = parseFloat(amount) || 0;
    const rate = rates[currency] || 1;
    const cup = convertToCUP(numAmount, rate);
    const result = cup > 0 ? calculateBillBreakdown(cup) : null;

    return {
      cupAmount: cup,
      breakdown: result,
    };
  }, [amount, currency, rates]);

  const handleAmountChange = (value: string) => {
    // Allow only numbers and decimal point
    const cleaned = value.replace(/[^0-9.]/g, "");
    // Prevent multiple decimal points
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) return;
    setAmount(cleaned);
  };

  const handleClear = () => {
    setAmount("");
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 pb-32">
      {/* Currency Selector */}
      <div className="mb-4">
        <label className="block text-sm text-neutral-500 mb-2 font-medium">
          Moneda de origen
        </label>
        <div className="grid grid-cols-3 gap-2">
          {CURRENCY_OPTIONS.map((opt) => {
            const isActive = currency === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setCurrency(opt.id)}
                className={cn(
                  "flex items-center justify-center gap-2",
                  "min-h-[48px] px-3 py-2",
                  "rounded-xl border",
                  "font-semibold text-sm",
                  "transition-all duration-200",
                  isActive
                    ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-400"
                    : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:border-neutral-700"
                )}
              >
                <span>{opt.flag}</span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Amount Input */}
      <div className="mb-4">
        <label className="block text-sm text-neutral-500 mb-2 font-medium">
          Cantidad en {currency}
        </label>
        <div className="relative">
          <Input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="0.00"
            size="lg"
            className="text-center pr-16"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 font-semibold">
            {currency}
          </span>
        </div>
      </div>

      {/* Conversion Result */}
      {cupAmount > 0 && (
        <div
          className={cn(
            "bg-neutral-900 rounded-2xl p-4 mb-4",
            "border border-neutral-800",
            "animate-fade-in"
          )}
        >
          <div className="flex items-center justify-center gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white tabular-nums">
                {amount} {currency}
              </div>
              <div className="text-xs text-neutral-500 tabular-nums">
                @ {rates[currency]} CUP
              </div>
            </div>

            <ArrowRight className="w-6 h-6 text-emerald-400 shrink-0" />

            <div>
              <div className="text-2xl font-bold text-emerald-400 tabular-nums money-glow">
                {formatNumber(cupAmount)} CUP
              </div>
              <div className="text-xs text-neutral-500">equivalente</div>
            </div>
          </div>
        </div>
      )}

      {/* Bill Breakdown */}
      <BillBreakdown result={breakdown} />

      {/* Clear Button */}
      {amount && (
        <div className="mt-4">
          <Button variant="secondary" onClick={handleClear} className="w-full">
            Limpiar
          </Button>
        </div>
      )}
    </div>
  );
}
