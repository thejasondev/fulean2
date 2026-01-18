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
  AlertTriangle,
  Calculator,
  BarChart3,
} from "lucide-react";
import {
  $walletInitialCapital,
  $totalIn,
  $totalOut,
  $currentBalance,
  $netChange,
  $percentageChange,
  setInitialCapital,
  resetCapital,
} from "../../stores/capitalStore";
import { $transactions, $walletTransactions } from "../../stores/historyStore";
import { WalletSelector } from "./WalletSelector";
import {
  $sellRates,
  $buyRates,
  $elToqueRates,
  $manualElToqueRates,
  isManualElToqueCurrency,
} from "../../stores/ratesStore";
import {
  $rateHistory,
  recordRateSnapshot,
  getRateHistoryForCurrency,
  getCurrencyTrend,
  $hasRateHistory,
} from "../../stores/rateHistoryStore";
import { formatNumber } from "../../lib/formatters";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { confirm } from "../../stores/confirmStore";
import { useToast } from "../ui/Toast";
import { useHaptic } from "../../hooks/useHaptic";
import { CURRENCIES, CURRENCY_META, type Currency } from "../../lib/constants";
import { $visibleCurrencies } from "../../stores/visibilityStore";
import { useEffect } from "react";

// ============================================
// ReportsTab Component
// Capital Management + Investment Metrics
// ============================================

// Liquidity Alert Component
function LiquidityAlert() {
  const initialCapital = useStore($walletInitialCapital);
  const currentBalance = useStore($currentBalance);

  // Don't show if no initial capital set
  if (initialCapital <= 0) return null;

  const liquidityPercent = (currentBalance / initialCapital) * 100;
  const isLow = liquidityPercent < 20 && liquidityPercent >= 10;
  const isCritical = liquidityPercent < 10;

  // Don't show if liquidity is fine
  if (!isLow && !isCritical) return null;

  return (
    <div
      className={cn(
        "rounded-xl p-4 border flex items-start gap-3",
        isCritical
          ? "bg-[var(--status-error-bg)] border-[var(--status-error)]/30"
          : "bg-[var(--status-warning-bg)] border-[var(--status-warning)]/30",
      )}
    >
      <AlertTriangle
        className={cn(
          "w-5 h-5 shrink-0 mt-0.5",
          isCritical
            ? "text-[var(--status-error)]"
            : "text-[var(--status-warning)]",
        )}
      />
      <div>
        <p
          className={cn(
            "text-sm font-bold",
            isCritical
              ? "text-[var(--status-error)]"
              : "text-[var(--status-warning)]",
          )}
        >
          {isCritical ? "⚠️ Liquidez crítica" : "Liquidez baja"}
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Solo {liquidityPercent.toFixed(0)}% del capital en CUP (
          {formatNumber(currentBalance)} CUP).
          {isCritical
            ? " Considera vender divisas urgentemente."
            : " Considera vender algunas divisas."}
        </p>
      </div>
    </div>
  );
}

// Capital Card Component
// ============================================

// Capital Card Component
function CapitalCard() {
  const initialCapital = useStore($walletInitialCapital);
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
    <div className="bg-[var(--bg-primary)] rounded-2xl p-5 border border-[var(--border-primary)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-[var(--status-success-bg)] flex items-center justify-center">
            <Wallet className="w-5 h-5 text-[var(--status-success)]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Capital de Operación
            </h3>
            <p className="text-xs text-[var(--text-faint)]">
              Gestiona tu efectivo
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-8 w-8 p-0 text-[var(--text-faint)] hover:text-[var(--status-error)]"
          title="Reiniciar"
        >
          <RotateCcw size={14} />
        </Button>
      </div>

      {/* Initial Capital - Editable */}
      <div className="bg-[var(--bg-base)] rounded-xl p-4 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--text-muted)]">
            Capital Inicial
          </span>
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
                className="w-8 h-8 rounded-lg bg-[var(--status-success-bg)] text-[var(--status-success)] flex items-center justify-center hover:opacity-80"
              >
                <Check size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 text-[var(--text-primary)] font-bold tabular-nums hover:text-[var(--status-success)] transition-colors"
            >
              {formatNumber(initialCapital)} CUP
              <Edit3 size={12} className="text-[var(--text-faint)]" />
            </button>
          )}
        </div>
      </div>

      {/* Movement Summary */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-[var(--bg-base)] rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowDownLeft size={12} className="text-[var(--status-success)]" />
            <span className="text-xs text-[var(--text-faint)]">(Compras)</span>
          </div>
          <span className="text-sm font-bold text-[var(--status-success)] tabular-nums">
            -{formatNumber(totalOut)} CUP
          </span>
        </div>
        <div className="bg-[var(--bg-base)] rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowUpRight size={12} className="text-[var(--status-warning)]" />
            <span className="text-xs text-[var(--text-faint)]">(Ventas)</span>
          </div>
          <span className="text-sm font-bold text-[var(--status-warning)] tabular-nums">
            +{formatNumber(totalIn)} CUP
          </span>
        </div>
      </div>

      {/* Current Balance */}
      <div className="bg-gradient-to-r from-[var(--status-success-bg)] to-transparent rounded-xl p-4 border border-[var(--status-success)]/20">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-[var(--text-muted)]">
              Balance Actual
            </span>
            <div className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
              {formatNumber(currentBalance)} CUP
            </div>
          </div>
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",
              isPositive
                ? "bg-[var(--status-success-bg)] text-[var(--status-success)]"
                : "bg-[var(--status-error-bg)] text-[var(--status-error)]",
            )}
          >
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {isPositive ? "+" : ""}
            {percentageChange.toFixed(1)}%
          </div>
        </div>
        <div className="mt-2 text-sm text-[var(--text-muted)]">
          Variación:
          <span
            className={cn(
              "font-bold ml-1 tabular-nums",
              isPositive
                ? "text-[var(--status-success)]"
                : "text-[var(--status-error)]",
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
  const transactions = useStore($walletTransactions);
  const buyRates = useStore($buyRates) ?? {};
  const currentUsdRate = buyRates["USD"] || 1; // Fallback to 1 to avoid division by zero

  // Helper to get profit (uses realProfitCUP if available, falls back to profitCUP)
  const getProfit = (t: (typeof transactions)[0]) =>
    t.realProfitCUP ?? t.profitCUP ?? 0;

  // Calculate profits by time period
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const profitToday = transactions
    .filter((t) => new Date(t.date) >= today)
    .reduce((sum, t) => sum + getProfit(t), 0);

  const profitWeek = transactions
    .filter((t) => new Date(t.date) >= weekAgo)
    .reduce((sum, t) => sum + getProfit(t), 0);

  const profitMonth = transactions
    .filter((t) => new Date(t.date) >= monthAgo)
    .reduce((sum, t) => sum + getProfit(t), 0);

  const profitTotal = transactions.reduce((sum, t) => sum + getProfit(t), 0);

  // Count operations by type for each period
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
    <div className="bg-[var(--bg-primary)] rounded-2xl p-5 border border-[var(--border-primary)]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[var(--status-warning-bg)] flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-[var(--status-warning)]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            Ganancias Reales
          </h3>
          <p className="text-xs text-[var(--text-faint)]">
            Basado en costo real (FIFO)
          </p>
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
              profitToday > 0 ? "text-emerald-400" : "text-neutral-500",
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
              profitWeek > 0 ? "text-emerald-400" : "text-neutral-500",
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
              profitMonth > 0 ? "text-emerald-400" : "text-neutral-500",
            )}
          >
            +{formatNumber(profitMonth)} CUP
          </span>
        </div>

        <div className="flex items-center justify-between py-3">
          <span className="text-sm font-bold text-[var(--text-primary)]">
            Total Histórico
          </span>
          <div className="text-right">
            <span className="block text-lg font-bold text-emerald-400 tabular-nums">
              +{formatNumber(profitTotal)} CUP
            </span>
            <span className="block text-xs text-[var(--text-muted)] tabular-nums">
              ≈ +{formatNumber(profitTotal / currentUsdRate)} USD (@
              {currentUsdRate})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Portfolio Card - Unified inventory + valuation
function PortfolioCard() {
  const transactions = useStore($walletTransactions);
  const sellRates = useStore($sellRates);

  // Calculate portfolio data per currency
  const portfolio: Record<
    string,
    {
      bought: number;
      sold: number;
      available: number;
      totalCost: number;
      currentValue: number;
      unrealizedGain: number;
      gainPercent: number;
    }
  > = {};

  transactions.forEach((txn) => {
    const currency = txn.currency || "USD";
    const amount = txn.amountForeign || 0;

    if (!portfolio[currency]) {
      portfolio[currency] = {
        bought: 0,
        sold: 0,
        available: 0,
        totalCost: 0,
        currentValue: 0,
        unrealizedGain: 0,
        gainPercent: 0,
      };
    }

    if (txn.operationType === "BUY") {
      portfolio[currency].bought += amount;
      portfolio[currency].totalCost += txn.totalCUP;
    } else if (txn.operationType === "SELL") {
      portfolio[currency].sold += amount;
    } else if (
      txn.operationType === "EXCHANGE" &&
      txn.fromCurrency &&
      txn.toCurrency
    ) {
      // EXCHANGE: source currency goes out, target currency comes in
      const fromCurr = txn.fromCurrency;
      const toCurr = txn.toCurrency;
      const amountGiven = txn.amountForeign || 0;
      const amountReceived = txn.amountReceived || 0;
      const derivedCostRate = txn.derivedCostRate || 0;

      // Deduct from source currency
      if (!portfolio[fromCurr]) {
        portfolio[fromCurr] = {
          bought: 0,
          sold: 0,
          available: 0,
          totalCost: 0,
          currentValue: 0,
          unrealizedGain: 0,
          gainPercent: 0,
        };
      }
      portfolio[fromCurr].sold += amountGiven;

      // Add to target currency
      if (!portfolio[toCurr]) {
        portfolio[toCurr] = {
          bought: 0,
          sold: 0,
          available: 0,
          totalCost: 0,
          currentValue: 0,
          unrealizedGain: 0,
          gainPercent: 0,
        };
      }
      portfolio[toCurr].bought += amountReceived;
      portfolio[toCurr].totalCost += amountReceived * derivedCostRate;
    }
  });

  // Calculate valuations
  let totalPortfolioValue = 0;
  let totalPortfolioCost = 0;

  Object.keys(portfolio).forEach((currency) => {
    const p = portfolio[currency];
    p.available = p.bought - p.sold;

    if (p.available > 0) {
      const sellRate = sellRates[currency as Currency] ?? 0;
      p.currentValue = Math.round(p.available * sellRate);

      const avgCost = p.bought > 0 ? p.totalCost / p.bought : 0;
      const costOfAvailable = Math.round(p.available * avgCost);

      p.unrealizedGain = p.currentValue - costOfAvailable;
      p.gainPercent =
        costOfAvailable > 0 ? (p.unrealizedGain / costOfAvailable) * 100 : 0;

      totalPortfolioValue += p.currentValue;
      totalPortfolioCost += costOfAvailable;
    }
  });

  const totalUnrealizedGain = totalPortfolioValue - totalPortfolioCost;
  const totalGainPercent =
    totalPortfolioCost > 0
      ? (totalUnrealizedGain / totalPortfolioCost) * 100
      : 0;

  const currencies = Object.keys(portfolio).filter(
    (c) => portfolio[c].available > 0 || portfolio[c].bought > 0,
  );

  if (currencies.length === 0) return null;

  return (
    <div className="bg-[var(--bg-primary)] rounded-2xl p-5 border border-[var(--border-primary)]">
      {/* Header with total valuation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-[var(--purple-bg)] flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-[var(--purple)]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Mi Portafolio
            </h3>
            <p className="text-xs text-[var(--text-faint)]">
              Valorización actual
            </p>
          </div>
        </div>
        {totalPortfolioValue > 0 && (
          <div className="text-right">
            <p className="text-lg font-bold text-[var(--text-primary)] tabular-nums">
              {formatNumber(totalPortfolioValue)} CUP
            </p>
            <p
              className={cn(
                "text-xs font-bold tabular-nums",
                totalUnrealizedGain >= 0
                  ? "text-[var(--status-success)]"
                  : "text-[var(--status-error)]",
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
          const hasInventory = p.available > 0;
          const isLow = p.available < p.bought * 0.2 && p.available > 0;
          const isEmpty = p.available <= 0;

          return (
            <div
              key={currency}
              className={cn(
                "rounded-xl p-3 border transition-colors",
                isEmpty
                  ? "bg-[var(--bg-secondary)]/50 border-[var(--border-muted)]/50 opacity-60"
                  : isLow
                    ? "bg-[var(--status-warning-bg)] border-[var(--status-warning)]/30"
                    : "bg-[var(--bg-secondary)] border-[var(--border-muted)]",
              )}
            >
              {/* Currency Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{meta?.flag || "💵"}</span>
                  <span className="font-bold text-[var(--text-primary)]">
                    {currency}
                  </span>
                  <span className="text-sm text-neutral-500">
                    {formatNumber(p.available)} disp.
                  </span>
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
                  <div className="bg-[var(--bg-tertiary)] rounded-lg p-2">
                    <div className="text-[10px] text-[var(--text-muted)] uppercase">
                      Valor Actual
                    </div>
                    <div className="text-sm font-bold text-[var(--text-primary)] tabular-nums">
                      {formatNumber(p.currentValue)}
                    </div>
                  </div>
                  <div className="bg-[var(--bg-tertiary)] rounded-lg p-2">
                    <div className="text-[10px] text-[var(--text-muted)] uppercase">
                      Costo
                    </div>
                    <div className="text-sm font-bold text-[var(--text-faint)] tabular-nums">
                      {formatNumber(
                        Math.round(p.available * (p.totalCost / p.bought)),
                      )}
                    </div>
                  </div>
                  <div className="bg-[var(--bg-tertiary)] rounded-lg p-2">
                    <div className="text-[10px] text-[var(--text-muted)] uppercase">
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
    </div>
  );
}

// Sell Simulator Component - Enhanced UX/UI
function SellSimulator() {
  const transactions = useStore($walletTransactions);
  const sellRates = useStore($sellRates);

  // Get currencies with available inventory
  const availableCurrencies: {
    currency: Currency;
    available: number;
    avgCost: number;
  }[] = [];

  const inventoryByCurrency: Record<
    string,
    { bought: number; sold: number; totalCost: number }
  > = {};

  transactions.forEach((txn) => {
    const currency = txn.currency || "USD";
    if (!inventoryByCurrency[currency]) {
      inventoryByCurrency[currency] = { bought: 0, sold: 0, totalCost: 0 };
    }
    if (txn.operationType === "BUY") {
      inventoryByCurrency[currency].bought += txn.amountForeign;
      inventoryByCurrency[currency].totalCost += txn.totalCUP;
    } else {
      inventoryByCurrency[currency].sold += txn.amountForeign;
    }
  });

  Object.entries(inventoryByCurrency).forEach(([currency, data]) => {
    const available = data.bought - data.sold;
    if (available > 0) {
      const avgCost = data.bought > 0 ? data.totalCost / data.bought : 0;
      availableCurrencies.push({
        currency: currency as Currency,
        available,
        avgCost,
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

  const cupReceived = Math.round(qty * rate);
  const costBasis = Math.round(qty * (currencyData?.avgCost ?? 0));
  const profit = cupReceived - costBasis;
  const profitPercent = costBasis > 0 ? (profit / costBasis) * 100 : 0;

  // Quick fill percentages
  const quickFills = [25, 50, 75, 100];

  if (availableCurrencies.length === 0) return null;

  return (
    <div className="bg-[var(--bg-primary)] rounded-2xl p-5 border border-[var(--border-primary)]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[var(--blue-bg)] flex items-center justify-center">
          <Calculator className="w-5 h-5 text-[var(--blue)]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            Simulador de Venta
          </h3>
          <p className="text-xs text-[var(--text-faint)]">
            Calcula tu ganancia antes de vender
          </p>
        </div>
      </div>

      {/* Currency Pills - Horizontal scroll on mobile */}
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
                    ? "bg-[var(--blue-bg)] border-[var(--blue)]/50 text-[var(--blue)]"
                    : "bg-[var(--bg-secondary)] border-[var(--border-muted)] text-[var(--text-muted)] hover:border-[var(--border-primary)]",
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

      {/* Main Input Section - Responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Quantity Section */}
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-muted)]">
          <label className="text-[10px] text-[var(--text-muted)] uppercase block mb-2">
            Cantidad a vender
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="bg-transparent border-0 text-2xl font-bold text-[var(--text-primary)] p-0 h-auto focus:ring-0"
            />
            <span className="text-sm text-[var(--text-muted)]">
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
                    ? "bg-[var(--blue)] text-white border-transparent shadow-sm scale-105"
                    : "bg-[var(--bg-tertiary)] text-[var(--text-muted)] border-transparent hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]",
                )}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        {/* Rate Section */}
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-muted)]">
          <label className="text-[10px] text-[var(--text-muted)] uppercase block mb-2">
            Tasa de venta
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="decimal"
              placeholder={currentRate.toString()}
              value={customRate}
              onChange={(e) => setCustomRate(e.target.value)}
              className="bg-transparent border-0 text-2xl font-bold text-[var(--text-primary)] p-0 h-auto focus:ring-0"
            />
            <span className="text-sm text-[var(--text-muted)]">CUP</span>
          </div>
          <p className="text-[10px] text-neutral-600 mt-2">
            Tasa actual: {formatNumber(currentRate)} CUP/{selectedCurrency}
          </p>
        </div>
      </div>

      {/* Results - Always visible with empty state */}
      <div
        className={cn(
          "rounded-xl p-4 border transition-all",
          qty > 0
            ? "bg-[var(--bg-secondary)] border-[var(--border-muted)]"
            : "bg-[var(--bg-secondary)]/50 border-[var(--border-muted)]/50",
        )}
      >
        {qty > 0 ? (
          <>
            {/* Main Result - Prominent */}
            <div className="text-center mb-4">
              <p className="text-[10px] text-[var(--text-muted)] uppercase mb-1">
                Recibirás
              </p>
              <p className="text-3xl font-bold text-[var(--text-primary)] tabular-nums">
                {formatNumber(cupReceived)}{" "}
                <span className="text-lg text-[var(--text-muted)]">CUP</span>
              </p>
            </div>

            {/* Breakdown */}
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

// Rate Trends Component - Shows rate trends for visible currencies
// Uses El Toque rates ("la bolsa") when available as they represent true market values
// Falls back to manual rates for currencies not in API
function RateTrends() {
  const sellRates = useStore($sellRates);
  const elToqueRates = useStore($elToqueRates);
  const manualRates = useStore($manualElToqueRates);
  const hasHistory = useStore($hasRateHistory);
  const rateHistory = useStore($rateHistory);
  const visibleCurrencies = useStore($visibleCurrencies);

  // Record snapshot using El Toque rates when available (true market values)
  // Fall back to sell rates for currencies without API data
  useEffect(() => {
    // Build rates prioritizing El Toque ("la bolsa") data
    const ratesToRecord: Record<string, number> = {};

    for (const currency of visibleCurrencies) {
      // Priority 1: El Toque API rates (true market values)
      if (
        elToqueRates &&
        elToqueRates[currency as keyof typeof elToqueRates] !== undefined
      ) {
        const rate = elToqueRates[currency as keyof typeof elToqueRates];
        if (typeof rate === "number" && rate > 0) {
          ratesToRecord[currency] = rate;
          continue;
        }
      }

      // Priority 2: Manual El Toque rates (for currencies not in API)
      if (
        isManualElToqueCurrency(currency) &&
        manualRates[currency as keyof typeof manualRates]
      ) {
        ratesToRecord[currency] =
          manualRates[currency as keyof typeof manualRates];
        continue;
      }

      // Priority 3: Fallback removed as per user request
      // Trends now strictly reflect "El Toque" (API or Manual)
      // to avoid polluting market data with personal set rates.
    }

    if (Object.values(ratesToRecord).some((r) => r > 0)) {
      recordRateSnapshot(ratesToRecord as Record<Currency, number>);
    }
  }, [sellRates, elToqueRates, manualRates, visibleCurrencies]);

  // Only show if we have at least 2 days of history
  if (!hasHistory || rateHistory.length < 2) {
    return null;
  }

  // Filter to only visible currencies

  return (
    <div className="bg-[var(--bg-primary)] rounded-2xl p-5 border border-[var(--border-primary)]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[var(--cyan-bg)] flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-[var(--cyan)]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            Tendencia de Tasas
          </h3>
          <p className="text-xs text-[var(--text-faint)]">
            Últimos {rateHistory.length} días
          </p>
        </div>
      </div>

      {/* Currency Trends Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {visibleCurrencies.map((currency) => {
          const trend = getCurrencyTrend(currency, 7);
          const history = getRateHistoryForCurrency(currency, 7);
          const meta = CURRENCY_META[currency];

          if (history.length < 2) return null;

          // Simple sparkline: normalize values to 0-100 range
          const rates = history.map((h) => h.rate);
          const min = Math.min(...rates);
          const max = Math.max(...rates);
          const range = max - min || 1;
          const normalized = rates.map((r) => ((r - min) / range) * 100);

          // Create SVG sparkline path
          const width = 60;
          const height = 20;
          const points = normalized
            .map(
              (val, i) =>
                `${(i / (normalized.length - 1)) * width},${
                  height - (val / 100) * height
                }`,
            )
            .join(" ");

          return (
            <div
              key={currency}
              className="bg-[var(--bg-secondary)] rounded-xl p-3 border border-[var(--border-muted)]"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{meta?.flag}</span>
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    {currency}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded font-bold",
                    trend.isNeutral
                      ? "bg-neutral-500/20 text-neutral-400"
                      : trend.isUp
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-red-500/20 text-red-400",
                  )}
                >
                  {trend.isNeutral ? "•" : trend.isUp ? "▲" : "▼"}{" "}
                  {Math.abs(trend.changePercent).toFixed(1)}%
                </span>
              </div>

              {/* Sparkline */}
              <svg width={width} height={height} className="w-full">
                <polyline
                  points={points}
                  fill="none"
                  stroke={
                    trend.isNeutral
                      ? "#9ca3af"
                      : trend.isUp
                        ? "#10b981"
                        : "#ef4444"
                  }
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <div className="flex justify-between mt-1 text-[10px] text-[var(--text-muted)] tabular-nums">
                <span>{formatNumber(trend.startRate)}</span>
                <span className="font-bold text-[var(--text-primary)]">
                  {formatNumber(trend.endRate)}
                </span>
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
        "space-y-4",
      )}
    >
      {/* Wallet Selector Header */}
      <div className="flex items-center justify-between">
        <WalletSelector />
      </div>

      <LiquidityAlert />
      <CapitalCard />
      <PortfolioCard />
      <SellSimulator />
      <ProfitSummary />
      <RateTrends />
    </main>
  );
}
