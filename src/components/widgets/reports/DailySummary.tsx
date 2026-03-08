import { useMemo } from "react";
import { useStore } from "@nanostores/react";
import { Calculator, ArrowDownLeft, ArrowUpRight, Share } from "lucide-react";
import { $walletTransactions } from "../../../stores/historyStore";
import { $expenses } from "../../../stores/expensesStore";
import { $buyRates } from "../../../stores/ratesStore";
import { formatNumber } from "../../../lib/formatters";
import { cn } from "../../../lib/utils";
import { useHaptic } from "../../../hooks/useHaptic";
import { Button } from "../../ui/Button";
import { useToast } from "../../ui/Toast";

export function DailySummary() {
  const transactions = useStore($walletTransactions);
  const expenses = useStore($expenses);
  const buyRates = useStore($buyRates) ?? {};
  const currentUsdRate = buyRates["USD"] || 1;
  const haptic = useHaptic();
  const { toast } = useToast();

  const todayData = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todaysTxns = transactions.filter((t) => new Date(t.date) >= today);
    const todaysExpenses = expenses.filter((e) => new Date(e.date) >= today);

    let buysCount = 0;
    let sellsCount = 0;
    let cupIn = 0; // Money we received (from selling foreign currency)
    let cupOut = 0; // Money we spent (buying foreign currency)
    let profit = 0;
    let expensesTotal = 0;

    todaysExpenses.forEach((e) => {
      expensesTotal += e.amount;
    });

    // Volume by currency
    const volume: Record<string, { buy: number; sell: number }> = {};

    todaysTxns.forEach((t) => {
      const currency = t.currency || "USD";
      const amount = t.amountForeign || t.conversions?.USD || 0;
      const cup = t.totalCUP || 0;

      if (!volume[currency]) volume[currency] = { buy: 0, sell: 0 };

      if (t.operationType === "BUY") {
        buysCount++;
        cupOut += cup;
        volume[currency].buy += amount;
      } else if (t.operationType === "SELL") {
        sellsCount++;
        cupIn += cup;
        volume[currency].sell += amount;
      }

      profit += t.realProfitCUP ?? t.profitCUP ?? 0;
    });

    // Substract expenses from profit, and add them to outputs
    profit -= expensesTotal;
    cupOut += expensesTotal;

    return {
      count: todaysTxns.length,
      expensesCount: todaysExpenses.length,
      buysCount,
      sellsCount,
      cupIn,
      cupOut,
      profit,
      expensesTotal,
      volume,
    };
  }, [transactions, expenses]);

  const handleShare = async () => {
    if (todayData.count === 0) return;
    haptic.medium();

    const lines = [
      "🧾 CIERRE DE CAJA (HOY)",
      `📅 ${new Date().toLocaleDateString("es-CU")}`,
      "═══════════════════════",
      `Operaciones: ${todayData.count} (${todayData.buysCount} Compras / ${todayData.sellsCount} Ventas)`,
      "",
      "📊 VOLUMEN OPERADO:",
    ];

    Object.entries(todayData.volume).forEach(([currency, data]) => {
      if (data.buy > 0 || data.sell > 0) {
        lines.push(
          `  ${currency}: Compra ${formatNumber(data.buy)} | Venta ${formatNumber(data.sell)}`,
        );
      }
    });

    lines
      .push(
        "",
        "💰 FLUJO DE CUP:",
        `  Entrada (Ventas): +${formatNumber(todayData.cupIn)} CUP`,
        `  Salida (Compras/Gastos): -${formatNumber(todayData.cupOut)} CUP`,
        todayData.expensesTotal > 0
          ? `    → Incluye ${formatNumber(todayData.expensesTotal)} CUP en gastos operativos`
          : null,
        `  Balance Neto: ${todayData.cupIn - todayData.cupOut >= 0 ? "+" : ""}${formatNumber(todayData.cupIn - todayData.cupOut)} CUP`,
        "",
        "📈 GANANCIA NETA:",
        `  ${todayData.profit >= 0 ? "+" : ""}${formatNumber(todayData.profit)} CUP (≈ ${formatNumber(todayData.profit / currentUsdRate)} USD)`,
        todayData.expensesTotal > 0
          ? `  *(Ganancia real con gastos descontados)*`
          : null,
        "",
        "───────────────────────",
        "Generado con Fulean2",
      )
      .filter((line) => line !== null);

    const text = lines.join("\n");

    try {
      // First try native share
      if (navigator.share && /mobile/i.test(navigator.userAgent)) {
        await navigator.share({ title: "Cierre de Caja", text });
      } else {
        // Fallback to clipboard on PC
        await navigator.clipboard.writeText(text);
        toast.success("Copiado al portapapeles");
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(text);
          toast.success("Copiado al portapapeles");
        } catch {
          toast.error("Error al compartir");
        }
      }
    }
  };

  if (todayData.count === 0) return null;

  return (
    <div className="bg-(--bg-primary) rounded-2xl p-5 border border-(--border-primary)">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-(--blue-bg) flex items-center justify-center">
            <Calculator className="w-5 h-5 text-(--blue)" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-(--text-primary)">
              Cierre de Caja
            </h3>
            <p className="text-xs text-(--text-faint)">
              Resumen de operaciones de hoy
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleShare}
          className="gap-2 px-2 sm:px-3"
        >
          <Share className="w-4 h-4" />
          <span className="hidden sm:inline">Compartir</span>
        </Button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-(--status-success-bg)/30 rounded-xl p-3 border border-(--status-success)/20">
            <div className="flex items-center gap-1 mb-1">
              <ArrowDownLeft className="text-(--status-success) w-3 h-3" />
              <span className="text-[10px] uppercase font-bold text-(--text-faint)">
                Entradas (CUP)
              </span>
            </div>
            <span className="text-sm font-bold text-(--status-success) tabular-nums">
              +{formatNumber(todayData.cupIn)}
            </span>
            <div className="text-[10px] text-(--text-muted) mt-0.5">
              De {todayData.sellsCount} ventas
            </div>
          </div>
          <div className="bg-(--status-error-bg)/30 rounded-xl p-3 border border-(--status-error)/20">
            <div className="flex items-center gap-1 mb-1">
              <ArrowUpRight className="text-(--status-error) w-3 h-3" />
              <span className="text-[10px] uppercase font-bold text-(--text-faint)">
                Salidas (CUP)
              </span>
            </div>
            <span className="text-sm font-bold text-(--status-error) tabular-nums">
              -{formatNumber(todayData.cupOut)}
            </span>
            <div className="text-[10px] text-(--text-muted) mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
              {todayData.buysCount} compras{" "}
              {todayData.expensesTotal > 0
                ? `| Gastos: ${formatNumber(todayData.expensesTotal)}`
                : ""}
            </div>
          </div>
        </div>

        {/* Profit Highlight */}
        <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between">
          <span className="text-sm font-bold text-(--text-primary)">
            Ganancia del Día
          </span>
          <div className="text-right">
            <span
              className={cn(
                "block text-base font-bold tabular-nums",
                todayData.profit >= 0 ? "text-emerald-400" : "text-red-400",
              )}
            >
              {todayData.profit >= 0 ? "+" : ""}
              {formatNumber(todayData.profit)} CUP
            </span>
            <span className="text-[10px] text-(--text-muted)">
              ≈ {formatNumber(todayData.profit / currentUsdRate)} USD
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
