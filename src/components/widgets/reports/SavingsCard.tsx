import { useState } from "react";
import { useStore } from "@nanostores/react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Plus, Trash2, ArrowUpRight } from "lucide-react";
import { $sellRates } from "../../../stores/ratesStore";
import {
  $savings,
  $savingsPerCurrency,
  $savingsTotalCUP,
  addSaving,
  withdrawSaving,
  deleteSaving,
} from "../../../stores/savingsStore";
import { getAvailableQuantity } from "../../../stores/inventoryStore";
import { confirm } from "../../../stores/confirmStore";
import { CURRENCY_META, type Currency } from "../../../lib/constants";
import { formatNumber } from "../../../lib/formatters";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { useToast } from "../../ui/Toast";
import { useHaptic } from "../../../hooks/useHaptic";

export function SavingsCard() {
  const savings = useStore($savings);
  const savingsPerCurrency = useStore($savingsPerCurrency);
  const savingsTotalCUP = useStore($savingsTotalCUP);
  const sellRates = useStore($sellRates);
  const haptic = useHaptic();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [currency, setCurrency] = useState<Currency>("USD");
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("");
  const [note, setNote] = useState("");
  const [withdrawId, setWithdrawId] = useState<string | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const currentTotalValue = Object.entries(savingsPerCurrency).reduce(
    (sum, [cur, amt]) => {
      const r = sellRates[cur as Currency] || 0;
      return sum + (amt || 0) * r;
    },
    0,
  );

  const gainLoss = currentTotalValue - savingsTotalCUP;
  const isProfit = gainLoss >= 0;

  const savingsCurrencies: Currency[] = ["USD", "EUR", "CAD"];
  const availableInPortfolio = getAvailableQuantity(currency);

  const handleAdd = () => {
    const amountNum = parseFloat(amount);
    const rateNum = parseFloat(rate);
    if (!amountNum || amountNum <= 0 || !rateNum || rateNum <= 0) return;

    if (amountNum > availableInPortfolio) {
      toast.error(
        `Solo tienes ${availableInPortfolio} ${currency} en portafolio`,
      );
      return;
    }

    const result = addSaving(currency, amountNum, rateNum, note || undefined);
    if (result) {
      haptic.light();
      toast.success(
        `${amountNum} ${currency} ahorrados (@${formatNumber(result.costRate)} = ${formatNumber(result.totalCUP)} CUP)`,
      );
      setAmount("");
      setRate("");
      setNote("");
      setShowForm(false);
    } else {
      toast.error("No hay suficiente inventario en el portafolio");
    }
  };

  const handleWithdraw = async (entry: (typeof savings)[0]) => {
    const amountToWithdraw = withdrawAmount
      ? parseFloat(withdrawAmount)
      : entry.amount;

    if (!amountToWithdraw || amountToWithdraw <= 0) return;
    if (amountToWithdraw > entry.amount) {
      toast.error(`Máximo: ${entry.amount} ${entry.currency}`);
      return;
    }

    const isPartial = amountToWithdraw < entry.amount;

    const confirmed = await confirm({
      title: isPartial ? "Retiro Parcial" : "Retirar Ahorro",
      message: `¿Devolver ${amountToWithdraw} ${entry.currency} al portafolio?\n\nSe restaurará al inventario al costo original de ${formatNumber(entry.costRate)} CUP/${entry.currency}.${isPartial ? `\n\nQuedarán ${(entry.amount - amountToWithdraw).toFixed(2)} ${entry.currency} en ahorros.` : ""}`,
      confirmLabel: "Devolver al Portafolio",
      variant: "warning",
    });

    if (confirmed) {
      const result = withdrawSaving(entry.id, amountToWithdraw);
      if (result) {
        haptic.medium();
        toast.success(
          `${result.amountReturned} ${result.currency} → portafolio (@${formatNumber(result.costRate)})`,
        );
        setWithdrawId(null);
        setWithdrawAmount("");
      }
    }
  };

  const handleDelete = async (entry: (typeof savings)[0]) => {
    const confirmed = await confirm({
      title: "Eliminar Registro",
      message: `¿Eliminar ${entry.amount} ${entry.currency} de ahorros?\n\nLa moneda se devolverá al inventario como corrección de datos.`,
      confirmLabel: "Eliminar",
      variant: "danger",
    });
    if (confirmed) {
      deleteSaving(entry.id);
      haptic.light();
      toast.info("Registro eliminado");
    }
  };

  return (
    <div className="bg-(--bg-primary) rounded-2xl p-5 border border-(--border-primary)">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10">
            <Wallet size={18} className="text-amber-500" />
          </div>
          <h3 className="text-sm font-bold text-(--text-primary)">
            Ahorros en Divisas
          </h3>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={cn(
            "p-2 rounded-xl transition-colors",
            showForm
              ? "bg-amber-500/20 text-amber-500"
              : "bg-(--bg-secondary) text-(--text-muted) hover:text-(--text-primary)",
          )}
          title="Agregar ahorro"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Summary by Currency */}
      {Object.keys(savingsPerCurrency).length > 0 && (
        <div className="space-y-2 mb-4">
          {Object.entries(savingsPerCurrency).map(([cur, amt]) => {
            const meta = CURRENCY_META[cur as Currency];
            const currentRate = sellRates[cur as Currency] || 0;
            const currentValue = (amt || 0) * currentRate;
            const currencyEntries = savings.filter((e) => e.currency === cur);
            const totalCost = currencyEntries.reduce(
              (s, e) => s + e.totalCUP,
              0,
            );
            const avgCostRate =
              amt && amt > 0 ? Math.round(totalCost / amt) : 0;
            const diff = currentValue - totalCost;
            const diffPositive = diff >= 0;

            return (
              <div
                key={cur}
                className="flex items-center justify-between p-3 rounded-xl bg-(--bg-secondary)/50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{meta?.flag || "💱"}</span>
                  <div>
                    <div className="text-sm font-bold text-(--text-primary) tabular-nums">
                      {amt} {cur}
                    </div>
                    <div className="text-[10px] text-(--text-faint) tabular-nums">
                      Costo: @{formatNumber(avgCostRate)} · Venta actual: @
                      {formatNumber(currentRate)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-(--text-primary) tabular-nums">
                    {formatNumber(currentValue)} CUP
                  </div>
                  <div
                    className={cn(
                      "text-[10px] font-bold tabular-nums",
                      diffPositive
                        ? "text-(--status-success)"
                        : "text-(--status-error)",
                    )}
                  >
                    {diffPositive ? "+" : ""}
                    {formatNumber(diff)} CUP
                  </div>
                </div>
              </div>
            );
          })}

          {/* Total summary */}
          <div className="flex items-center justify-between pt-2 border-t border-(--border-primary)/50">
            <span className="text-xs text-(--text-muted)">Costo total</span>
            <span className="text-xs font-bold text-(--text-primary) tabular-nums">
              {formatNumber(savingsTotalCUP)} CUP
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-(--text-muted)">Valor actual</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-(--text-primary) tabular-nums">
                {formatNumber(currentTotalValue)} CUP
              </span>
              <span
                className={cn(
                  "text-[10px] font-bold tabular-nums",
                  isProfit
                    ? "text-(--status-success)"
                    : "text-(--status-error)",
                )}
              >
                ({isProfit ? "+" : ""}
                {formatNumber(gainLoss)})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pb-3">
              {/* Currency Selector + Availability */}
              <div className="flex gap-1.5 flex-wrap">
                {savingsCurrencies.map((cur) => {
                  const meta = CURRENCY_META[cur];
                  const isSelected = currency === cur;
                  const avail = getAvailableQuantity(cur);
                  return (
                    <button
                      key={cur}
                      onClick={() => setCurrency(cur)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                        isSelected
                          ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                          : "bg-(--bg-secondary) text-(--text-muted) border border-transparent hover:border-(--border-secondary)",
                        avail <= 0 && "opacity-40",
                      )}
                    >
                      {meta.flag} {cur}
                      <span className="ml-1 opacity-70">({avail})</span>
                    </button>
                  );
                })}
              </div>

              {/* Amount + Rate */}
              <div className="flex gap-2">
                <Input
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Cantidad ${currency}`}
                  className="flex-1 text-sm"
                />
                <Input
                  type="number"
                  inputMode="numeric"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="Costo CUP"
                  className="w-28 text-sm text-right"
                  numericOnly
                />
              </div>
              {availableInPortfolio > 0 && (
                <p className="text-[10px] text-(--text-faint)">
                  Disponible en portafolio: {availableInPortfolio} {currency}
                </p>
              )}

              {/* Preview */}
              {amount &&
                rate &&
                parseFloat(amount) > 0 &&
                parseFloat(rate) > 0 && (
                  <div className="text-xs text-(--text-muted) text-center p-2 rounded-lg bg-(--bg-secondary)/50">
                    {parseFloat(amount) <= availableInPortfolio ? (
                      <>
                        {amount} {currency} × {rate} ={" "}
                        <span className="font-bold text-amber-500">
                          {formatNumber(
                            Math.round(parseFloat(amount) * parseFloat(rate)),
                          )}{" "}
                          CUP
                        </span>
                        <span className="block text-[10px] opacity-70 mt-0.5">
                          Se descontarán del portafolio
                        </span>
                      </>
                    ) : (
                      <span className="text-(--status-error)">
                        Excede el inventario disponible
                      </span>
                    )}
                  </div>
                )}

              {/* Note */}
              <Input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nota (opcional)"
                className="text-sm"
                maxLength={50}
              />

              <Button
                onClick={handleAdd}
                variant="primary"
                size="sm"
                className="w-full bg-amber-500 hover:bg-amber-600"
                disabled={
                  !amount ||
                  parseFloat(amount) <= 0 ||
                  parseFloat(amount) > availableInPortfolio ||
                  !rate ||
                  parseFloat(rate) <= 0
                }
              >
                <Plus size={14} />
                Guardar Ahorro
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Entry List */}
      {savings.length > 0 && (
        <div className="border-t border-(--border-primary) pt-2 space-y-1 max-h-60 overflow-y-auto">
          {savings.slice(0, 10).map((entry) => {
            const meta = CURRENCY_META[entry.currency];
            const currentRate = sellRates[entry.currency] || entry.costRate;
            const currentValue = Math.round(entry.amount * currentRate);
            const diff = currentValue - entry.totalCUP;
            const isWithdrawing = withdrawId === entry.id;

            return (
              <div
                key={entry.id}
                className="py-2 px-2 rounded-lg bg-(--bg-secondary)/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-base shrink-0">{meta?.flag}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-(--text-primary) tabular-nums">
                        {entry.amount} {entry.currency}
                        <span className="text-(--text-faint) font-normal ml-1">
                          @{formatNumber(entry.costRate)} CUP
                        </span>
                      </div>
                      <div className="text-[10px] text-(--text-faint)">
                        {new Date(entry.date).toLocaleDateString("es-CU", {
                          day: "numeric",
                          month: "short",
                        })}
                        {entry.note && ` · ${entry.note}`}
                        <span className="ml-1">
                          · Hoy: @{formatNumber(currentRate)}
                        </span>
                        {diff !== 0 && (
                          <span
                            className={cn(
                              "ml-1 font-bold",
                              diff > 0
                                ? "text-(--status-success)"
                                : "text-(--status-error)",
                            )}
                          >
                            ({diff > 0 ? "+" : ""}
                            {formatNumber(diff)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => {
                        if (isWithdrawing) {
                          setWithdrawId(null);
                          setWithdrawAmount("");
                        } else {
                          setWithdrawId(entry.id);
                          setWithdrawAmount(String(entry.amount));
                        }
                      }}
                      className={cn(
                        "p-2 rounded-lg active:scale-95 transition-all min-w-[36px] min-h-[36px] flex items-center justify-center",
                        isWithdrawing
                          ? "bg-amber-500/30 text-amber-500 ring-1 ring-amber-500/50"
                          : "bg-amber-500/10 text-amber-500",
                      )}
                      title="Devolver al portafolio"
                    >
                      <ArrowUpRight size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(entry)}
                      className="p-2 rounded-lg bg-(--status-error-bg) text-(--status-error) active:scale-95 transition-transform min-w-[36px] min-h-[36px] flex items-center justify-center"
                      title="Eliminar registro"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Withdraw panel */}
                <AnimatePresence>
                  {isWithdrawing && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-(--border-primary)/30">
                        <Input
                          type="number"
                          inputMode="decimal"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder={`Máx: ${entry.amount}`}
                          className="flex-1 text-sm"
                        />
                        <span className="text-xs text-(--text-faint) shrink-0">
                          / {entry.amount} {entry.currency}
                        </span>
                        <Button
                          onClick={() => handleWithdraw(entry)}
                          variant="primary"
                          size="sm"
                          className="bg-amber-500 hover:bg-amber-600 shrink-0"
                        >
                          Retirar
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          {savings.length > 10 && (
            <p className="text-[10px] text-(--text-faint) text-center py-1">
              +{savings.length - 10} ahorros más
            </p>
          )}
        </div>
      )}

      {/* Empty state */}
      {savings.length === 0 && !showForm && (
        <p className="text-xs text-(--text-faint) text-center py-4">
          Ahorra divisas de tu portafolio para guardar en moneda dura
        </p>
      )}
    </div>
  );
}
