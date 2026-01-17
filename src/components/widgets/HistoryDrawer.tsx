import { useState } from "react";
import { useStore } from "@nanostores/react";
import {
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Share2,
  Calendar,
  Download,
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

// ============================================
// HistoryDrawer Component
// Enhanced with Volume Summary and Share All
// Theme-aware using CSS variables
// ============================================

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

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("es-CU", {
    day: "2-digit",
    month: "short",
  });
}

function TransactionCard({
  transaction,
  onDelete,
  onShare,
}: {
  transaction: Transaction;
  onDelete: () => void;
  onShare: () => void;
}) {
  const isBuy = transaction.operationType === "BUY";
  const Icon = isBuy ? ArrowDownLeft : ArrowUpRight;
  const haptic = useHaptic();

  const theme = isBuy
    ? {
        iconBg: "bg-[var(--status-success-bg)]",
        iconColor: "text-[var(--status-success)]",
        badge:
          "bg-[var(--status-success-bg)] text-[var(--status-success)] border-[var(--status-success)]/20",
      }
    : {
        iconBg: "bg-[var(--status-warning-bg)]",
        iconColor: "text-[var(--status-warning)]",
        badge:
          "bg-[var(--status-warning-bg)] text-[var(--status-warning)] border-[var(--status-warning)]/20",
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
        "bg-[var(--bg-primary)] rounded-xl p-4",
        "border border-[var(--border-primary)]",
        "transition-all duration-200",
        "hover:border-[var(--border-secondary)]",
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              theme.iconBg,
            )}
          >
            <Icon className={cn("w-5 h-5", theme.iconColor)} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-xs font-bold px-1.5 py-0.5 rounded border",
                  theme.badge,
                )}
              >
                {isBuy ? "COMPRA" : "VENTA"}
              </span>
            </div>
            <div className="text-sm font-medium text-[var(--text-primary)] mt-1">
              {formatNumber(transaction.totalCUP)} CUP
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

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs bg-[var(--bg-base)]/50 p-3 rounded-lg border border-[var(--border-primary)]/50">
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
      </div>

      {/* Date Footer */}
      <div className="flex items-center gap-1 mt-3 text-[10px] text-[var(--text-faint)]">
        <Calendar className="w-3 h-3" />
        <span>{formatDateTime(transaction.date)}</span>
      </div>
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

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: "Eliminar transacción",
      message: "¿Estás seguro de que deseas eliminar esta transacción?",
      confirmLabel: "Eliminar",
      cancelLabel: "Cancelar",
      variant: "danger",
    });

    if (confirmed) {
      haptic.heavy();
      deleteTransaction(id);
      toast.info("Transacción eliminada");
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
          `  ${currency}: Compra ${formatNumber(buy)} | Venta ${formatNumber(
            sell,
          )}`,
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
      const type = txn.operationType === "BUY" ? "🟢 COMPRA" : "🟡 VENTA";

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
                    Compartir Todo
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleClearAll}>
                    Borrar todo
                  </Button>
                </div>
              </div>

              {/* Transaction List */}
              <div className="space-y-3">
                {transactions.map((txn) => (
                  <TransactionCard
                    key={txn.id}
                    transaction={txn}
                    onDelete={() => handleDelete(txn.id)}
                    onShare={() => handleShare(txn)}
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
