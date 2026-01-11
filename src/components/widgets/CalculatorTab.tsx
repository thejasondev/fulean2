import { useState, useMemo } from "react";
import { useStore } from "@nanostores/react";
import { ArrowRight, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import {
  $buyRates,
  $sellRates,
  getRateForOperation,
} from "../../stores/ratesStore";
import {
  CURRENCIES,
  CURRENCY_META,
  DENOMINATIONS,
  type Currency,
  type Denomination,
} from "../../lib/constants";
import { formatNumber } from "../../lib/formatters";
import { cn } from "../../lib/utils";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { useHaptic } from "../../hooks/useHaptic";

// ============================================
// CalculatorTab Component
// Enhanced with Buy/Sell selector and denomination filter
// ============================================

type OperationType = "BUY" | "SELL";

// Available denominations for filtering
const DENOMINATION_OPTIONS = DENOMINATIONS;

export function CalculatorTab() {
  const buyRates = useStore($buyRates) ?? {};
  const sellRates = useStore($sellRates) ?? {};
  const haptic = useHaptic();

  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [operation, setOperation] = useState<OperationType>("BUY");
  const [selectedDenoms, setSelectedDenoms] = useState<Set<Denomination>>(
    new Set(DENOMINATIONS)
  );

  // Get rate based on operation
  const currentRate = getRateForOperation(currency, operation);

  // Calculate CUP and breakdown
  const { cupAmount, breakdown, totalBills, remainder } = useMemo(() => {
    const numAmount = parseFloat(amount) || 0;
    const cup = Math.round(numAmount * currentRate);

    if (cup <= 0) {
      return { cupAmount: 0, breakdown: [], totalBills: 0, remainder: 0 };
    }

    // Calculate breakdown using only selected denominations
    const activeDenoms = DENOMINATIONS.filter((d) => selectedDenoms.has(d));
    let remaining = cup;
    const result: { denom: Denomination; count: number; subtotal: number }[] =
      [];
    let bills = 0;

    for (const denom of activeDenoms) {
      if (remaining >= denom) {
        const count = Math.floor(remaining / denom);
        const subtotal = count * denom;
        result.push({ denom, count, subtotal });
        remaining -= subtotal;
        bills += count;
      }
    }

    return {
      cupAmount: cup,
      breakdown: result,
      totalBills: bills,
      remainder: remaining,
    };
  }, [amount, currentRate, selectedDenoms]);

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmount(cleaned);
  };

  const handleClear = () => {
    setAmount("");
  };

  const toggleDenom = (denom: Denomination) => {
    haptic.light();
    const newSet = new Set(selectedDenoms);
    if (newSet.has(denom)) {
      if (newSet.size > 1) {
        newSet.delete(denom);
      }
    } else {
      newSet.add(denom);
    }
    setSelectedDenoms(newSet);
  };

  const selectAllDenoms = () => {
    haptic.light();
    setSelectedDenoms(new Set(DENOMINATIONS));
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 pb-32">
      {/* Operation Selector */}
      <div className="mb-4">
        <label className="block text-sm text-neutral-500 mb-2 font-medium">
          Tipo de operación
        </label>
        <div className="flex p-1 bg-neutral-900 rounded-xl border border-neutral-800">
          <button
            onClick={() => {
              haptic.light();
              setOperation("BUY");
            }}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200",
              "flex items-center justify-center gap-2",
              operation === "BUY"
                ? "bg-neutral-800 text-emerald-400 shadow-lg"
                : "text-neutral-500 hover:text-neutral-300"
            )}
          >
            <ArrowDownLeft className="w-4 h-4" />
            Compra
          </button>
          <button
            onClick={() => {
              haptic.light();
              setOperation("SELL");
            }}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200",
              "flex items-center justify-center gap-2",
              operation === "SELL"
                ? "bg-neutral-800 text-amber-400 shadow-lg"
                : "text-neutral-500 hover:text-neutral-300"
            )}
          >
            <ArrowUpRight className="w-4 h-4" />
            Venta
          </button>
        </div>
      </div>

      {/* Currency Selector */}
      <div className="mb-4">
        <label className="block text-sm text-neutral-500 mb-2 font-medium">
          Moneda
        </label>
        <div className="grid grid-cols-3 gap-2">
          {CURRENCIES.slice(0, 6).map((curr) => {
            const meta = CURRENCY_META[curr];
            const isActive = currency === curr;
            return (
              <button
                key={curr}
                onClick={() => {
                  haptic.light();
                  setCurrency(curr);
                }}
                className={cn(
                  "flex items-center justify-center gap-1.5",
                  "min-h-[44px] px-2 py-2",
                  "rounded-xl border",
                  "font-semibold text-sm",
                  "transition-all duration-200",
                  isActive
                    ? operation === "BUY"
                      ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-400"
                      : "bg-amber-500/15 border-amber-500/50 text-amber-400"
                    : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:border-neutral-700"
                )}
              >
                <span>{meta.flag}</span>
                <span>{curr}</span>
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
        <div className="text-xs text-neutral-500 mt-1 text-center">
          Tasa: 1 {currency} = {currentRate} CUP
          <span
            className={cn(
              "ml-2 font-bold",
              operation === "BUY" ? "text-emerald-400" : "text-amber-400"
            )}
          >
            ({operation === "BUY" ? "Compra" : "Venta"})
          </span>
        </div>
      </div>

      {/* Denomination Filter */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-neutral-500 font-medium">
            Billetes disponibles
          </label>
          <button
            onClick={selectAllDenoms}
            className="text-xs text-emerald-400 hover:text-emerald-300"
          >
            Todos
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {DENOMINATION_OPTIONS.map((denom) => {
            const isActive = selectedDenoms.has(denom);
            return (
              <button
                key={denom}
                onClick={() => toggleDenom(denom)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-bold",
                  "border transition-all duration-200",
                  isActive
                    ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-400"
                    : "bg-neutral-900 border-neutral-800 text-neutral-600 hover:text-neutral-400"
                )}
              >
                {formatNumber(denom)}
              </button>
            );
          })}
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
                @ {currentRate} CUP
              </div>
            </div>

            <ArrowRight
              className={cn(
                "w-6 h-6 shrink-0",
                operation === "BUY" ? "text-emerald-400" : "text-amber-400"
              )}
            />

            <div>
              <div
                className={cn(
                  "text-2xl font-bold tabular-nums money-glow",
                  operation === "BUY" ? "text-emerald-400" : "text-amber-400"
                )}
              >
                {formatNumber(cupAmount)} CUP
              </div>
              <div className="text-xs text-neutral-500">equivalente</div>
            </div>
          </div>
        </div>
      )}

      {/* Bill Breakdown */}
      {breakdown.length > 0 && (
        <div className="bg-neutral-900 rounded-2xl p-4 border border-neutral-800 mb-4">
          <div className="text-xs text-neutral-500 font-bold uppercase tracking-wide mb-3">
            Desglose de Billetes
          </div>
          <div className="space-y-2">
            {breakdown.map(({ denom, count, subtotal }) => (
              <div
                key={denom}
                className="flex items-center justify-between py-2 border-b border-neutral-800 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="w-16 text-lg font-bold text-white tabular-nums">
                    ${formatNumber(denom)}
                  </span>
                  <span className="text-neutral-500">×</span>
                  <span className="text-lg font-bold text-emerald-400 tabular-nums">
                    {count}
                  </span>
                </div>
                <span className="text-neutral-400 tabular-nums">
                  = {formatNumber(subtotal)} CUP
                </span>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-3 pt-3 border-t border-neutral-700 flex items-center justify-between">
            <div className="text-sm text-neutral-500">
              Total:{" "}
              <span className="text-white font-bold">
                {totalBills} billetes
              </span>
            </div>
            {remainder > 0 && (
              <div className="text-sm text-amber-400">
                Resto: {formatNumber(remainder)} CUP
              </div>
            )}
          </div>
        </div>
      )}

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
