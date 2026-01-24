import { useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Check,
  Eye,
} from "lucide-react";
import { $pendingCUP, clearPendingCUP, goToOperar } from "../../stores/uiStore";
import {
  setTransactionFormState,
  clearTransactionFormState,
  registerSubmitCallback,
  unregisterSubmitCallback,
} from "../../stores/transactionFormStore";
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
  saveExchangeTransaction,
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
import {
  $activeWallets,
  $activeWalletId,
  $defaultWalletId,
  switchWallet,
  getWalletColorHex,
} from "../../stores/walletStore";
import { Wallet } from "lucide-react";

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

  // Exchange-specific state
  const [fromCurrency, setFromCurrency] = useState<TransactionCurrency>("EUR");
  const [toCurrency, setToCurrency] = useState<TransactionCurrency>("USD");
  const [exchangeRate, setExchangeRate] = useState<string>("1.10");
  const [exchangeAmount, setExchangeAmount] = useState<string>("");

  // Wallet selection (for multi-wallet users)
  const activeWallets = useStore($activeWallets);
  const activeWalletId = useStore($activeWalletId);
  const defaultWalletId = useStore($defaultWalletId);
  const showWalletSelector = activeWallets.length > 1;
  const targetWalletId = activeWalletId || defaultWalletId || undefined;

  // Optional note for transaction
  const [transactionNote, setTransactionNote] = useState<string>("");

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

  // Update rate when operation, currency, or global rates change
  useEffect(() => {
    const newRate = getRate(currency as Currency, operation);
    setRate(newRate.toString());

    if (amountForeign) {
      const foreign = parseFloat(amountForeign) || 0;
      setTotalCUP(Math.round(foreign * newRate).toString());
    }
  }, [operation, currency, buyRates, sellRates]);

  // Sync form state to transactionFormStore for footer integration
  useEffect(() => {
    const foreignAmount = parseFloat(amountForeign) || 0;
    const rateNum = parseFloat(rate) || 0;
    const cupAmount = parseFloat(totalCUP) || 0;
    const exchRate = parseFloat(exchangeRate) || 0;
    const exchAmount = parseFloat(exchangeAmount) || 0;
    const amountReceived = Math.round(exchAmount * exchRate * 100) / 100;

    setTransactionFormState({
      operation,
      amount: operation === "EXCHANGE" ? exchAmount : foreignAmount,
      currency,
      rate: rateNum,
      totalCUP: cupAmount,
      isValid:
        operation === "EXCHANGE"
          ? exchAmount > 0 && exchRate > 0 && fromCurrency !== toCurrency
          : foreignAmount > 0 && rateNum > 0 && cupAmount > 0,
      walletId: targetWalletId,
      // Exchange-specific
      fromCurrency: operation === "EXCHANGE" ? fromCurrency : undefined,
      toCurrency: operation === "EXCHANGE" ? toCurrency : undefined,
      exchangeRate: operation === "EXCHANGE" ? exchRate : undefined,
      amountReceived: operation === "EXCHANGE" ? amountReceived : undefined,
    });
  }, [
    operation,
    amountForeign,
    currency,
    rate,
    totalCUP,
    targetWalletId,
    fromCurrency,
    toCurrency,
    exchangeRate,
    exchangeAmount,
  ]);

  // Register submit callback for footer button
  useEffect(() => {
    registerSubmitCallback(handleSubmit);
    return () => unregisterSubmitCallback();
  }, [
    operation,
    amountForeign,
    rate,
    totalCUP,
    currency,
    targetWalletId,
    exchangeAmount,
    exchangeRate,
    fromCurrency,
    toCurrency,
  ]);

  // Clear form state when unmounting
  useEffect(() => {
    return () => clearTransactionFormState();
  }, []);

  // Handle currency change
  const handleCurrencyChange = (newCurr: TransactionCurrency) => {
    setCurrency(newCurr);
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
    // Handle EXCHANGE operation
    if (operation === "EXCHANGE") {
      const amount = parseFloat(exchangeAmount);
      const exchRate = parseFloat(exchangeRate);

      if (!amount || !exchRate) {
        toast.warning("Complete todos los campos");
        return;
      }

      if (fromCurrency === toCurrency) {
        toast.warning("Seleccione monedas diferentes");
        return;
      }

      saveExchangeTransaction(
        fromCurrency,
        toCurrency,
        amount,
        exchRate,
        targetWalletId,
        transactionNote,
      );
      toast.success(
        `Cambio registrado: ${amount} ${fromCurrency} → ${(amount * exchRate).toFixed(2)} ${toCurrency}`,
      );

      // Reset form
      setExchangeAmount("");
      setTransactionNote("");
      goToOperar();
      return;
    }

    // Handle BUY/SELL operations
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
    const txn = saveTransaction(
      operation,
      currency,
      foreign,
      r,
      cup,
      spread,
      targetWalletId,
      transactionNote,
    );

    // Record capital movement for the selected wallet
    recordCapitalMovement(
      operation === "BUY" ? "OUT" : "IN",
      cup,
      txn.id,
      targetWalletId,
    );

    // Clear the counter (reset bill counts to 0)
    clearAll();

    toast.success("Operación registrada exitosamente");

    // Reset form
    setAmountForeign("");
    setTotalCUP("");
    setTransactionNote("");

    // Stay on operar tab
    goToOperar();
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
            "flex-1 flex items-center justify-center gap-2",
            "py-2.5 rounded-lg text-sm font-bold",
            "transition-all duration-200",
            operation === "BUY"
              ? "bg-[var(--status-success-bg)] text-[var(--status-success)] border border-[var(--status-success)]/30"
              : "text-[var(--text-faint)] hover:text-[var(--text-secondary)]",
          )}
        >
          <ArrowDownLeft className="w-4 h-4" />
          Compra
        </button>
        <button
          onClick={() => setOperation("SELL")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2",
            "py-2.5 rounded-lg text-sm font-bold",
            "transition-all duration-200",
            operation === "SELL"
              ? "bg-[var(--status-warning-bg)] text-[var(--status-warning)] border border-[var(--status-warning)]/30"
              : "text-[var(--text-faint)] hover:text-[var(--text-secondary)]",
          )}
        >
          <ArrowUpRight className="w-4 h-4" />
          Venta
        </button>
        <button
          onClick={() => setOperation("EXCHANGE")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2",
            "py-2.5 rounded-lg text-sm font-bold",
            "transition-all duration-200",
            operation === "EXCHANGE"
              ? "bg-[var(--blue-bg)] text-[var(--blue)] border border-[var(--blue)]/30"
              : "text-[var(--text-faint)] hover:text-[var(--text-secondary)]",
          )}
        >
          <RefreshCw className="w-4 h-4" />
          Cambio
        </button>
      </div>

      {/* Wallet Selector - Only shown when user has multiple wallets */}
      {showWalletSelector && (
        <div className="mb-6">
          <label className="block text-sm text-[var(--text-faint)] mb-2 font-medium">
            <Wallet className="w-4 h-4 inline mr-1" />
            Guardar en cartera
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {activeWallets.map((wallet) => {
              const isSelected = activeWalletId === wallet.id;
              const colorHex = getWalletColorHex(wallet.color);
              return (
                <button
                  key={wallet.id}
                  onClick={() => switchWallet(wallet.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
                    "border transition-all duration-200",
                    isSelected
                      ? "border-[var(--accent)] text-[var(--text-primary)] bg-[var(--bg-secondary)]"
                      : "border-[var(--border-primary)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]",
                  )}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: colorHex }}
                  />
                  {wallet.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* EXCHANGE Mode UI */}
      {operation === "EXCHANGE" && (
        <div className="space-y-4">
          {/* Currency Pair Selection */}
          <div className="grid grid-cols-2 gap-3">
            {/* FROM Currency */}
            <div>
              <label className="block text-sm text-[var(--text-faint)] mb-2 font-medium">
                De (Entregar)
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {visibleCurrencies.map((curr) => {
                  const meta = CURRENCY_META[curr];
                  const isActive = fromCurrency === curr;
                  return (
                    <button
                      key={curr}
                      onClick={() => {
                        haptic.light();
                        setFromCurrency(curr as TransactionCurrency);
                        if (curr === toCurrency) {
                          setToCurrency(fromCurrency);
                        }
                      }}
                      className={cn(
                        "flex items-center justify-center gap-1",
                        "py-2 px-2 rounded-lg border text-xs font-semibold",
                        "transition-all duration-200",
                        isActive
                          ? "bg-[var(--blue-bg)] border-[var(--blue)]/50 text-[var(--blue)]"
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

            {/* TO Currency */}
            <div>
              <label className="block text-sm text-[var(--text-faint)] mb-2 font-medium">
                A (Recibir)
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {visibleCurrencies.map((curr) => {
                  const meta = CURRENCY_META[curr];
                  const isActive = toCurrency === curr;
                  return (
                    <button
                      key={curr}
                      onClick={() => {
                        haptic.light();
                        setToCurrency(curr as TransactionCurrency);
                        if (curr === fromCurrency) {
                          setFromCurrency(toCurrency);
                        }
                      }}
                      className={cn(
                        "flex items-center justify-center gap-1",
                        "py-2 px-2 rounded-lg border text-xs font-semibold",
                        "transition-all duration-200",
                        isActive
                          ? "bg-[var(--blue-bg)] border-[var(--blue)]/50 text-[var(--blue)]"
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
          </div>

          {/* Exchange Rate Input */}
          <div>
            <label className="block text-sm text-[var(--text-faint)] mb-2 font-medium">
              Tasa de cambio (1 {fromCurrency} = X {toCurrency})
            </label>
            <Input
              type="text"
              inputMode="decimal"
              value={exchangeRate}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, "");
                setExchangeRate(val);
              }}
              placeholder="Ej: 1.10"
              className="text-center text-lg font-bold text-[var(--blue)]"
            />
          </div>

          {/* Amount to Exchange */}
          <div>
            <label className="block text-sm text-[var(--text-faint)] mb-2 font-medium">
              Cantidad de {fromCurrency} a entregar
            </label>
            <Input
              type="text"
              inputMode="decimal"
              value={exchangeAmount}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, "");
                setExchangeAmount(val);
              }}
              placeholder="0"
              className="text-center text-2xl font-bold"
            />
          </div>

          {/* Exchange Result & Derived Cost */}
          {parseFloat(exchangeAmount) > 0 && parseFloat(exchangeRate) > 0 && (
            <div className="bg-[var(--bg-primary)] rounded-xl p-4 border border-[var(--border-primary)] space-y-3">
              <div className="text-center">
                <p className="text-sm text-[var(--text-faint)] mb-1">
                  Recibirás
                </p>
                <p className="text-3xl font-bold text-[var(--blue)]">
                  {(
                    parseFloat(exchangeAmount) * parseFloat(exchangeRate)
                  ).toFixed(2)}{" "}
                  {toCurrency}
                </p>
              </div>

              {/* Derived Cost Calculation Info */}
              <div className="border-t border-[var(--border-primary)] pt-3">
                <p className="text-xs text-[var(--text-faint)] mb-2">
                  Cálculo de costo derivado
                </p>
                <div className="text-sm text-[var(--text-muted)] space-y-1">
                  <p>
                    Si compraste {fromCurrency} a{" "}
                    <span className="text-[var(--text-primary)] font-medium">
                      X CUP
                    </span>
                  </p>
                  <p>
                    El costo del {toCurrency} será:{" "}
                    <span className="text-[var(--blue)] font-bold">
                      X ÷ {exchangeRate} CUP
                    </span>
                  </p>
                </div>
                <p className="text-xs text-[var(--text-faint)] mt-2">
                  Ejemplo: 520 ÷ {exchangeRate} ={" "}
                  {(520 / parseFloat(exchangeRate)).toFixed(0)} CUP/{toCurrency}
                </p>
              </div>
            </div>
          )}
          {/* Optional Note for Exchange */}
          <div className="mt-4">
            <label className="block text-xs text-[var(--text-faint)] font-medium mb-1.5 uppercase tracking-wide">
              Nota (opcional)
            </label>
            <Input
              type="text"
              value={transactionNote}
              onChange={(e) => setTransactionNote(e.target.value)}
              placeholder="Ej: Cliente X me debe..."
              className="text-sm"
              maxLength={100}
            />
            <p className="text-[10px] text-[var(--text-faint)] mt-1 opacity-60">
              La nota aparecerá en el historial
            </p>
          </div>

          {/* Exchange button moved to footer */}
        </div>
      )}

      {/* BUY/SELL Mode UI */}
      {operation !== "EXCHANGE" && (
        <>
          {/* Currency Selector - Grid */}
          <div className="mb-6">
            <label className="block text-sm text-[var(--text-faint)] mb-2 font-medium">
              Moneda
            </label>
            <div className="grid grid-cols-3 gap-2">
              {visibleCurrencies.map((currencyCode) => {
                const meta = CURRENCY_META[currencyCode];
                const isSelected = currency === currencyCode;

                return (
                  <button
                    key={currencyCode}
                    onClick={() =>
                      handleCurrencyChange(currencyCode as TransactionCurrency)
                    }
                    className={cn(
                      "flex items-center justify-center gap-1.5",
                      "min-h-[44px] px-2 py-2",
                      "rounded-xl border",
                      "font-semibold text-sm",
                      "transition-all duration-200",
                      isSelected
                        ? operation === "BUY"
                          ? "bg-[var(--status-success-bg)] border-[var(--status-success)]/50 text-[var(--status-success)]"
                          : "bg-[var(--status-warning-bg)] border-[var(--status-warning)]/50 text-[var(--status-warning)]"
                        : "bg-[var(--bg-primary)] border-[var(--border-primary)] text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:border-[var(--border-secondary)]",
                    )}
                  >
                    <span>{meta.flag}</span>
                    <span>{currencyCode}</span>
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

            {/* Optional Note */}
            <div>
              <label className="block text-xs text-[var(--text-faint)] font-medium mb-1.5 uppercase tracking-wide">
                Nota (opcional)
              </label>
              <Input
                type="text"
                value={transactionNote}
                onChange={(e) => setTransactionNote(e.target.value)}
                placeholder="Ej: Cliente Juan, pago parcial..."
                className="text-sm"
                maxLength={100}
              />
              <p className="text-[10px] text-[var(--text-faint)] mt-1 opacity-60">
                La nota aparecerá en el historial
              </p>
            </div>
          </div>
          {/* Buttons moved to footer */}
        </>
      )}
    </div>
  );
}
