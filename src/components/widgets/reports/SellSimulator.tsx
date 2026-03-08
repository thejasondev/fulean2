import { useState } from "react";
import { useStore } from "@nanostores/react";
import { Calculator } from "lucide-react";
import { $sellRates } from "../../../stores/ratesStore";
import {
  $inventorySummary,
  simulateFIFO,
} from "../../../stores/inventoryStore";
import { CURRENCY_META, type Currency } from "../../../lib/constants";
import { formatNumber } from "../../../lib/formatters";
import { cn } from "../../../lib/utils";
import { Input } from "../../ui/Input";

export function SellSimulator() {
  const inventorySummary = useStore($inventorySummary);
  const sellRates = useStore($sellRates);

  const availableCurrencies: {
    currency: Currency;
    available: number;
    avgCost: number;
  }[] = [];

  Object.keys(inventorySummary).forEach((currency) => {
    const inv = inventorySummary[currency];
    if (inv.quantity > 0) {
      availableCurrencies.push({
        currency: currency as Currency,
        available: inv.quantity,
        avgCost: inv.avgCost,
      });
    }
  });

  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    availableCurrencies[0]?.currency || "USD",
  );
  const [quantity, setQuantity] = useState("");
  const [customRate, setCustomRate] = useState("");

  const currencyData = availableCurrencies.find(
    (c) => c.currency === selectedCurrency,
  );
  const currentRate = sellRates[selectedCurrency] ?? 0;
  const rate = customRate ? parseFloat(customRate) : currentRate;
  const qty = parseFloat(quantity) || 0;
  const maxQty = currencyData?.available ?? 0;

  const fifoSimulation = simulateFIFO(selectedCurrency, qty);

  const cupReceived = Math.round(qty * rate);
  const costBasis = fifoSimulation
    ? fifoSimulation.totalCost
    : Math.round(qty * (currencyData?.avgCost ?? 0));

  const profit = cupReceived - costBasis;
  const profitPercent = costBasis > 0 ? (profit / costBasis) * 100 : 0;

  const quickFills = [25, 50, 75, 100];

  if (availableCurrencies.length === 0) return null;

  return (
    <div className="bg-(--bg-primary) rounded-2xl p-5 border border-(--border-primary)">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-10 h-10 rounded-xl bg-(--blue-bg) flex items-center justify-center">
          <Calculator className="w-5 h-5 text-(--blue)" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-(--text-primary)">
            Simulador de Venta
          </h3>
          <p className="text-xs text-(--text-faint)">
            Calcula tu ganancia antes de vender
          </p>
        </div>
      </div>

      {/* Currency Pills */}
      <div className="mb-4">
        <label className="text-[10px] text-neutral-500 uppercase block mb-2">
          Selecciona moneda
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {availableCurrencies.map(({ currency, available }) => {
            const meta = CURRENCY_META[currency];
            const isSelected = selectedCurrency === currency;
            return (
              <button
                key={currency}
                onClick={() => {
                  setSelectedCurrency(currency);
                  setQuantity("");
                }}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl border transition-all shrink-0",
                  isSelected
                    ? "bg-(--blue-bg) border-(--blue)/50 text-(--blue)"
                    : "bg-(--bg-secondary) border-(--border-muted) text-(--text-muted) hover:border-(--border-primary)",
                )}
              >
                <span className="text-base">{meta?.flag}</span>
                <div className="text-left">
                  <span className="text-sm font-bold block">{currency}</span>
                  <span className="text-[10px] text-neutral-500">
                    {formatNumber(available)} disp.
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Quantity Section */}
        <div className="bg-(--bg-secondary) rounded-xl p-4 border border-(--border-muted)">
          <label className="text-[10px] text-(--text-muted) uppercase block mb-2">
            Cantidad a vender
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="bg-transparent border-0 text-2xl font-bold text-(--text-primary) p-0 h-auto focus:ring-0"
            />
            <span className="text-sm text-(--text-muted)">
              {selectedCurrency}
            </span>
          </div>

          {/* Quick Fill Buttons */}
          <div className="flex gap-2 mt-3">
            {quickFills.map((pct) => (
              <button
                key={pct}
                onClick={() =>
                  setQuantity(Math.floor(maxQty * (pct / 100)).toString())
                }
                className={cn(
                  "flex-1 py-1.5 text-xs font-bold rounded-full transition-all duration-200 border",
                  qty === Math.floor(maxQty * (pct / 100))
                    ? "bg-(--blue) text-white border-transparent shadow-sm scale-105"
                    : "bg-(--bg-tertiary) text-(--text-muted) border-transparent hover:bg-(--bg-hover) hover:text-(--text-primary)",
                )}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        {/* Rate Section */}
        <div className="bg-(--bg-secondary) rounded-xl p-4 border border-(--border-muted)">
          <label className="text-[10px] text-(--text-muted) uppercase block mb-2">
            Tasa de venta
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="decimal"
              placeholder={currentRate.toString()}
              value={customRate}
              onChange={(e) => setCustomRate(e.target.value)}
              className="bg-transparent border-0 text-2xl font-bold text-(--text-primary) p-0 h-auto focus:ring-0"
            />
            <span className="text-sm text-(--text-muted)">CUP</span>
          </div>
          <p className="text-[10px] text-neutral-600 mt-2">
            Tasa actual: {formatNumber(currentRate)} CUP/{selectedCurrency}
          </p>
        </div>
      </div>

      {/* Results */}
      <div
        className={cn(
          "rounded-xl p-4 border transition-all",
          qty > 0
            ? "bg-(--bg-secondary) border-(--border-muted)"
            : "bg-(--bg-secondary)/50 border-(--border-muted)/50",
        )}
      >
        {qty > 0 ? (
          <>
            <div className="text-center mb-4">
              <p className="text-[10px] text-(--text-muted) uppercase mb-1">
                Recibirás
              </p>
              <p className="text-3xl font-bold text-(--text-primary) tabular-nums">
                {formatNumber(cupReceived)}{" "}
                <span className="text-lg text-(--text-muted)">CUP</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-neutral-800">
              <div className="text-center">
                <p className="text-[10px] text-neutral-500 uppercase">
                  Costo original
                </p>
                <p className="text-sm font-bold text-neutral-400 tabular-nums">
                  {formatNumber(costBasis)} CUP
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-neutral-500 uppercase">
                  Ganancia
                </p>
                <p
                  className={cn(
                    "text-sm font-bold tabular-nums",
                    profit >= 0 ? "text-emerald-400" : "text-red-400",
                  )}
                >
                  {profit >= 0 ? "+" : ""}
                  {formatNumber(profit)}
                  <span className="text-[10px] ml-1 opacity-70">
                    ({profitPercent.toFixed(1)}%)
                  </span>
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <Calculator className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
            <p className="text-sm text-neutral-600">
              Ingresa una cantidad para simular
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
