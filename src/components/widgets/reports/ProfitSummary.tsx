import { useState, useMemo } from "react";
import { useStore } from "@nanostores/react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Wallet, ChevronDown, Receipt } from "lucide-react";
import { $walletTransactions } from "../../../stores/historyStore";
import { $buyRates } from "../../../stores/ratesStore";
import { $totalExpenses } from "../../../stores/expensesStore";
import { $savingsTotalCUP } from "../../../stores/savingsStore";
import { formatNumber } from "../../../lib/formatters";
import { cn } from "../../../lib/utils";

export function ProfitSummary() {
  const transactions = useStore($walletTransactions);
  const buyRates = useStore($buyRates) ?? {};
  const currentUsdRate = buyRates["USD"] || 1;
  const totalExpenses = useStore($totalExpenses);
  const savingsTotalCUP = useStore($savingsTotalCUP);

  const getProfit = (t: (typeof transactions)[0]) =>
    t.realProfitCUP ?? t.profitCUP ?? 0;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentYear = now.getFullYear();

  const profitToday = transactions
    .filter((t) => new Date(t.date) >= today)
    .reduce((sum, t) => sum + getProfit(t), 0);

  const profitWeek = transactions
    .filter((t) => new Date(t.date) >= weekAgo)
    .reduce((sum, t) => sum + getProfit(t), 0);

  const profitMonth = transactions
    .filter((t) => new Date(t.date) >= firstDayOfMonth)
    .reduce((sum, t) => sum + getProfit(t), 0);

  const currentMonthName = new Intl.DateTimeFormat("es-ES", {
    month: "long",
  }).format(now);
  const monthLabel =
    currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

  const profitTotal = transactions.reduce((sum, t) => sum + getProfit(t), 0);

  type MonthlyProfits = Record<number, number>;
  type YearlyData = { totalProfit: number; months: MonthlyProfits };

  const profitsByYearAndMonth = useMemo(() => {
    return transactions.reduce(
      (acc, t) => {
        const d = new Date(t.date);
        const year = d.getFullYear();
        const month = d.getMonth();
        const profit = getProfit(t);

        if (!acc[year]) acc[year] = { totalProfit: 0, months: {} };
        acc[year].totalProfit += profit;
        acc[year].months[month] = (acc[year].months[month] || 0) + profit;
        return acc;
      },
      {} as Record<number, YearlyData>,
    );
  }, [transactions]);

  const years = Object.keys(profitsByYearAndMonth)
    .map(Number)
    .sort((a, b) => b - a);

  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());

  const toggleYear = (year: number) => {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  };

  const getMonthName = (monthIndex: number) => {
    const d = new Date(2000, monthIndex, 1);
    const name = new Intl.DateTimeFormat("es-ES", { month: "long" }).format(d);
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const todayTransactions = transactions.filter(
    (t) => new Date(t.date) >= today,
  );
  const weekTransactions = transactions.filter(
    (t) => new Date(t.date) >= weekAgo,
  );

  const buysTodayCount = todayTransactions.filter(
    (t) => t.operationType === "BUY",
  ).length;
  const sellsTodayCount = todayTransactions.filter(
    (t) => t.operationType === "SELL",
  ).length;
  const buysWeekCount = weekTransactions.filter(
    (t) => t.operationType === "BUY",
  ).length;
  const sellsWeekCount = weekTransactions.filter(
    (t) => t.operationType === "SELL",
  ).length;

  return (
    <div className="bg-(--bg-primary) rounded-2xl p-5 border border-(--border-primary)">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-xl bg-(--status-warning-bg) flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-(--status-warning)" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-(--text-primary)">
            Ganancias Reales
          </h3>
          <p className="text-xs text-(--text-faint)">
            Basado en costo real (FIFO)
          </p>
        </div>
      </div>

      {/* Profit Grid */}
      <div className="space-y-0 divide-y divide-(--border-primary)/50">
        {/* Short Term Metrics */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-(--text-muted)">Hoy</span>
            <div className="flex gap-1">
              {buysTodayCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
                  {buysTodayCount}C
                </span>
              )}
              {sellsTodayCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">
                  {sellsTodayCount}V
                </span>
              )}
            </div>
          </div>
          <span
            className={cn(
              "font-bold tabular-nums",
              profitToday > 0 ? "text-emerald-400" : "text-(--text-muted)",
            )}
          >
            +{formatNumber(profitToday)} CUP
          </span>
        </div>

        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-(--text-muted)">Esta Semana</span>
            <div className="flex gap-1">
              {buysWeekCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
                  {buysWeekCount}C
                </span>
              )}
              {sellsWeekCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">
                  {sellsWeekCount}V
                </span>
              )}
            </div>
          </div>
          <span
            className={cn(
              "font-bold tabular-nums",
              profitWeek > 0 ? "text-emerald-400" : "text-(--text-muted)",
            )}
          >
            +{formatNumber(profitWeek)} CUP
          </span>
        </div>

        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-(--text-muted)">
            Este Mes ({monthLabel})
          </span>
          <span
            className={cn(
              "font-bold tabular-nums",
              profitMonth > 0 ? "text-emerald-400" : "text-(--text-muted)",
            )}
          >
            +{formatNumber(profitMonth)} CUP
          </span>
        </div>

        {/* Yearly Breakdown */}
        {years.length > 0 && (
          <div className="py-2">
            <div className="text-[10px] uppercase text-(--text-faint) font-bold tracking-wider mb-1 mt-1">
              Historial Anual
            </div>
            {years.map((year) => {
              const data = profitsByYearAndMonth[year];
              const profit = data.totalProfit;
              const isCurrentYear = year === currentYear;
              const isExpanded = expandedYears.has(year);

              const activeMonths = Object.keys(data.months)
                .map(Number)
                .sort((a, b) => b - a);

              return (
                <div
                  key={year}
                  className="flex flex-col border-b border-(--border-primary)/30 last:border-0"
                >
                  <button
                    onClick={() => toggleYear(year)}
                    className="flex items-center justify-between py-3 w-full text-left transition-colors hover:bg-(--bg-secondary)/50 rounded-lg -mx-2 px-2"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronDown
                        size={16}
                        className={cn(
                          "text-(--text-muted) transition-transform duration-300",
                          isExpanded && "rotate-180",
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm",
                          isCurrentYear
                            ? "text-(--text-primary) font-medium"
                            : "text-(--text-muted)",
                        )}
                      >
                        Año {year} {isCurrentYear && "(En curso)"}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "font-bold tabular-nums",
                        profit > 0 ? "text-emerald-400" : "text-(--text-muted)",
                      )}
                    >
                      +{formatNumber(profit)} CUP
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="pl-6 pr-2 pb-3 space-y-2 mt-1">
                          {activeMonths.map((monthIndex) => {
                            const monthProfit = data.months[monthIndex];
                            return (
                              <div
                                key={monthIndex}
                                className="flex items-center justify-between py-1"
                              >
                                <span className="text-xs text-(--text-muted) capitalize">
                                  {getMonthName(monthIndex)}
                                </span>
                                <span
                                  className={cn(
                                    "text-xs font-bold tabular-nums",
                                    monthProfit > 0
                                      ? "text-emerald-400/80"
                                      : "text-(--text-muted)",
                                  )}
                                >
                                  +{formatNumber(monthProfit)} CUP
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}

        {/* Gross FIFO Profit */}
        <div className="flex items-center justify-between py-3 pt-4 border-t border-(--border-secondary)">
          <span className="text-sm font-bold text-(--text-primary)">
            Ganancia Bruta
          </span>
          <span className="text-sm font-bold text-emerald-400 tabular-nums">
            +{formatNumber(profitTotal)} CUP
          </span>
        </div>

        {/* Expenses Deduction */}
        {totalExpenses > 0 && (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-1.5">
              <Receipt size={13} className="text-(--status-error) opacity-80" />
              <span className="text-xs text-(--status-error)">
                Gastos Operativos
              </span>
            </div>
            <span className="text-sm font-bold text-(--status-error) tabular-nums">
              -{formatNumber(totalExpenses)} CUP
            </span>
          </div>
        )}

        {/* Savings Allocation */}
        {savingsTotalCUP > 0 && (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-1.5">
              <Wallet size={13} className="text-amber-500 opacity-80" />
              <span className="text-xs text-amber-500">
                Destinado a Ahorros
              </span>
            </div>
            <span className="text-sm font-bold text-amber-500 tabular-nums">
              {formatNumber(savingsTotalCUP)} CUP
            </span>
          </div>
        )}

        {/* Net Real Profit */}
        <div
          className={cn(
            "flex items-center justify-between py-3 rounded-xl px-3 -mx-1 mt-1",
            totalExpenses > 0
              ? "bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20"
              : "",
          )}
        >
          <span className="text-sm font-bold text-(--text-primary)">
            {totalExpenses > 0 ? "Ganancia Neta Real" : "Total Histórico"}
          </span>
          <div className="text-right">
            <span
              className={cn(
                "block text-lg font-bold tabular-nums",
                profitTotal - totalExpenses > 0
                  ? "text-emerald-400"
                  : profitTotal - totalExpenses < 0
                    ? "text-(--status-error)"
                    : "text-(--text-muted)",
              )}
            >
              {profitTotal - totalExpenses >= 0 ? "+" : ""}
              {formatNumber(profitTotal - totalExpenses)} CUP
            </span>
            <span className="block text-xs text-(--text-muted) tabular-nums">
              ≈ {profitTotal - totalExpenses >= 0 ? "+" : ""}
              {formatNumber((profitTotal - totalExpenses) / currentUsdRate)} USD
              (@{currentUsdRate})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
