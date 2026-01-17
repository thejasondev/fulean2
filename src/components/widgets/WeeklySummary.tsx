import { useStore } from "@nanostores/react";
import {
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  DollarSign,
} from "lucide-react";
import { $transactions, type Transaction } from "../../stores/historyStore";
import { cn } from "../../lib/utils";

// ============================================
// WeeklySummary Component
// Analytics dashboard for the History view
// Theme-aware using CSS variables
// ============================================

interface WeeklyStats {
  totalTransactions: number;
  volumeUSD: number;
  volumeEUR: number;
  volumeCAD: number;
  buyVolume: number;
  sellVolume: number;
  totalCUP: number;
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  return new Date(d.setDate(diff));
}

function calculateWeeklyStats(transactions: Transaction[]): WeeklyStats {
  const weekStart = getStartOfWeek(new Date());
  weekStart.setHours(0, 0, 0, 0);

  const weeklyTransactions = transactions.filter((txn) => {
    const txnDate = new Date(txn.date);
    return txnDate >= weekStart;
  });

  let volumeUSD = 0;
  let volumeEUR = 0;
  let volumeCAD = 0;
  let buyVolume = 0;
  let sellVolume = 0;
  let totalCUP = 0;

  for (const txn of weeklyTransactions) {
    const amount = txn.amountForeign || 0;
    const cup = txn.totalCUP || 0;

    switch (txn.currency) {
      case "USD":
        volumeUSD += amount;
        break;
      case "EUR":
        volumeEUR += amount;
        break;
      case "CAD":
        volumeCAD += amount;
        break;
    }

    if (txn.operationType === "BUY") {
      buyVolume += cup;
    } else {
      sellVolume += cup;
    }

    totalCUP += cup;
  }

  return {
    totalTransactions: weeklyTransactions.length,
    volumeUSD,
    volumeEUR,
    volumeCAD,
    buyVolume,
    sellVolume,
    totalCUP,
  };
}

export function WeeklySummary() {
  const transactions = useStore($transactions) ?? [];
  const stats = calculateWeeklyStats(transactions);

  if (stats.totalTransactions === 0) {
    return null; // Don't show if no transactions this week
  }

  const buyPercent =
    stats.totalCUP > 0
      ? Math.round((stats.buyVolume / stats.totalCUP) * 100)
      : 50;
  const sellPercent = 100 - buyPercent;

  const mainVolume =
    stats.volumeUSD > 0
      ? `$${stats.volumeUSD.toLocaleString("es-CU")}`
      : stats.volumeEUR > 0
        ? `€${stats.volumeEUR.toLocaleString("es-CU")}`
        : `C$${stats.volumeCAD.toLocaleString("es-CU")}`;

  return (
    <div className="mb-4">
      <div className="text-xs text-[var(--text-faint)] font-medium uppercase tracking-wide mb-2">
        Esta Semana
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Volume Card */}
        <div
          className={cn(
            "bg-[var(--bg-primary)]/80 rounded-xl p-3 border border-[var(--border-primary)]",
            "flex items-center gap-3",
          )}
        >
          <div className="w-10 h-10 rounded-lg bg-[var(--status-success-bg)] flex items-center justify-center">
            <DollarSign size={20} className="text-[var(--status-success)]" />
          </div>
          <div>
            <div className="text-xs text-[var(--text-faint)]">Volumen</div>
            <div className="text-lg font-bold tabular-nums text-[var(--text-primary)]">
              {mainVolume}
            </div>
          </div>
        </div>

        {/* Transactions Card */}
        <div
          className={cn(
            "bg-[var(--bg-primary)]/80 rounded-xl p-3 border border-[var(--border-primary)]",
            "flex items-center gap-3",
          )}
        >
          <div className="w-10 h-10 rounded-lg bg-[var(--blue-bg)] flex items-center justify-center">
            <ArrowRightLeft size={20} className="text-[var(--blue)]" />
          </div>
          <div>
            <div className="text-xs text-[var(--text-faint)]">Operaciones</div>
            <div className="text-lg font-bold tabular-nums text-[var(--text-primary)]">
              {stats.totalTransactions}
            </div>
          </div>
        </div>
      </div>

      {/* Flow Bar */}
      <div className="mt-3 bg-[var(--bg-primary)]/80 rounded-xl p-3 border border-[var(--border-primary)]">
        <div className="flex items-center justify-between text-xs text-[var(--text-faint)] mb-2">
          <div className="flex items-center gap-1">
            <TrendingDown size={12} className="text-[var(--status-success)]" />
            <span>Compras {buyPercent}%</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Ventas {sellPercent}%</span>
            <TrendingUp size={12} className="text-[var(--status-warning)]" />
          </div>
        </div>

        {/* Visual Bar */}
        <div className="h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden flex">
          <div
            className="bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${buyPercent}%` }}
          />
          <div
            className="bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
            style={{ width: `${sellPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
