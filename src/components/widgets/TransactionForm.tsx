import { useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import { ArrowDownLeft, ArrowUpRight, Check } from "lucide-react";
import { $pendingCUP, clearPendingCUP } from "../../stores/uiStore";
import { $effectiveRates } from "../../stores/ratesStore";
import {
  saveTransaction,
  type OperationType,
  type TransactionCurrency,
} from "../../stores/historyStore";
import { useToast } from "../ui/Toast";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import {
  CURRENCIES,
  CURRENCY_META,
  CASH_CURRENCIES,
  DIGITAL_CURRENCIES,
  type Currency,
} from "../../lib/constants";
import { formatNumber } from "../../lib/formatters";

// ============================================
// TransactionForm Component
// Dedicated form for recording operations with 6 currencies
// ============================================

export function TransactionForm() {
  const pendingCUP = useStore($pendingCUP);
  const rates = useStore($effectiveRates);
  const { toast } = useToast();

  // Form State
  const [operation, setOperation] = useState<OperationType>("BUY");
  const [currency, setCurrency] = useState<TransactionCurrency>("USD");
  const [amountForeign, setAmountForeign] = useState<string>("");
  const [rate, setRate] = useState<string>("");
  const [totalCUP, setTotalCUP] = useState<string>("");

  // Initial load handling
  useEffect(() => {
    if (pendingCUP !== null) {
      setOperation("BUY");
      setTotalCUP(pendingCUP.toString());

      const currentRate = rates[currency] || 320;
      setRate(currentRate.toString());
      const foreign = pendingCUP / currentRate;
      setAmountForeign(foreign.toFixed(2));

      clearPendingCUP();
    } else if (!rate) {
      const r = rates[currency] || 320;
      setRate(r.toString());
    }
  }, [pendingCUP]);

  // Handle currency change
  const handleCurrencyChange = (newCurr: TransactionCurrency) => {
    setCurrency(newCurr);
    const newRate = rates[newCurr] || 300;
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

    saveTransaction(operation, currency, foreign, r, cup);

    toast.success("Operación registrada exitosamente");

    // Reset form
    setAmountForeign("");
    setTotalCUP("");
  };

  // Theme colors based on operation
  const theme =
    operation === "BUY"
      ? {
          text: "text-emerald-400",
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/20",
          input: "focus:border-emerald-500 focus:ring-emerald-500/20",
        }
      : {
          text: "text-amber-400",
          bg: "bg-amber-500/10",
          border: "border-amber-500/20",
          input: "focus:border-amber-500 focus:ring-amber-500/20",
        };

  return (
    <div className="flex flex-col h-full bg-neutral-950 p-4 overflow-y-auto pb-32">
      {/* Segmented Control */}
      <div className="flex p-1 bg-neutral-900 rounded-xl mb-6 border border-neutral-800">
        <button
          onClick={() => setOperation("BUY")}
          className={cn(
            "flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all duration-200",
            "flex items-center justify-center gap-2",
            operation === "BUY"
              ? "bg-neutral-800 text-emerald-400 shadow-lg"
              : "text-neutral-500 hover:text-neutral-300"
          )}
        >
          <ArrowDownLeft className="w-4 h-4" />
          COMPRAR (Entra Divisa)
        </button>
        <button
          onClick={() => setOperation("SELL")}
          className={cn(
            "flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all duration-200",
            "flex items-center justify-center gap-2",
            operation === "SELL"
              ? "bg-neutral-800 text-amber-400 shadow-lg"
              : "text-neutral-500 hover:text-neutral-300"
          )}
        >
          <ArrowUpRight className="w-4 h-4" />
          VENDER (Sale Divisa)
        </button>
      </div>

      {/* Currency Selector - 3x2 Grid */}
      <div className="mb-6">
        <label className="block text-xs text-neutral-500 font-medium mb-2 uppercase tracking-wide">
          Moneda
        </label>
        <div className="grid grid-cols-3 gap-2">
          {CURRENCIES.map((currencyCode) => {
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
                        "border-opacity-50"
                      )
                    : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                )}
              >
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-lg">{meta.flag}</span>
                  {isDigital && (
                    <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-purple-500/20 text-purple-400">
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
          theme.border
        )}
      >
        {/* Foreign Amount */}
        <div>
          <label
            className={cn(
              "block text-xs font-medium mb-1.5 uppercase tracking-wide",
              theme.text
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
                theme.input
              )}
              placeholder="0.00"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold text-sm">
              {currency}
            </span>
          </div>
        </div>

        {/* Exchange Rate */}
        <div>
          <label className="block text-xs text-neutral-500 font-medium mb-1.5 uppercase tracking-wide">
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
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 text-xs">
              CUP/1{currency}
            </div>
          </div>
        </div>

        {/* Total CUP */}
        <div>
          <label className="block text-xs text-neutral-500 font-medium mb-1.5 uppercase tracking-wide">
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
                theme.input
              )}
              placeholder="0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold text-sm">
              CUP
            </span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        size="lg"
        onClick={handleSubmit}
        className={cn(
          "w-full font-bold text-lg shadow-xl",
          operation === "BUY"
            ? "bg-emerald-500 hover:bg-emerald-600"
            : "bg-amber-500 hover:bg-amber-600"
        )}
      >
        <Check className="w-6 h-6 mr-2" />
        {operation === "BUY" ? "Registrar Compra" : "Registrar Venta"}
      </Button>
    </div>
  );
}
