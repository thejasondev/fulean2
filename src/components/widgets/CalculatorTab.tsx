import { useState, useMemo } from "react";
import { useStore } from "@nanostores/react";
import { ArrowRight, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import {
  $buyRates,
  $sellRates,
  getRateForOperation,
} from "../../stores/ratesStore";
import {
  $visibleCurrencies,
  $visibleDenominations,
} from "../../stores/visibilityStore";
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
  const visibleCurrencies = useStore($visibleCurrencies);
  const visibleDenominations = useStore($visibleDenominations);
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
    let billCount = 0;

    for (const denom of activeDenoms) {
      if (remaining >= denom) {
        const count = Math.floor(remaining / denom);
        const subtotal = count * denom;
        result.push({ denom, count, subtotal });
        remaining -= subtotal;
        billCount += count;
      }
    }

    return {
      cupAmount: cup,
      breakdown: result,
      totalBills: billCount,
      remainder: remaining,
    };
  }, [amount, currentRate, selectedDenoms]);

  // Toggle denomination filter
  const toggleDenom = (denom: Denomination) => {
    haptic.light();
    const newSet = new Set(selectedDenoms);
    if (newSet.has(denom)) {
      // Don't allow deselecting all
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
            <ArrowDownLeft size={16} />
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
            <ArrowUpRight size={16} />
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
          {visibleCurrencies.map((curr) => {
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
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9.]/g, "");
              setAmount(val);
            }}
            placeholder="0.00"
            size="lg"
            className={cn(
              "text-center text-2xl font-bold",
              operation === "BUY" ? "text-emerald-400" : "text-amber-400"
            )}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-medium">
            {currency}
          </div>
        </div>
      </div>

      {/* Rate Display */}
      <div className="flex items-center justify-between px-3 py-2 mb-4 bg-neutral-900/50 rounded-xl border border-neutral-800">
        <span className="text-sm text-neutral-500">Tasa aplicada</span>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-lg font-bold tabular-nums",
              operation === "BUY" ? "text-emerald-400" : "text-amber-400"
            )}
          >
            {currentRate}
          </span>
          <span className="text-neutral-500 text-sm">CUP</span>
        </div>
      </div>

      {/* CUP Result */}
      {cupAmount > 0 && (
        <div className="mb-4 p-4 bg-neutral-900 rounded-2xl border border-neutral-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-neutral-500">Total en CUP</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white tabular-nums">
                {formatNumber(cupAmount)}
              </span>
              <span className="text-neutral-400">CUP</span>
            </div>
          </div>

          {/* Denomination Filter */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-neutral-500">Billetes a usar:</span>
              {selectedDenoms.size < DENOMINATIONS.length && (
                <button
                  onClick={selectAllDenoms}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Todos
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DENOMINATION_OPTIONS.map((denom) => {
                const isSelected = selectedDenoms.has(denom);
                return (
                  <button
                    key={denom}
                    onClick={() => toggleDenom(denom)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                      isSelected
                        ? "bg-white/10 text-white border border-white/20"
                        : "bg-neutral-800/50 text-neutral-500 border border-neutral-700"
                    )}
                  >
                    {denom}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Breakdown */}
          {breakdown.length > 0 && (
            <div className="space-y-1.5 pt-3 border-t border-neutral-800">
              {breakdown.map(({ denom, count, subtotal }) => (
                <div
                  key={denom}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-400">${denom}</span>
                    <span className="text-neutral-600">×</span>
                    <span className="font-bold text-white">{count}</span>
                  </div>
                  <span className="text-neutral-400 tabular-nums">
                    {formatNumber(subtotal)}
                  </span>
                </div>
              ))}

              {/* Summary row */}
              <div className="flex items-center justify-between pt-2 mt-2 border-t border-neutral-800">
                <span className="text-xs text-neutral-500">
                  {totalBills} billete{totalBills !== 1 ? "s" : ""}
                </span>
                {remainder > 0 && (
                  <span className="text-xs text-amber-400">
                    +{formatNumber(remainder)} suelto
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {cupAmount === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neutral-900 flex items-center justify-center">
            <ArrowRight className="w-8 h-8 text-neutral-600" />
          </div>
          <p className="text-neutral-500 text-sm">
            Ingresa una cantidad para calcular
          </p>
        </div>
      )}
    </div>
  );
}
