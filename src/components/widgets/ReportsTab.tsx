import { useState } from "react";
import { useStore } from "@nanostores/react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowDownLeft,
  ArrowUpRight,
  Edit3,
  Check,
  RotateCcw,
  Coins,
} from "lucide-react";
import {
  $initialCapital,
  $totalIn,
  $totalOut,
  $currentBalance,
  $netChange,
  $percentageChange,
  setInitialCapital,
  resetCapital,
} from "../../stores/capitalStore";
import { $transactions } from "../../stores/historyStore";
import { formatNumber } from "../../lib/formatters";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { confirm } from "../../stores/confirmStore";
import { useToast } from "../ui/Toast";
import { useHaptic } from "../../hooks/useHaptic";
import { CURRENCY_META, type Currency } from "../../lib/constants";

// ============================================
// ReportsTab Component
// Capital Management + Profit Tracking
// ============================================

// Capital Card Component
function CapitalCard() {
  const initialCapital = useStore($initialCapital);
  const totalIn = useStore($totalIn);
  const totalOut = useStore($totalOut);
  const currentBalance = useStore($currentBalance);
  const netChange = useStore($netChange);
  const percentageChange = useStore($percentageChange);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const haptic = useHaptic();
  const { toast } = useToast();

  const handleEdit = () => {
    setEditValue(initialCapital.toString());
    setIsEditing(true);
  };

  const handleSave = () => {
    const value = parseInt(editValue, 10);
    if (isNaN(value) || value < 0) {
      toast.error("Ingrese un monto válido");
      return;
    }
    haptic.medium();
    setInitialCapital(value);
    setIsEditing(false);
    toast.success("Capital inicial actualizado");
  };

  const handleReset = async () => {
    const confirmed = await confirm({
      title: "Reiniciar Capital",
      message: "¿Borrar todo el historial de capital?",
      confirmLabel: "Reiniciar",
      variant: "danger",
    });
    if (confirmed) {
      haptic.heavy();
      resetCapital();
      toast.info("Capital reiniciado");
    }
  };

  const isPositive = netChange >= 0;

  return (
    <div className="bg-neutral-900 rounded-2xl p-5 border border-neutral-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Capital de Operación
            </h3>
            <p className="text-xs text-neutral-500">Gestiona tu efectivo</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-8 w-8 p-0 text-neutral-500 hover:text-red-400"
          title="Reiniciar"
        >
          <RotateCcw size={14} />
        </Button>
      </div>

      {/* Initial Capital - Editable */}
      <div className="bg-neutral-950 rounded-xl p-4 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-400">Capital Inicial</span>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-28 h-8 text-right text-sm"
                numericOnly
                autoFocus
              />
              <button
                onClick={handleSave}
                className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/30"
              >
                <Check size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 text-white font-bold tabular-nums hover:text-emerald-400 transition-colors"
            >
              {formatNumber(initialCapital)} CUP
              <Edit3 size={12} className="text-neutral-500" />
            </button>
          )}
        </div>
      </div>

      {/* Movement Summary */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-neutral-950 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowDownLeft size={12} className="text-emerald-400" />
            <span className="text-xs text-neutral-500">Gastado (Compras)</span>
          </div>
          <span className="text-sm font-bold text-emerald-400 tabular-nums">
            -{formatNumber(totalOut)} CUP
          </span>
        </div>
        <div className="bg-neutral-950 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowUpRight size={12} className="text-amber-400" />
            <span className="text-xs text-neutral-500">Recibido (Ventas)</span>
          </div>
          <span className="text-sm font-bold text-amber-400 tabular-nums">
            +{formatNumber(totalIn)} CUP
          </span>
        </div>
      </div>

      {/* Current Balance */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-transparent rounded-xl p-4 border border-emerald-500/20">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400">Balance Actual</span>
            <div className="text-2xl font-bold text-white tabular-nums">
              {formatNumber(currentBalance)} CUP
            </div>
          </div>
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",
              isPositive
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-red-500/20 text-red-400"
            )}
          >
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {isPositive ? "+" : ""}
            {percentageChange.toFixed(1)}%
          </div>
        </div>
        <div className="mt-2 text-sm text-neutral-400">
          Variación:
          <span
            className={cn(
              "font-bold ml-1 tabular-nums",
              isPositive ? "text-emerald-400" : "text-red-400"
            )}
          >
            {isPositive ? "+" : ""}
            {formatNumber(netChange)} CUP
          </span>
        </div>
      </div>
    </div>
  );
}

// Profit Summary Component
function ProfitSummary() {
  const transactions = useStore($transactions);

  // Calculate profits by time period
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const profitToday = transactions
    .filter((t) => new Date(t.date) >= today)
    .reduce((sum, t) => sum + (t.profitCUP || 0), 0);

  const profitWeek = transactions
    .filter((t) => new Date(t.date) >= weekAgo)
    .reduce((sum, t) => sum + (t.profitCUP || 0), 0);

  const profitMonth = transactions
    .filter((t) => new Date(t.date) >= monthAgo)
    .reduce((sum, t) => sum + (t.profitCUP || 0), 0);

  const profitTotal = transactions.reduce(
    (sum, t) => sum + (t.profitCUP || 0),
    0
  );

  // Count operations by type for each period
  const todayTransactions = transactions.filter(
    (t) => new Date(t.date) >= today
  );
  const weekTransactions = transactions.filter(
    (t) => new Date(t.date) >= weekAgo
  );

  const buysTodayCount = todayTransactions.filter(
    (t) => t.operationType === "BUY"
  ).length;
  const sellsTodayCount = todayTransactions.filter(
    (t) => t.operationType === "SELL"
  ).length;
  const buysWeekCount = weekTransactions.filter(
    (t) => t.operationType === "BUY"
  ).length;
  const sellsWeekCount = weekTransactions.filter(
    (t) => t.operationType === "SELL"
  ).length;

  return (
    <div className="bg-neutral-900 rounded-2xl p-5 border border-neutral-800">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Ganancias Estimadas</h3>
          <p className="text-xs text-neutral-500">Basado en spread × monto</p>
        </div>
      </div>

      {/* Profit Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between py-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-400">Hoy</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
              {buysTodayCount}C
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">
              {sellsTodayCount}V
            </span>
          </div>
          <span
            className={cn(
              "font-bold tabular-nums",
              profitToday > 0 ? "text-emerald-400" : "text-neutral-500"
            )}
          >
            +{formatNumber(profitToday)} CUP
          </span>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-400">Esta Semana</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
              {buysWeekCount}C
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">
              {sellsWeekCount}V
            </span>
          </div>
          <span
            className={cn(
              "font-bold tabular-nums",
              profitWeek > 0 ? "text-emerald-400" : "text-neutral-500"
            )}
          >
            +{formatNumber(profitWeek)} CUP
          </span>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-neutral-800">
          <span className="text-sm text-neutral-400">Este Mes</span>
          <span
            className={cn(
              "font-bold tabular-nums",
              profitMonth > 0 ? "text-emerald-400" : "text-neutral-500"
            )}
          >
            +{formatNumber(profitMonth)} CUP
          </span>
        </div>

        <div className="flex items-center justify-between py-3">
          <span className="text-sm font-bold text-white">Total Histórico</span>
          <span className="text-lg font-bold text-emerald-400 tabular-nums">
            +{formatNumber(profitTotal)} CUP
          </span>
        </div>
      </div>
    </div>
  );
}

// Volume Summary Component (moved from HistoryDrawer)
function VolumeSummary() {
  const transactions = useStore($transactions);

  // Calculate volume by currency for BUY and SELL
  const volumeByCurrency: Record<string, { buy: number; sell: number }> = {};

  transactions.forEach((txn) => {
    const currency = txn.currency || "USD";
    const amount = txn.amountForeign || 0;

    if (!volumeByCurrency[currency]) {
      volumeByCurrency[currency] = { buy: 0, sell: 0 };
    }

    if (txn.operationType === "BUY") {
      volumeByCurrency[currency].buy += amount;
    } else {
      volumeByCurrency[currency].sell += amount;
    }
  });

  // Show all currencies with transactions (historical data - not filtered by visibility)
  const currencies = Object.keys(volumeByCurrency);
  if (currencies.length === 0) return null;

  return (
    <div className="bg-neutral-900 rounded-2xl p-5 border border-neutral-800">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
          <Coins className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Volumen por Moneda</h3>
          <p className="text-xs text-neutral-500">Total operado en divisas</p>
        </div>
      </div>

      {/* Currency Grid */}
      <div className="space-y-2">
        {currencies.map((currency) => {
          const meta = CURRENCY_META[currency as Currency];
          const { buy, sell } = volumeByCurrency[currency];
          return (
            <div
              key={currency}
              className="flex items-center justify-between py-3 border-b border-neutral-800 last:border-0"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{meta?.flag || "💵"}</span>
                <span className="font-bold text-white">{currency}</span>
              </div>
              <div className="flex items-center gap-4 text-sm tabular-nums">
                <div className="text-right">
                  <span className="text-neutral-500">C: </span>
                  <span className="text-emerald-400 font-bold">
                    {formatNumber(buy)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-neutral-500">V: </span>
                  <span className="text-amber-400 font-bold">
                    {formatNumber(sell)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Currency Inventory Component - Shows available currency to sell
function CurrencyInventory() {
  const transactions = useStore($transactions);

  // Calculate inventory: Bought - Sold = Available
  const inventory: Record<
    string,
    { bought: number; sold: number; available: number }
  > = {};

  transactions.forEach((txn) => {
    const currency = txn.currency || "USD";
    const amount = txn.amountForeign || 0;

    if (!inventory[currency]) {
      inventory[currency] = { bought: 0, sold: 0, available: 0 };
    }

    if (txn.operationType === "BUY") {
      inventory[currency].bought += amount;
    } else {
      inventory[currency].sold += amount;
    }
  });

  // Calculate available for each currency
  Object.keys(inventory).forEach((currency) => {
    inventory[currency].available =
      inventory[currency].bought - inventory[currency].sold;
  });

  // Show all currencies with transactions (historical data - not filtered by visibility)
  const currencies = Object.keys(inventory);
  if (currencies.length === 0) return null;

  return (
    <div className="bg-neutral-900 rounded-2xl p-5 border border-neutral-800">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">
            Inventario de Divisas
          </h3>
          <p className="text-xs text-neutral-500">Disponible para vender</p>
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="space-y-3">
        {currencies.map((currency) => {
          const meta = CURRENCY_META[currency as Currency];
          const { bought, sold, available } = inventory[currency];
          const isLow = available < bought * 0.2 && available > 0; // Less than 20%
          const isEmpty = available <= 0;

          return (
            <div
              key={currency}
              className={cn(
                "rounded-xl p-3 border transition-colors",
                isEmpty
                  ? "bg-red-500/5 border-red-500/20"
                  : isLow
                  ? "bg-amber-500/5 border-amber-500/20"
                  : "bg-neutral-950 border-neutral-800"
              )}
            >
              {/* Currency Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{meta?.flag || "💵"}</span>
                  <span className="font-bold text-white">{currency}</span>
                </div>
                {/* Status Badge */}
                {isEmpty ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">
                    AGOTADO
                  </span>
                ) : isLow ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">
                    BAJO
                  </span>
                ) : null}
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-[10px] text-neutral-500 uppercase">
                    Comprado
                  </div>
                  <div className="text-sm font-bold text-emerald-400 tabular-nums">
                    {formatNumber(bought)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-neutral-500 uppercase">
                    Vendido
                  </div>
                  <div className="text-sm font-bold text-amber-400 tabular-nums">
                    {formatNumber(sold)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-neutral-500 uppercase">
                    Disponible
                  </div>
                  <div
                    className={cn(
                      "text-sm font-bold tabular-nums",
                      isEmpty
                        ? "text-red-400"
                        : isLow
                        ? "text-amber-400"
                        : "text-white"
                    )}
                  >
                    {formatNumber(available)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Main Reports Tab
export function ReportsTab() {
  return (
    <main
      className={cn(
        "flex-1 overflow-y-auto",
        "px-4 py-4",
        "pb-32",
        "space-y-4"
      )}
    >
      <CapitalCard />
      <CurrencyInventory />
      <VolumeSummary />
      <ProfitSummary />
    </main>
  );
}
