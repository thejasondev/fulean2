import { useStore } from "@nanostores/react";
import { AlertTriangle } from "lucide-react";
import {
  $walletInitialCapital,
  $currentBalance,
} from "../../../stores/capitalStore";
import { $totalExpenses } from "../../../stores/expensesStore";
import { formatNumber } from "../../../lib/formatters";
import { cn } from "../../../lib/utils";

export function LiquidityAlert() {
  const initialCapital = useStore($walletInitialCapital);
  const currentBalance = useStore($currentBalance);
  const totalExpenses = useStore($totalExpenses);

  if (initialCapital <= 0) return null;

  const netBalance = Math.max(0, currentBalance - totalExpenses);
  const liquidityPercent = (netBalance / initialCapital) * 100;
  const isLow = liquidityPercent < 20 && liquidityPercent >= 10;
  const isCritical = liquidityPercent < 10;

  if (!isLow && !isCritical) return null;

  return (
    <div
      className={cn(
        "rounded-xl p-4 border flex items-start gap-3",
        isCritical
          ? "bg-(--status-error-bg) border-(--status-error)/30"
          : "bg-(--status-warning-bg) border-(--status-warning)/30",
      )}
    >
      <AlertTriangle
        className={cn(
          "w-5 h-5 shrink-0 mt-0.5",
          isCritical ? "text-(--status-error)" : "text-(--status-warning)",
        )}
      />
      <div>
        <p
          className={cn(
            "text-sm font-bold",
            isCritical ? "text-(--status-error)" : "text-(--status-warning)",
          )}
        >
          {isCritical ? "Liquidez crítica" : "Liquidez baja"}
        </p>
        <p className="text-xs text-(--text-muted) mt-1">
          Solo el {liquidityPercent.toFixed(0)}% del capital inicial está
          disponible (
          <span className="font-medium text-(--text-primary)">
            {formatNumber(netBalance)} CUP netos
          </span>
          ).
          {totalExpenses > 0 &&
            ` (Se descontaron ${formatNumber(totalExpenses)} CUP en gastos).`}
          {isCritical
            ? " Considera vender divisas con urgencia."
            : " Considera vender algunas divisas."}
        </p>
      </div>
    </div>
  );
}
