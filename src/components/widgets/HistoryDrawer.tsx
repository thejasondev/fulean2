import { useState, useMemo } from "react";
import { useStore } from "@nanostores/react";
import {
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  History,
  Share2,
  Calendar,
  Download,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  $transactions,
  deleteTransaction,
  clearAllHistory,
  type Transaction,
} from "../../stores/historyStore";
import { $isHistoryDrawerOpen, closeHistoryDrawer } from "../../stores/uiStore";
import { confirm } from "../../stores/confirmStore";
import { formatNumber } from "../../lib/formatters";
import { cn } from "../../lib/utils";
import { useToast } from "../ui/Toast";
import { useHaptic } from "../../hooks/useHaptic";
import { Drawer } from "../ui/Drawer";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { ReceiptCard, type ReceiptData } from "./ReceiptCard";
import { CURRENCY_META, type Currency } from "../../lib/constants";
import {
  $wallets,
  getWalletColorHex,
  type Wallet,
} from "../../stores/walletStore";

// ============================================
// HistoryDrawer Component
// Enhanced with Grouped Timeline and Collapsible Sections
// ============================================

// Grouping helpers
interface TransactionGroup {
  label: string;
  key: string;
  transactions: Transaction[];
  isExpanded: boolean;
}

function getGroupKey(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  if (date >= today) {
    return "today";
  } else if (date >= yesterday) {
    return "yesterday";
  } else if (date >= weekAgo) {
    return "this_week";
  } else {
    // Group by month-year
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }
}

function getGroupLabel(key: string): string {
  switch (key) {
    case "today":
      return "Hoy";
    case "yesterday":
      return "Ayer";
    case "this_week":
      return "Esta Semana";
    default:
      // Parse month-year key
      const [year, month] = key.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString("es-CU", {
        month: "long",
        year: "numeric",
      });
  }
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("es-CU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("es-CU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TransactionCard({
  transaction,
  onDelete,
  onShare,
  compact = false,
}: {
  transaction: Transaction;
  onDelete: () => void;
  onShare: () => void;
  compact?: boolean;
}) {
  const isBuy = transaction.operationType === "BUY";
  const isSell = transaction.operationType === "SELL";
  const isExchange = transaction.operationType === "EXCHANGE";
  const Icon = isExchange ? RefreshCw : isBuy ? ArrowDownLeft : ArrowUpRight;
  const haptic = useHaptic();
  const wallets = useStore($wallets);

  // Find wallet for this transaction
  const wallet = transaction.walletId
    ? wallets.find((w: Wallet) => w.id === transaction.walletId)
    : wallets[0];
  const walletColor = wallet ? getWalletColorHex(wallet.color) : "#06b6d4";

  const theme = isExchange
    ? {
        iconBg: "bg-[var(--blue-bg)]",
        iconColor: "text-[var(--blue)]",
        badge: "bg-[var(--blue-bg)] text-[var(--blue)] border-[var(--blue)]/20",
        label: "CAMBIO",
      }
    : isBuy
      ? {
          iconBg: "bg-[var(--status-success-bg)]",
          iconColor: "text-[var(--status-success)]",
          badge:
            "bg-[var(--status-success-bg)] text-[var(--status-success)] border-[var(--status-success)]/20",
          label: "COMPRA",
        }
      : {
          iconBg: "bg-[var(--status-warning-bg)]",
          iconColor: "text-[var(--status-warning)]",
          badge:
            "bg-[var(--status-warning-bg)] text-[var(--status-warning)] border-[var(--status-warning)]/20",
          label: "VENTA",
        };

  const currency = transaction.currency || "USD";
  const amountForeign =
    transaction.amountForeign || transaction.conversions?.USD || 0;
  const rate = transaction.rate || transaction.ratesUsed?.USD || 0;

  const handleShare = () => {
    haptic.light();
    onShare();
  };

  return (
    <div
      className={cn(
        "bg-[var(--bg-primary)] rounded-xl",
        "border border-[var(--border-primary)]",
        "transition-all duration-200",
        "hover:border-[var(--border-secondary)]",
        compact ? "p-3" : "p-4",
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "rounded-xl flex items-center justify-center",
              theme.iconBg,
              compact ? "w-8 h-8" : "w-10 h-10",
            )}
          >
            <Icon
              className={cn(theme.iconColor, compact ? "w-4 h-4" : "w-5 h-5")}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-xs font-bold px-1.5 py-0.5 rounded border",
                  theme.badge,
                )}
              >
                {theme.label}
              </span>
              {wallet && (
                <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: walletColor }}
                  />
                  <span className="max-w-[60px] truncate">{wallet.name}</span>
                </span>
              )}
            </div>
            <div className="text-sm font-medium text-[var(--text-primary)] mt-1">
              {isExchange ? (
                <>
                  {transaction.amountForeign} {transaction.fromCurrency} →{" "}
                  {transaction.amountReceived} {transaction.toCurrency}
                </>
              ) : (
                <>{formatNumber(transaction.totalCUP)} CUP</>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleShare}
            className={cn(
              "w-8 h-8 flex items-center justify-center",
              "text-[var(--text-faint)] hover:text-[var(--text-primary)]",
              "hover:bg-[var(--bg-hover)] rounded-lg",
              "transition-colors duration-200",
            )}
            aria-label="Compartir comprobante"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className={cn(
              "w-8 h-8 flex items-center justify-center",
              "text-[var(--text-faint)] hover:text-[var(--status-error)]",
              "hover:bg-[var(--status-error-bg)] rounded-lg",
              "transition-colors duration-200",
            )}
            aria-label="Eliminar transacción"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Compact Details */}
      <div
        className={cn(
          "grid grid-cols-2 gap-2 text-xs rounded-lg border border-[var(--border-primary)]/50",
          compact ? "bg-[var(--bg-base)]/30 p-2" : "bg-[var(--bg-base)]/50 p-3",
        )}
      >
        {isExchange ? (
          <>
            <div>
              <div className="text-[var(--text-faint)] mb-0.5">Entregado</div>
              <div className="font-semibold text-[var(--status-error)]">
                -{transaction.amountForeign} {transaction.fromCurrency}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[var(--text-faint)] mb-0.5">Recibido</div>
              <div className="font-semibold text-[var(--status-success)]">
                +{transaction.amountReceived} {transaction.toCurrency}
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <div className="text-[var(--text-faint)] mb-0.5">Operación</div>
              <div className="font-semibold text-[var(--text-primary)]">
                {amountForeign} {currency}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[var(--text-faint)] mb-0.5">Tasa</div>
              <div className="font-semibold text-[var(--text-secondary)]">
                1 {currency} = {rate} CUP
              </div>
            </div>
          </>
        )}
      </div>

      {/* Exchange Rate Footer */}
      {isExchange && (
        <div className="text-xs text-[var(--text-muted)] mt-2 text-center">
          Tasa: 1 {transaction.fromCurrency} = {transaction.exchangeRate}{" "}
          {transaction.toCurrency}
        </div>
      )}

      {/* Note Display */}
      {transaction.note && (
        <div className="mt-2 px-3 py-2 bg-[var(--bg-secondary)]/50 rounded-lg border border-[var(--border-muted)]/50">
          <div className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
            <span className="opacity-60">📝</span>
            <span className="italic">{transaction.note}</span>
          </div>
        </div>
      )}

      {/* Date Footer */}
      <div className="flex items-center gap-1 mt-2 text-[10px] text-[var(--text-faint)]">
        <Calendar className="w-3 h-3" />
        <span>{formatDateTime(transaction.date)}</span>
      </div>
    </div>
  );
}

// Grouped Section Component
function GroupSection({
  group,
  onToggle,
  onDeleteTransaction,
  onShareTransaction,
}: {
  group: TransactionGroup;
  onToggle: () => void;
  onDeleteTransaction: (id: string) => void;
  onShareTransaction: (txn: Transaction) => void;
}) {
  const isRecent = ["today", "yesterday", "this_week"].includes(group.key);

  return (
    <div className="mb-4">
      {/* Group Header */}
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between py-2 px-3 rounded-lg",
          "bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)]",
          "transition-colors duration-200",
          "sticky top-0 z-10",
        )}
      >
        <div className="flex items-center gap-2">
          {group.isExpanded ? (
            <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
          )}
          <span className="text-sm font-semibold text-[var(--text-primary)] capitalize">
            {group.label}
          </span>
        </div>
        <span className="text-xs text-[var(--text-faint)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full">
          {group.transactions.length}
        </span>
      </button>

      {/* Transactions */}
      {group.isExpanded && (
        <div className="mt-2 space-y-2 pl-2 border-l-2 border-[var(--border-primary)] ml-2">
          {group.transactions.map((txn) => (
            <TransactionCard
              key={txn.id}
              transaction={txn}
              compact={!isRecent}
              onDelete={() => onDeleteTransaction(txn.id)}
              onShare={() => onShareTransaction(txn)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function HistoryDrawer() {
  const isOpen = useStore($isHistoryDrawerOpen) ?? false;
  const transactions = useStore($transactions) ?? [];
  const { toast } = useToast();
  const haptic = useHaptic();

  // Receipt modal state
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  // Expanded groups state
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(["today", "yesterday", "this_week"]),
  );

  // Group transactions by period
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};

    transactions.forEach((txn) => {
      const key = getGroupKey(new Date(txn.date));
      if (!groups[key]) groups[key] = [];
      groups[key].push(txn);
    });

    // Sort groups: recent first, then by date descending
    const sortOrder = ["today", "yesterday", "this_week"];
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const aIndex = sortOrder.indexOf(a);
      const bIndex = sortOrder.indexOf(b);

      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;

      // Both are month keys, sort descending
      return b.localeCompare(a);
    });

    return sortedKeys.map((key) => ({
      label: getGroupLabel(key),
      key,
      transactions: groups[key],
      isExpanded: expandedGroups.has(key),
    }));
  }, [transactions, expandedGroups]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: "Eliminar transacción",
      message:
        "¿Estás seguro de que deseas eliminar esta transacción? Se revertirán los cambios en el inventario y capital asociados.",
      confirmLabel: "Eliminar",
      cancelLabel: "Cancelar",
      variant: "danger",
    });

    if (confirmed) {
      haptic.heavy();
      deleteTransaction(id);
      toast.info("Transacción eliminada y revertida");
    }
  };

  const handleClearAll = async () => {
    const confirmed = await confirm({
      title: "Borrar historial",
      message: "¿Estás seguro de que deseas eliminar todo el historial?",
      confirmLabel: "Sí, borrar todo",
      cancelLabel: "Cancelar",
      variant: "danger",
    });

    if (confirmed) {
      haptic.heavy();
      clearAllHistory();
      toast.info("Historial eliminado");
    }
  };

  const handleShare = (txn: Transaction) => {
    setReceiptData({
      operationType: txn.operationType || "BUY",
      currency: txn.currency || "USD",
      amountForeign: txn.amountForeign || txn.conversions?.USD || 0,
      rate: txn.rate || txn.ratesUsed?.USD || 0,
      totalCUP: txn.totalCUP,
      date: new Date(txn.date),
    });
  };

  const handleShareAll = async () => {
    if (transactions.length === 0) return;

    haptic.medium();

    // Generate summary text for all transactions
    const lines: string[] = [
      "📋 RESUMEN DE OPERACIONES",
      "═══════════════════════",
      "",
    ];

    // Volume summary
    const volumeByCurrency: Record<string, { buy: number; sell: number }> = {};
    let totalCUPBuy = 0;
    let totalCUPSell = 0;

    transactions.forEach((txn) => {
      const currency = txn.currency || "USD";
      const amount = txn.amountForeign || txn.conversions?.USD || 0;

      if (!volumeByCurrency[currency]) {
        volumeByCurrency[currency] = { buy: 0, sell: 0 };
      }

      if (txn.operationType === "BUY") {
        volumeByCurrency[currency].buy += amount;
        totalCUPBuy += txn.totalCUP;
      } else {
        volumeByCurrency[currency].sell += amount;
        totalCUPSell += txn.totalCUP;
      }
    });

    lines.push("📊 VOLUMEN TOTAL:");
    Object.keys(volumeByCurrency).forEach((currency) => {
      const { buy, sell } = volumeByCurrency[currency];
      if (buy > 0 || sell > 0) {
        lines.push(
          `  ${currency}: Compra ${formatNumber(buy)} | Venta ${formatNumber(sell)}`,
        );
      }
    });
    lines.push("");
    lines.push(`💵 Total CUP Comprado: ${formatNumber(totalCUPBuy)}`);
    lines.push(`💵 Total CUP Vendido: ${formatNumber(totalCUPSell)}`);
    lines.push("");
    lines.push("───────────────────────");
    lines.push("📝 DETALLE DE OPERACIONES:");
    lines.push("");

    // Individual transactions
    transactions.forEach((txn, index) => {
      const currency = txn.currency || "USD";
      const amount = txn.amountForeign || txn.conversions?.USD || 0;
      const rate = txn.rate || txn.ratesUsed?.USD || 0;
      const date = formatDateTime(txn.date);
      const type =
        txn.operationType === "EXCHANGE"
          ? "🔵 CAMBIO"
          : txn.operationType === "BUY"
            ? "🟢 COMPRA"
            : "🟡 VENTA";

      lines.push(`${index + 1}. ${type}`);
      lines.push(
        `   ${amount} ${currency} @ ${rate} = ${formatNumber(txn.totalCUP)} CUP`,
      );
      lines.push(`   📅 ${date}`);
      lines.push("");
    });

    lines.push("───────────────────────");
    lines.push("Generado con Fulean2");

    const text = lines.join("\n");

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Resumen de Operaciones - Fulean2",
          text,
        });
        toast.success("Resumen compartido");
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Resumen copiado al portapapeles");
      }
    } catch {
      toast.error("Error al compartir");
    }
  };

  return (
    <>
      <Drawer isOpen={isOpen} onClose={closeHistoryDrawer} title="Historial">
        <div className="p-4">
          {transactions.length === 0 ? (
            // Empty state
            <div className="empty-state py-16">
              <History className="empty-state-icon" />
              <p className="text-[var(--text-muted)] font-medium">
                No hay transacciones
              </p>
              <p className="text-xs text-[var(--text-faint)] mt-1">
                Las operaciones registradas aparecerán aquí
              </p>
            </div>
          ) : (
            <>
              {/* Stats & Actions Row */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-[var(--text-faint)]">
                  {transactions.length} operación
                  {transactions.length !== 1 ? "es" : ""}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShareAll}
                    className="gap-1"
                  >
                    <Download className="w-4 h-4" />
                    Exportar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleClearAll}>
                    Borrar todo
                  </Button>
                </div>
              </div>

              {/* Grouped Transaction List */}
              <div className="space-y-1">
                {groupedTransactions.map((group) => (
                  <GroupSection
                    key={group.key}
                    group={group}
                    onToggle={() => toggleGroup(group.key)}
                    onDeleteTransaction={handleDelete}
                    onShareTransaction={handleShare}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </Drawer>

      {/* Receipt Modal */}
      <Modal
        isOpen={receiptData !== null}
        onClose={() => setReceiptData(null)}
        title="Comprobante"
      >
        {receiptData && (
          <ReceiptCard
            data={receiptData}
            onClose={() => setReceiptData(null)}
          />
        )}
      </Modal>
    </>
  );
}
