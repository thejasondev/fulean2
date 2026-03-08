import { useStore } from "@nanostores/react";
import { BarChart3, RotateCcw } from "lucide-react";
import {
  $inventorySummary,
  clearInventory,
} from "../../../stores/inventoryStore";
import { $sellRates } from "../../../stores/ratesStore";
import { $savingsPerCurrency } from "../../../stores/savingsStore";
import { confirm } from "../../../stores/confirmStore";
import { CURRENCY_META, type Currency } from "../../../lib/constants";
import { formatNumber } from "../../../lib/formatters";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/Button";
import { useToast } from "../../ui/Toast";
import { useHaptic } from "../../../hooks/useHaptic";

function ResetPortfolioButton() {
  const { toast } = useToast();
  const haptic = useHaptic();

  const handleReset = async () => {
    const confirmed = await confirm({
      title: "Reiniciar Portafolio",
      message:
        "¿Estás seguro de que deseas eliminar todo el inventario? Esta acción no se puede deshacer.",
      confirmLabel: "Sí, reiniciar",
      cancelLabel: "Cancelar",
      variant: "danger",
    });

    if (confirmed) {
      haptic.heavy();
      clearInventory();
      toast.info("Portafolio reiniciado");
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleReset}
      className="w-full text-(--status-error) hover:bg-(--status-error)/10"
    >
      <RotateCcw className="w-4 h-4 mr-2" />
      Reiniciar Portafolio
    </Button>
  );
}

export function PortfolioCard() {
  const sellRates = useStore($sellRates);
  const inventorySummary = useStore($inventorySummary);
  const savingsPerCurrency = useStore($savingsPerCurrency);

  let totalPortfolioValue = 0;
  let totalPortfolioCost = 0;

  const portfolio: Record<
    string,
    {
      available: number;
      totalCost: number;
      avgCost: number;
      currentValue: number;
      unrealizedGain: number;
      gainPercent: number;
    }
  > = {};

  Object.keys(inventorySummary).forEach((currency) => {
    const inv = inventorySummary[currency];
    if (inv.quantity > 0) {
      const sellRate = sellRates[currency as Currency] ?? 0;
      const currentValue = Math.round(inv.quantity * sellRate);
      const costOfAvailable = Math.round(inv.totalCost);
      const unrealizedGain = currentValue - costOfAvailable;
      const gainPercent =
        costOfAvailable > 0 ? (unrealizedGain / costOfAvailable) * 100 : 0;

      portfolio[currency] = {
        available: inv.quantity,
        totalCost: costOfAvailable,
        avgCost: inv.avgCost,
        currentValue,
        unrealizedGain,
        gainPercent,
      };

      totalPortfolioValue += currentValue;
      totalPortfolioCost += costOfAvailable;
    }
  });

  const totalUnrealizedGain = totalPortfolioValue - totalPortfolioCost;
  const totalGainPercent =
    totalPortfolioCost > 0
      ? (totalUnrealizedGain / totalPortfolioCost) * 100
      : 0;

  const currencies = Object.keys(portfolio).filter(
    (c) => portfolio[c].available > 0,
  );

  if (currencies.length === 0) return null;

  return (
    <div className="bg-(--bg-primary) rounded-2xl p-5 border border-(--border-primary)">
      {/* Header with total valuation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-(--purple-bg) flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-(--purple)" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-(--text-primary)">
              Mi Portafolio
            </h3>
            <p className="text-xs text-(--text-faint)">Valorización actual</p>
          </div>
        </div>
        {totalPortfolioValue > 0 && (
          <div className="text-right">
            <p className="text-lg font-bold text-(--text-primary) tabular-nums">
              {formatNumber(totalPortfolioValue)} CUP
            </p>
            <p
              className={cn(
                "text-xs font-bold tabular-nums",
                totalUnrealizedGain >= 0
                  ? "text-(--status-success)"
                  : "text-(--status-error)",
              )}
            >
              {totalUnrealizedGain >= 0 ? "+" : ""}
              {formatNumber(totalUnrealizedGain)} ({totalGainPercent.toFixed(1)}
              %)
            </p>
          </div>
        )}
      </div>

      {/* Currency Cards */}
      <div className="space-y-3">
        {currencies.map((currency) => {
          const meta = CURRENCY_META[currency as Currency];
          const p = portfolio[currency];
          const saved = savingsPerCurrency[currency as Currency] || 0;
          const hasInventory = p.available > 0;
          const isEmpty = p.available <= 0;

          return (
            <div
              key={currency}
              className={cn(
                "rounded-xl p-3 border transition-colors",
                isEmpty
                  ? "bg-(--bg-secondary)/50 border-(--border-muted)/50 opacity-60"
                  : "bg-(--bg-secondary) border-(--border-muted)",
              )}
            >
              {/* Currency Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{meta?.flag || "💵"}</span>
                  <span className="font-bold text-(--text-primary)">
                    {currency}
                  </span>
                  <span className="text-sm text-neutral-500">
                    {formatNumber(p.available)} disp.
                  </span>
                  {saved > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-bold tabular-nums">
                      💰 {saved} ahorr.
                    </span>
                  )}
                </div>
                {hasInventory && (
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-bold",
                      p.unrealizedGain >= 0
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-red-500/20 text-red-400",
                    )}
                  >
                    {p.unrealizedGain >= 0 ? "+" : ""}
                    {p.gainPercent.toFixed(1)}%
                  </span>
                )}
              </div>

              {hasInventory && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-(--bg-tertiary) rounded-lg p-2">
                    <div className="text-[10px] text-(--text-muted) uppercase">
                      Valor Actual
                    </div>
                    <div className="text-sm font-bold text-(--text-primary) tabular-nums">
                      {formatNumber(p.currentValue)}
                    </div>
                  </div>
                  <div className="bg-(--bg-tertiary) rounded-lg p-2">
                    <div className="text-[10px] text-(--text-muted) uppercase">
                      Costo
                    </div>
                    <div className="text-sm font-bold text-(--text-faint) tabular-nums">
                      {formatNumber(p.totalCost)}
                    </div>
                  </div>
                  <div className="bg-(--bg-tertiary) rounded-lg p-2">
                    <div className="text-[10px] text-(--text-muted) uppercase">
                      Ganancia
                    </div>
                    <div
                      className={cn(
                        "text-sm font-bold tabular-nums",
                        p.unrealizedGain >= 0
                          ? "text-emerald-400"
                          : "text-red-400",
                      )}
                    >
                      {p.unrealizedGain >= 0 ? "+" : ""}
                      {formatNumber(p.unrealizedGain)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reset Portfolio Button */}
      <div className="mt-4 pt-4 border-t border-(--border-secondary)">
        <ResetPortfolioButton />
      </div>
    </div>
  );
}
