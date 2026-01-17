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
// Theme-aware using CSS variables
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
    new Set(DENOMINATIONS),
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
        <label className="block text-sm text-[var(--text-faint)] mb-2 font-medium">
          Tipo de operación
        </label>
        <div className="flex p-1 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-primary)]">
          <button
            onClick={() => {
              haptic.light();
              setOperation("BUY");
            }}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200",
              "flex items-center justify-center gap-2",
              operation === "BUY"
                ? "bg-[var(--bg-secondary)] text-[var(--status-success)] shadow-lg"
                : "text-[var(--text-faint)] hover:text-[var(--text-secondary)]",
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
                ? "bg-[var(--bg-secondary)] text-[var(--status-warning)] shadow-lg"
                : "text-[var(--text-faint)] hover:text-[var(--text-secondary)]",
            )}
          >
            <ArrowUpRight size={16} />
            Venta
          </button>
        </div>
      </div>

      {/* Currency Selector */}
      <div className="mb-4">
        <label className="block text-sm text-[var(--text-faint)] mb-2 font-medium">
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
                      ? "bg-[var(--status-success-bg)] border-[var(--status-success)]/50 text-[var(--status-success)]"
                      : "bg-[var(--status-warning-bg)] border-[var(--status-warning)]/50 text-[var(--status-warning)]"
                    : "bg-[var(--bg-primary)] border-[var(--border-primary)] text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:border-[var(--border-secondary)]",
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
        <label className="block text-sm text-[var(--text-faint)] mb-2 font-medium">
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
              operation === "BUY"
                ? "text-[var(--status-success)]"
                : "text-[var(--status-warning)]",
            )}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)] text-sm font-medium">
            {currency}
          </div>
        </div>
      </div>

      {/* Rate Display */}
      <div className="flex items-center justify-between px-3 py-2 mb-4 bg-[var(--bg-primary)]/50 rounded-xl border border-[var(--border-primary)]">
        <span className="text-sm text-[var(--text-faint)]">Tasa aplicada</span>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-lg font-bold tabular-nums",
              operation === "BUY"
                ? "text-[var(--status-success)]"
                : "text-[var(--status-warning)]",
            )}
          >
            {currentRate}
          </span>
          <span className="text-[var(--text-faint)] text-sm">CUP</span>
        </div>
      </div>

      {/* CUP Result */}
      {cupAmount > 0 && (
        <div className="mb-4 p-4 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-primary)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[var(--text-faint)]">
              Total en CUP
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
                {formatNumber(cupAmount)}
              </span>
              <span className="text-[var(--text-muted)]">CUP</span>
            </div>
          </div>

          {/* Denomination Filter */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[var(--text-faint)]">
                Billetes a usar:
              </span>
              {selectedDenoms.size < DENOMINATIONS.length && (
                <button
                  onClick={selectAllDenoms}
                  className="text-xs text-[var(--blue)] hover:text-[var(--blue)]"
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
                        ? "bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-muted)]"
                        : "bg-[var(--bg-secondary)]/50 text-[var(--text-faint)] border border-[var(--border-secondary)]",
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
            <div className="space-y-1.5 pt-3 border-t border-[var(--border-primary)]">
              {breakdown.map(({ denom, count, subtotal }) => (
                <div
                  key={denom}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-muted)]">${denom}</span>
                    <span className="text-[var(--text-faint)]">×</span>
                    <span className="font-bold text-[var(--text-primary)]">
                      {count}
                    </span>
                  </div>
                  <span className="text-[var(--text-muted)] tabular-nums">
                    {formatNumber(subtotal)}
                  </span>
                </div>
              ))}

              {/* Summary row */}
              <div className="flex items-center justify-between pt-2 mt-2 border-t border-[var(--border-primary)]">
                <span className="text-xs text-[var(--text-faint)]">
                  {totalBills} billete{totalBills !== 1 ? "s" : ""}
                </span>
                {remainder > 0 && (
                  <span className="text-xs text-[var(--status-warning)]">
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
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--bg-primary)] flex items-center justify-center">
            <ArrowRight className="w-8 h-8 text-[var(--text-faint)]" />
          </div>
          <p className="text-[var(--text-faint)] text-sm">
            Ingresa una cantidad para calcular
          </p>
        </div>
      )}
    </div>
  );
}
