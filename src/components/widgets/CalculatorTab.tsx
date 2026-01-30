import { useState, useMemo, useEffect } from "react";
import { useStore } from "@nanostores/react";
import {
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Calculator,
  ArrowDownUp,
} from "lucide-react";
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
  setCalculatorFormState,
  clearCalculatorFormState,
} from "../../stores/calculatorFormStore";
import {
  CURRENCY_META,
  DENOMINATIONS,
  type Currency,
  type Denomination,
} from "../../lib/constants";
import { formatNumber } from "../../lib/formatters";
import { calculateBillBreakdown } from "../../lib/algorithms";
import { cn } from "../../lib/utils";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { useHaptic } from "../../hooks/useHaptic";

// ============================================
// CalculatorTab Component
// 4 modes: Buy, Sell, Compare, Derive
// ============================================

type CalculatorMode = "BUY" | "SELL" | "COMPARE" | "DERIVE";

// Currencies for arbitrage (foreign only)
const ARBITRAGE_CURRENCIES: Currency[] = ["EUR", "USD", "CAD"];

// Default forex rates
const DEFAULT_FOREX_RATES: Record<string, number> = {
  EUR_USD: 1.1,
  USD_EUR: 0.91,
  EUR_CAD: 1.5,
  CAD_EUR: 0.67,
  USD_CAD: 1.36,
  CAD_USD: 0.74,
};

export function CalculatorTab() {
  const buyRates = useStore($buyRates) ?? {};
  const sellRates = useStore($sellRates) ?? {};
  const visibleCurrencies = useStore($visibleCurrencies);
  const visibleDenominations = useStore($visibleDenominations);
  const haptic = useHaptic();

  // Main mode state
  const [mode, setMode] = useState<CalculatorMode>("BUY");

  // === BUY/SELL STATE ===
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [selectedDenoms, setSelectedDenoms] = useState<Set<Denomination>>(
    new Set(DENOMINATIONS),
  );

  // === COMPARE STATE ===
  const [compareAmount, setCompareAmount] = useState<string>("");
  const [sourceCurrency, setSourceCurrency] = useState<Currency>("EUR");
  const [intermediateCurrency, setIntermediateCurrency] =
    useState<Currency>("USD");
  const [forexRate, setForexRate] = useState<string>("1.10");

  // === DERIVE STATE ===
  const [baseCurrency, setBaseCurrency] = useState<Currency>("EUR");
  const [targetCurrency, setTargetCurrency] = useState<Currency>("USD");
  const [baseCupRate, setBaseCupRate] = useState<string>("");
  const [derivedForexRate, setDerivedForexRate] = useState<string>("1.10");

  // Get rate based on operation for BUY/SELL
  const currentRate = getRateForOperation(
    currency,
    mode === "SELL" ? "SELL" : "BUY",
  );

  // BUY/SELL calculation
  const { cupAmount, breakdown, totalBills, remainder } = useMemo(() => {
    const numAmount = parseFloat(amount) || 0;
    const cup = Math.round(numAmount * currentRate);

    if (cup <= 0) {
      return { cupAmount: 0, breakdown: [], totalBills: 0, remainder: 0 };
    }

    const activeDenoms = DENOMINATIONS.filter((d) => selectedDenoms.has(d));
    const result = calculateBillBreakdown(cup, activeDenoms);

    const displayBreakdown = result.breakdown
      .filter((b) => b.count > 0)
      .map((b) => ({
        denom: b.denomination,
        count: b.count,
        subtotal: b.subtotal,
      }));

    return {
      cupAmount: cup,
      breakdown: displayBreakdown,
      totalBills: result.totalBills,
      remainder: result.remainder,
    };
  }, [amount, currentRate, selectedDenoms]);

  // COMPARE calculation
  const compareResult = useMemo(() => {
    const numAmount = parseFloat(compareAmount) || 0;
    const numForexRate = parseFloat(forexRate) || 1;

    if (numAmount <= 0) return null;

    const directRate = buyRates[sourceCurrency] || 0;
    const directCUP = numAmount * directRate;

    const intermediateAmount = numAmount * numForexRate;
    const intermediateRate = buyRates[intermediateCurrency] || 0;
    const indirectCUP = intermediateAmount * intermediateRate;

    const difference = Math.abs(directCUP - indirectCUP);
    const percentDiff =
      indirectCUP > 0
        ? Math.abs((directCUP - indirectCUP) / indirectCUP) * 100
        : 0;
    const directWins = directCUP >= indirectCUP;

    return {
      directCUP,
      indirectCUP,
      intermediateAmount,
      directRate,
      intermediateRate,
      difference,
      percentDiff,
      directWins,
    };
  }, [
    compareAmount,
    sourceCurrency,
    intermediateCurrency,
    forexRate,
    buyRates,
  ]);

  // DERIVE calculation
  const deriveResult = useMemo(() => {
    const numBaseCup = parseFloat(baseCupRate) || 0;
    const numForexRate = parseFloat(derivedForexRate) || 1;

    if (numBaseCup <= 0) return null;

    const derivedCupRate = Math.round(numBaseCup / numForexRate);
    const currentTargetRate = buyRates[targetCurrency] || 0;
    const difference = derivedCupRate - currentTargetRate;
    const percentDiff =
      currentTargetRate > 0 ? (difference / currentTargetRate) * 100 : 0;

    return {
      derivedCupRate,
      currentTargetRate,
      difference,
      percentDiff,
      isMore: difference > 0,
    };
  }, [baseCupRate, derivedForexRate, targetCurrency, buyRates]);

  // Helpers
  const toggleDenom = (denom: Denomination) => {
    haptic.light();
    const newSet = new Set(selectedDenoms);
    if (newSet.has(denom)) {
      if (newSet.size > 1) newSet.delete(denom);
    } else {
      newSet.add(denom);
    }
    setSelectedDenoms(newSet);
  };

  const updateForexRate = (from: Currency, to: Currency, isDerive = false) => {
    const key = `${from}_${to}`;
    const rate = DEFAULT_FOREX_RATES[key] || 1;
    if (isDerive) {
      setDerivedForexRate(rate.toFixed(2));
    } else {
      setForexRate(rate.toFixed(2));
    }
  };

  const handleSwapCompare = () => {
    haptic.light();
    const temp = sourceCurrency;
    setSourceCurrency(intermediateCurrency);
    setIntermediateCurrency(temp);
    updateForexRate(intermediateCurrency, temp);
  };

  const handleSwapDerive = () => {
    haptic.light();
    const temp = baseCurrency;
    setBaseCurrency(targetCurrency);
    setTargetCurrency(temp);
    const newRate = buyRates[targetCurrency] || 0;
    setBaseCupRate(newRate.toString());
    updateForexRate(targetCurrency, temp, true);
  };

  // Mode theme colors
  const modeStyles = {
    BUY: {
      bg: "bg-[var(--status-success-bg)]",
      text: "text-[var(--status-success)]",
      border: "border-[var(--status-success)]/30",
    },
    SELL: {
      bg: "bg-[var(--status-warning-bg)]",
      text: "text-[var(--status-warning)]",
      border: "border-[var(--status-warning)]/30",
    },
    COMPARE: {
      bg: "bg-[var(--purple-bg)]",
      text: "text-[var(--purple)]",
      border: "border-[var(--purple)]/30",
    },
    DERIVE: {
      bg: "bg-[var(--blue-bg)]",
      text: "text-[var(--blue)]",
      border: "border-[var(--blue)]/30",
    },
  };

  // Sync calculator state to store for footer integration
  useEffect(() => {
    if (mode === "BUY" || mode === "SELL") {
      setCalculatorFormState({
        mode,
        resultCUP: cupAmount,
        currency,
        amount: parseFloat(amount) || 0,
        rate: currentRate,
      });
    } else if (mode === "COMPARE" && compareResult) {
      setCalculatorFormState({
        mode: "COMPARE",
        resultCUP: compareResult.directWins
          ? Math.round(compareResult.directCUP)
          : Math.round(compareResult.indirectCUP),
        sourceCurrency,
        intermediateCurrency,
        directWins: compareResult.directWins,
        difference: Math.round(compareResult.difference),
        percentDiff: compareResult.percentDiff,
        compareAmount: parseFloat(compareAmount) || 0,
        forexRate: parseFloat(forexRate) || 1,
      });
    }
  }, [
    mode,
    cupAmount,
    currency,
    amount,
    currentRate,
    compareResult,
    sourceCurrency,
    intermediateCurrency,
  ]);

  // Clear calculator state on unmount
  useEffect(() => {
    return () => clearCalculatorFormState();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 pb-32">
      {/* Mode Selector - Styled like TransactionForm */}
      <div className="mb-4">
        <label className="block text-sm text-[var(--text-faint)] mb-2 font-medium">
          Tipo de cálculo
        </label>
        <div className="flex p-1 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-primary)]">
          {/* BUY */}
          <button
            onClick={() => {
              haptic.light();
              setMode("BUY");
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2",
              "py-2.5 rounded-lg text-sm font-bold",
              "transition-all duration-200",
              mode === "BUY"
                ? "bg-[var(--status-success-bg)] text-[var(--status-success)] border border-[var(--status-success)]/30"
                : "text-[var(--text-faint)] hover:text-[var(--text-secondary)]",
            )}
          >
            <ArrowDownLeft className="w-4 h-4" />
            Compra
          </button>

          {/* SELL */}
          <button
            onClick={() => {
              haptic.light();
              setMode("SELL");
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2",
              "py-2.5 rounded-lg text-sm font-bold",
              "transition-all duration-200",
              mode === "SELL"
                ? "bg-[var(--status-warning-bg)] text-[var(--status-warning)] border border-[var(--status-warning)]/30"
                : "text-[var(--text-faint)] hover:text-[var(--text-secondary)]",
            )}
          >
            <ArrowUpRight className="w-4 h-4" />
            Venta
          </button>

          {/* COMPARE (renamed to Cambio) */}
          <button
            onClick={() => {
              haptic.light();
              setMode("COMPARE");
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2",
              "py-2.5 rounded-lg text-sm font-bold",
              "transition-all duration-200",
              mode === "COMPARE"
                ? "bg-[var(--purple-bg)] text-[var(--purple)] border border-[var(--purple)]/30"
                : "text-[var(--text-faint)] hover:text-[var(--text-secondary)]",
            )}
          >
            <RefreshCw className="w-4 h-4" />
            Cambio
          </button>
        </div>
      </div>

      {/* ==================== BUY/SELL MODE ==================== */}
      {(mode === "BUY" || mode === "SELL") && (
        <>
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
                        ? `${modeStyles[mode].bg} ${modeStyles[mode].border} ${modeStyles[mode].text}`
                        : "bg-[var(--bg-primary)] border-[var(--border-primary)] text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]",
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
                onChange={(e) =>
                  setAmount(e.target.value.replace(/[^0-9.]/g, ""))
                }
                placeholder="0.00"
                className="text-center text-2xl font-bold h-14"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] text-sm font-medium">
                {currency}
              </div>
            </div>
          </div>

          {/* Rate Display */}
          <div className="mb-4 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-faint)]">
                Tasa de {mode === "BUY" ? "compra" : "venta"}
              </span>
              <span className={cn("font-bold", modeStyles[mode].text)}>
                {formatNumber(currentRate)} CUP
              </span>
            </div>
          </div>

          {/* Result */}
          {cupAmount > 0 && (
            <div
              className={cn(
                "p-4 rounded-xl border mb-4",
                modeStyles[mode].bg,
                modeStyles[mode].border,
              )}
            >
              <div className="text-center mb-3">
                <div className="text-xs text-[var(--text-faint)] mb-1">
                  {mode === "BUY" ? "Pagarás" : "Recibirás"}
                </div>
                <div
                  className={cn(
                    "text-3xl font-bold tabular-nums",
                    modeStyles[mode].text,
                  )}
                >
                  {formatNumber(cupAmount)} CUP
                </div>
              </div>

              {/* Bill Breakdown */}
              {breakdown.length > 0 && (
                <div className="p-3 rounded-lg bg-[var(--bg-base)] space-y-1">
                  {breakdown.map(({ denom, count, subtotal }) => (
                    <div
                      key={denom}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--text-muted)]">
                          ${denom}
                        </span>
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
                  {remainder > 0 && (
                    <div className="text-xs text-[var(--status-warning)] text-right pt-1">
                      +{formatNumber(remainder)} suelto
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Denomination Filter */}
          <div className="mb-4">
            <label className="block text-xs text-[var(--text-faint)] mb-2 font-medium">
              Billetes a usar
            </label>
            <div className="flex flex-wrap gap-1.5">
              {visibleDenominations.map((denom) => (
                <button
                  key={denom}
                  onClick={() => toggleDenom(denom)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all",
                    selectedDenoms.has(denom)
                      ? "bg-[var(--accent-bg)] border-[var(--accent)]/50 text-[var(--accent)]"
                      : "bg-[var(--bg-primary)] border-[var(--border-primary)] text-[var(--text-faint)]",
                  )}
                >
                  ${denom}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ==================== COMPARE MODE ==================== */}
      {mode === "COMPARE" && (
        <div className="space-y-4">
          {/* Currency Pair Selection - Mobile-First Stacked Layout */}
          <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] space-y-3">
            {/* Source Currency - Row 1 */}
            <div>
              <label className="block text-[10px] text-[var(--text-faint)] font-medium mb-1.5 uppercase tracking-wider">
                Moneda origen
              </label>
              <div className="grid grid-cols-3 gap-2">
                {ARBITRAGE_CURRENCIES.map((curr) => (
                  <button
                    key={`src-${curr}`}
                    onClick={() => {
                      haptic.light();
                      if (curr === intermediateCurrency) {
                        setIntermediateCurrency(sourceCurrency);
                      }
                      setSourceCurrency(curr);
                      updateForexRate(
                        curr,
                        curr === intermediateCurrency
                          ? sourceCurrency
                          : intermediateCurrency,
                      );
                    }}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold border transition-all",
                      sourceCurrency === curr
                        ? "bg-[var(--purple-bg)] border-[var(--purple)] text-[var(--purple)] shadow-sm"
                        : "bg-[var(--bg-primary)] border-[var(--border-primary)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]",
                    )}
                  >
                    <span className="text-base">
                      {CURRENCY_META[curr].flag}
                    </span>
                    <span>{curr}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Exchange Rate + Swap - Center Row */}
            <div className="flex items-center justify-center gap-3 py-1">
              <div className="flex-1 h-px bg-[var(--border-primary)]" />
              <button
                onClick={handleSwapCompare}
                aria-label="Intercambiar monedas"
                className="p-2 rounded-full bg-[var(--bg-primary)] text-[var(--accent)] hover:bg-[var(--bg-hover)] border border-[var(--border-primary)] shadow-sm"
              >
                <ArrowDownUp size={16} />
              </button>
              <div className="flex items-center gap-1.5 bg-[var(--bg-primary)] px-2 py-1 rounded-lg border border-[var(--border-primary)]">
                <span className="text-[10px] text-[var(--text-faint)]">
                  {sourceCurrency}/{intermediateCurrency}
                </span>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={forexRate}
                  onChange={(e) =>
                    setForexRate(e.target.value.replace(/[^0-9.]/g, ""))
                  }
                  className="w-20 text-center text-sm font-bold py-0.5 h-7 border-0 bg-transparent"
                />
              </div>
              <div className="flex-1 h-px bg-[var(--border-primary)]" />
            </div>

            {/* Target Currency - Row 2 */}
            <div>
              <label className="block text-[10px] text-[var(--text-faint)] font-medium mb-1.5 uppercase tracking-wider">
                Convertir vía
              </label>
              <div className="grid grid-cols-3 gap-2">
                {ARBITRAGE_CURRENCIES.map((curr) => (
                  <button
                    key={`int-${curr}`}
                    onClick={() => {
                      haptic.light();
                      if (curr === sourceCurrency) {
                        setSourceCurrency(intermediateCurrency);
                      }
                      setIntermediateCurrency(curr);
                      updateForexRate(
                        curr === sourceCurrency
                          ? intermediateCurrency
                          : sourceCurrency,
                        curr,
                      );
                    }}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold border transition-all",
                      intermediateCurrency === curr
                        ? "bg-[var(--blue-bg)] border-[var(--blue)] text-[var(--blue)] shadow-sm"
                        : "bg-[var(--bg-primary)] border-[var(--border-primary)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]",
                    )}
                  >
                    <span className="text-base">
                      {CURRENCY_META[curr].flag}
                    </span>
                    <span>{curr}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs text-[var(--text-faint)] mb-1.5 font-medium">
              Cantidad en {sourceCurrency}
            </label>
            <Input
              type="text"
              inputMode="decimal"
              value={compareAmount}
              onChange={(e) =>
                setCompareAmount(e.target.value.replace(/[^0-9.]/g, ""))
              }
              placeholder="100"
              className="text-center text-lg font-bold"
            />
          </div>

          {/* Results */}
          {compareResult && parseFloat(compareAmount) > 0 && (
            <div className="space-y-2">
              {/* Direct */}
              <div
                className={cn(
                  "p-3 rounded-xl border flex items-center justify-between",
                  compareResult.directWins
                    ? "bg-[var(--purple-bg)]/50 border-[var(--purple)]/50"
                    : "bg-[var(--bg-secondary)] border-[var(--border-primary)]",
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm font-bold",
                      compareResult.directWins
                        ? "text-[var(--purple)]"
                        : "text-[var(--text-muted)]",
                    )}
                  >
                    {sourceCurrency} → CUP
                  </span>
                  {compareResult.directWins && (
                    <span className="text-[10px] bg-[var(--purple)] text-white px-1.5 py-0.5 rounded font-bold">
                      MEJOR
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "font-bold tabular-nums",
                    compareResult.directWins
                      ? "text-[var(--purple)]"
                      : "text-[var(--text-muted)]",
                  )}
                >
                  {formatNumber(Math.round(compareResult.directCUP))} CUP
                </span>
              </div>

              {/* Indirect */}
              <div
                className={cn(
                  "p-3 rounded-xl border flex items-center justify-between",
                  !compareResult.directWins
                    ? "bg-[var(--blue-bg)]/50 border-[var(--blue)]/50"
                    : "bg-[var(--bg-secondary)] border-[var(--border-primary)]",
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm font-bold",
                      !compareResult.directWins
                        ? "text-[var(--blue)]"
                        : "text-[var(--text-muted)]",
                    )}
                  >
                    {sourceCurrency} → {intermediateCurrency} → CUP
                  </span>
                  {!compareResult.directWins && (
                    <span className="text-[10px] bg-[var(--blue)] text-white px-1.5 py-0.5 rounded font-bold">
                      MEJOR
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "font-bold tabular-nums",
                    !compareResult.directWins
                      ? "text-[var(--blue)]"
                      : "text-[var(--text-muted)]",
                  )}
                >
                  {formatNumber(Math.round(compareResult.indirectCUP))} CUP
                </span>
              </div>

              {/* Difference */}
              <div
                className={cn(
                  "p-2 rounded-lg text-center text-sm font-bold",
                  compareResult.directWins
                    ? "bg-[var(--purple-bg)] text-[var(--purple)]"
                    : "bg-[var(--blue-bg)] text-[var(--blue)]",
                )}
              >
                +{formatNumber(Math.round(compareResult.difference))} CUP (
                {compareResult.percentDiff.toFixed(1)}%)
              </div>

              {/* Derived Cost Info */}
              {/* Derived Cost Info - Smart Breakdown */}
              <div className="bg-[var(--bg-secondary)] rounded-xl p-3 border border-[var(--border-primary)] mt-2">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator size={14} className="text-[var(--accent)]" />
                  <span className="text-xs font-bold text-[var(--text-faint)] uppercase tracking-wider">
                    Análisis de Tasa Implícita
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  {/* Step 1: Definition */}
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-muted)]">
                      Valor real de 1 {sourceCurrency}:
                    </span>
                    <span className="font-medium text-[var(--text-primary)]">
                      {formatNumber(compareResult.directRate)} CUP
                    </span>
                  </div>

                  {/* Step 2: Forex */}
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-muted)]">
                      Tasa de cambio aplicada:
                    </span>
                    <span className="font-medium text-[var(--text-primary)]">
                      {forexRate} {intermediateCurrency}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-[var(--border-primary)]/50 my-1" />

                  {/* Step 3: Result */}
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col text-xs text-[var(--text-muted)]">
                      <span>Costo derivado:</span>
                      <span className="opacity-50 font-mono">
                        {compareResult.directRate} ÷ {forexRate}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-[var(--text-faint)] font-medium mr-2">
                        1 {intermediateCurrency} =
                      </span>
                      <span className="text-lg font-bold text-[var(--blue)]">
                        {formatNumber(
                          Math.round(
                            compareResult.directRate /
                              parseFloat(forexRate || "1"),
                          ),
                        )}{" "}
                        CUP
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
