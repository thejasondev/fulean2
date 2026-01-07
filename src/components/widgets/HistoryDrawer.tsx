import { useState } from "react";
import { useStore } from "@nanostores/react";
import {
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Share2,
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
import { WeeklySummary } from "./WeeklySummary";

// ============================================
// HistoryDrawer Component
// Transaction history with BUY/SELL visualization + Receipt Sharing
// ============================================

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
        iconBg: "bg-emerald-500/15",
        iconColor: "text-emerald-400",
        badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      }
    : {
        iconBg: "bg-amber-500/15",
        iconColor: "text-amber-400",
        badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      };

  // Fallback for legacy transactions
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
        "bg-neutral-900 rounded-xl p-4",
        "border border-neutral-800",
        "transition-all duration-200",
        "hover:border-neutral-700"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              theme.iconBg
            )}
          >
            <Icon className={cn("w-5 h-5", theme.iconColor)} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-xs font-bold px-1.5 py-0.5 rounded border",
                  theme.badge
                )}
              >
                {isBuy ? "COMPRA" : "VENTA"}
              </span>
              <span className="text-xs text-neutral-500">
                {formatTime(transaction.date)}
              </span>
            </div>
            <div className="text-sm font-medium text-white mt-1">
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
              "text-neutral-500 hover:text-white",
              "hover:bg-white/10 rounded-lg",
              "transition-colors duration-200"
            )}
            aria-label="Compartir comprobante"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className={cn(
              "w-8 h-8 flex items-center justify-center",
              "text-neutral-500 hover:text-red-400",
              "hover:bg-red-500/10 rounded-lg",
              "transition-colors duration-200"
            )}
            aria-label="Eliminar transacción"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs bg-neutral-950/50 p-3 rounded-lg border border-neutral-800/50">
        <div>
          <div className="text-neutral-500 mb-0.5">Operación</div>
          <div className="font-semibold text-white">
            {amountForeign} {currency}
          </div>
        </div>
        <div className="text-right">
          <div className="text-neutral-500 mb-0.5">Tasa</div>
          <div className="font-semibold text-neutral-300">
            1 {currency} = {rate} CUP
          </div>
        </div>
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

  return (
    <>
      <Drawer isOpen={isOpen} onClose={closeHistoryDrawer} title="Historial">
        <div className="p-4">
          {transactions.length === 0 ? (
            // Empty state
            <div className="empty-state py-16">
              <History className="empty-state-icon" />
              <p className="text-neutral-400 font-medium">
                No hay transacciones
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                Las operaciones registradas aparecerán aquí
              </p>
            </div>
          ) : (
            <>
              {/* Weekly Analytics */}
              <WeeklySummary />

              {/* Stats */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-neutral-500">
                  {transactions.length} operación
                  {transactions.length !== 1 ? "es" : ""}
                </span>
                <Button variant="ghost" size="sm" onClick={handleClearAll}>
                  Borrar todo
                </Button>
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
