import { useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import { ArrowDownLeft, ArrowUpRight, Check, Eye } from "lucide-react";
import {
  $pendingCUP,
  clearPendingCUP,
  openClientView,
  goToCounter,
} from "../../stores/uiStore";
import { clearAll } from "../../stores/counterStore";
import { recordCapitalMovement } from "../../stores/capitalStore";
import {
  $buyRates,
  $sellRates,
  getRateForOperation,
  calculateProfit,
} from "../../stores/ratesStore";
import {
  saveTransaction,
  type OperationType,
  type TransactionCurrency,
} from "../../stores/historyStore";
import { useToast } from "../ui/Toast";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { $visibleCurrencies } from "../../stores/visibilityStore";
import { CURRENCIES, CURRENCY_META, type Currency } from "../../lib/constants";
import { formatNumber } from "../../lib/formatters";
import { useHaptic } from "../../hooks/useHaptic";

// ============================================
// TransactionForm Component
// Uses Buy/Sell rates based on operation type
// Theme-aware using CSS variables
// ============================================

export function TransactionForm() {
  const pendingCUP = useStore($pendingCUP);
  const buyRates = useStore($buyRates);
  const sellRates = useStore($sellRates);
  const visibleCurrencies = useStore($visibleCurrencies);
  const { toast } = useToast();
  const haptic = useHaptic();

  // Form State
  const [operation, setOperation] = useState<OperationType>("BUY");
  const [currency, setCurrency] = useState<TransactionCurrency>("USD");
  const [amountForeign, setAmountForeign] = useState<string>("");
  const [rate, setRate] = useState<string>("");
  const [totalCUP, setTotalCUP] = useState<string>("");

  // Get the appropriate rate based on operation
  const getRate = (curr: Currency, op: OperationType) => {
    return getRateForOperation(curr, op);
  };

  // Calculate projected profit
  const foreignAmount = parseFloat(amountForeign) || 0;
  const profit = calculateProfit(currency as Currency, foreignAmount);

  // Initial load handling
  useEffect(() => {
    if (pendingCUP !== null) {
      setOperation("BUY");
      setTotalCUP(pendingCUP.toString());

      const currentRate = getRate(currency as Currency, "BUY");
      setRate(currentRate.toString());
      const foreign = pendingCUP / currentRate;
      setAmountForeign(foreign.toFixed(2));

      clearPendingCUP();
    } else if (!rate) {
      const r = getRate(currency as Currency, operation);
      setRate(r.toString());
    }
  }, [pendingCUP]);

  // Update rate when operation changes
  useEffect(() => {
    const newRate = getRate(currency as Currency, operation);
    setRate(newRate.toString());

    if (amountForeign) {
      const foreign = parseFloat(amountForeign) || 0;
      setTotalCUP(Math.round(foreign * newRate).toString());
    }
  }, [operation]);

  // Handle currency change
  const handleCurrencyChange = (newCurr: TransactionCurrency) => {
    setCurrency(newCurr);
    const newRate = getRate(newCurr as Currency, operation);
    setRate(newRate.toString());

    if (amountForeign) {
      const foreign = parseFloat(amountForeign) || 0;
      setTotalCUP(Math.round(foreign * newRate).toString());
    }
  };

  // Handlers for bi-directional math
  const handleForeignChange = (val: string) => {
    setAmountForeign(val);
    const foreign = parseFloat(val) || 0;
    const r = parseFloat(rate) || 0;
    if (r > 0) {
      setTotalCUP(Math.round(foreign * r).toString());
    }
  };

  const handleRateChange = (val: string) => {
    setRate(val);
    const r = parseFloat(val) || 0;
    const foreign = parseFloat(amountForeign) || 0;
    if (foreign > 0) {
      setTotalCUP(Math.round(foreign * r).toString());
    }
  };

  const handleCUPChange = (val: string) => {
    setTotalCUP(val);
    const cup = parseFloat(val) || 0;
    const r = parseFloat(rate) || 0;
    if (r > 0 && cup > 0) {
      setAmountForeign((cup / r).toFixed(2));
    }
  };

  const handleSubmit = () => {
    const foreign = parseFloat(amountForeign);
    const r = parseFloat(rate);
    const cup = parseFloat(totalCUP);

    if (!foreign || !r || !cup) {
      toast.warning("Complete todos los campos");
      return;
    }

    // Calculate spread for profit tracking
    const buyRate = buyRates[currency] ?? 0;
    const sellRate = sellRates[currency] ?? 0;
    const spread = sellRate - buyRate;

    // Save transaction with spread for profit calculation
    const txn = saveTransaction(operation, currency, foreign, r, cup, spread);

    // Record capital movement
    recordCapitalMovement(operation === "BUY" ? "OUT" : "IN", cup, txn.id);

    // Clear the counter (reset bill counts to 0)
    clearAll();

    toast.success("Operación registrada exitosamente");

    // Reset form
    setAmountForeign("");
    setTotalCUP("");

    // Navigate back to counter tab
    goToCounter();
  };

  // Theme colors based on operation
  const theme =
    operation === "BUY"
      ? {
          text: "text-[var(--status-success)]",
          bg: "bg-[var(--status-success-bg)]",
          border: "border-[var(--status-success)]/20",
          input:
            "focus:border-[var(--status-success)] focus:ring-[var(--status-success)]/20",
        }
      : {
          text: "text-[var(--status-warning)]",
          bg: "bg-[var(--status-warning-bg)]",
          border: "border-[var(--status-warning)]/20",
          input:
            "focus:border-[var(--status-warning)] focus:ring-[var(--status-warning)]/20",
        };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-base)] p-4 overflow-y-auto pb-32">
      <label className="block text-sm text-[var(--text-faint)] mb-2 font-medium">
        Tipo de operación
      </label>
      {/* Segmented Control */}
      <div className="flex p-1 bg-[var(--bg-primary)] rounded-xl mb-6 border border-[var(--border-primary)]">
        <button
          onClick={() => setOperation("BUY")}
          className={cn(
            "flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all duration-200",
            "flex items-center justify-center gap-2",
            operation === "BUY"
              ? "bg-[var(--bg-secondary)] text-[var(--status-success)] shadow-lg"
              : "text-[var(--text-faint)] hover:text-[var(--text-secondary)]",
          )}
        >
          <ArrowDownLeft className="w-4 h-4" />
          Compra
        </button>
        <button
          onClick={() => setOperation("SELL")}
          className={cn(
            "flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all duration-200",
            "flex items-center justify-center gap-2",
            operation === "SELL"
              ? "bg-[var(--bg-secondary)] text-[var(--status-warning)] shadow-lg"
              : "text-[var(--text-faint)] hover:text-[var(--text-secondary)]",
          )}
        >
          <ArrowUpRight className="w-4 h-4" />
          Venta
        </button>
      </div>

      {/* Currency Selector - Grid */}
      <div className="mb-6">
        <label className="block text-sm text-[var(--text-faint)] mb-2 font-medium">
          Moneda
        </label>
        <div className="grid grid-cols-3 gap-2">
          {visibleCurrencies.map((currencyCode) => {
            const meta = CURRENCY_META[currencyCode];
            const isSelected = currency === currencyCode;
            const isDigital = meta.category === "digital";

            return (
              <button
                key={currencyCode}
                onClick={() =>
                  handleCurrencyChange(currencyCode as TransactionCurrency)
                }
                className={cn(
                  "flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all duration-200",
                  isSelected
                    ? cn(
                        theme.bg,
                        theme.border,
                        theme.text,
                        "border-opacity-50",
                      )
                    : "bg-[var(--bg-primary)] border-[var(--border-primary)] text-[var(--text-muted)] hover:border-[var(--border-secondary)]",
                )}
              >
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-lg">{meta.flag}</span>
                  {isDigital && (
                    <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-[var(--purple-bg)] text-[var(--purple)]">
                      DIG
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold">{currencyCode}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Inputs */}
      <div
        className={cn(
          "space-y-4 p-5 rounded-2xl border mb-6",
          theme.bg,
          theme.border,
        )}
      >
        {/* Foreign Amount */}
        <div>
          <label
            className={cn(
              "block text-xs font-medium mb-1.5 uppercase tracking-wide",
              theme.text,
            )}
          >
            Monto ({currency})
          </label>
          <div className="relative">
            <Input
              type="number"
              inputMode="decimal"
              value={amountForeign}
              onChange={(e) => handleForeignChange(e.target.value)}
              className={cn(
                "text-lg font-bold tabular-nums pr-12",
                theme.input,
              )}
              placeholder="0.00"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)] font-bold text-sm">
              {currency}
            </span>
          </div>
        </div>

        {/* Exchange Rate */}
        <div>
          <label className="block text-xs text-[var(--text-faint)] font-medium mb-1.5 uppercase tracking-wide">
            Tasa de cambio
          </label>
          <div className="relative">
            <Input
              type="number"
              inputMode="decimal"
              value={rate}
              onChange={(e) => handleRateChange(e.target.value)}
              className="text-lg font-bold tabular-nums pr-12 text-center"
              placeholder="0"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)] text-xs">
              CUP/1{currency}
            </div>
          </div>
        </div>

        {/* Total CUP */}
        <div>
          <label className="block text-xs text-[var(--text-faint)] font-medium mb-1.5 uppercase tracking-wide">
            Total a pagar/recibir
          </label>
          <div className="relative">
            <Input
              type="number"
              inputMode="numeric"
              value={totalCUP}
              onChange={(e) => handleCUPChange(e.target.value)}
              className={cn(
                "text-2xl font-bold tabular-nums pr-12",
                theme.text,
                theme.input,
              )}
              placeholder="0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)] font-bold text-sm">
              CUP
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {/* Show to Client Button */}
        {foreignAmount > 0 && parseFloat(totalCUP) > 0 && (
          <Button
            variant="secondary"
            size="lg"
            onClick={() => {
              haptic.medium();
              openClientView({
                foreignAmount,
                foreignCurrency: currency,
                cupAmount: parseFloat(totalCUP),
                rate: parseFloat(rate),
                operation,
              });
            }}
            className="flex-1 font-bold"
          >
            <Eye className="w-5 h-5 mr-2" />
            Mostrar
          </Button>
        )}

        {/* Submit Button */}
        <Button
          size="lg"
          onClick={handleSubmit}
          className={cn(
            "flex-1 font-bold text-lg shadow-xl",
            operation === "BUY"
              ? "bg-[var(--accent)] hover:bg-[var(--accent-hover)]"
              : "bg-[var(--status-warning)] hover:opacity-90",
          )}
        >
          <Check className="w-6 h-6 mr-2" />
          Registrar
        </Button>
      </div>
    </div>
  );
}
