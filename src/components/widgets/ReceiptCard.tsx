import { useRef } from "react";
import { ArrowDownLeft, ArrowUpRight, Share2 } from "lucide-react";
import {
  shareReceipt,
  formatReceiptDate,
  formatReceiptTime,
} from "../../lib/share";
import { useToast } from "../ui/Toast";
import { useHaptic } from "../../hooks/useHaptic";
import { cn } from "../../lib/utils";
import type {
  OperationType,
  TransactionCurrency,
} from "../../stores/historyStore";

// ============================================
// ReceiptCard Component
// Generates a shareable transaction receipt
// ============================================

export interface ReceiptData {
  operationType: OperationType;
  currency: TransactionCurrency;
  amountForeign: number;
  rate: number;
  totalCUP: number;
  date: Date;
}

interface ReceiptCardProps {
  data: ReceiptData;
  onClose?: () => void;
}

export function ReceiptCard({ data, onClose }: ReceiptCardProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const haptic = useHaptic();

  const isBuy = data.operationType === "BUY";

  const handleShare = async () => {
    if (!receiptRef.current) return;

    haptic.medium();

    const success = await shareReceipt({
      element: receiptRef.current,
      filename: `fulean2-${isBuy ? "compra" : "venta"}-${Date.now()}`,
    });

    if (success) {
      haptic.success();
      toast.success("Comprobante compartido");
    } else {
      haptic.error();
      toast.error("Error al compartir");
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* Receipt Preview */}
      <div
        ref={receiptRef}
        className={cn(
          "w-[320px] rounded-2xl overflow-hidden",
          "bg-neutral-950 border border-neutral-800",
          "shadow-2xl"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "p-4 text-center border-b border-dashed border-neutral-700",
            isBuy ? "bg-emerald-500/10" : "bg-amber-500/10"
          )}
        >
          <div className="flex items-center justify-center gap-1 mb-2">
            <span className="font-extrabold text-xl tracking-tighter text-white">
              Fulean
            </span>
            <span className="font-extrabold text-xl tracking-tighter bg-gradient-to-tr from-emerald-400 to-green-300 bg-clip-text text-transparent">
              2
            </span>
          </div>
          <div className="text-xs text-neutral-500">
            {formatReceiptDate(data.date)} • {formatReceiptTime(data.date)}
          </div>
        </div>

        {/* Operation Badge */}
        <div className="p-4 flex justify-center">
          <div
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold",
              isBuy
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
            )}
          >
            {isBuy ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
            {isBuy ? "COMPRA" : "VENTA"}
          </div>
        </div>

        {/* Transaction Details */}
        <div className="px-4 pb-4 space-y-3">
          {/* Foreign Amount */}
          <div className="flex justify-between items-center">
            <span className="text-neutral-500 text-sm">Monto</span>
            <span className="text-white font-bold tabular-nums text-lg">
              {data.amountForeign.toFixed(2)} {data.currency}
            </span>
          </div>

          {/* Rate */}
          <div className="flex justify-between items-center">
            <span className="text-neutral-500 text-sm">Tasa</span>
            <span className="text-neutral-300 font-medium tabular-nums">
              1 {data.currency} = {data.rate} CUP
            </span>
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-neutral-700 my-2" />

          {/* Total CUP */}
          <div className="flex justify-between items-center">
            <span className="text-neutral-400 text-sm font-medium">
              {isBuy ? "Pagado" : "Recibido"}
            </span>
            <span
              className={cn(
                "font-bold tabular-nums text-2xl",
                isBuy ? "text-emerald-400" : "text-amber-400"
              )}
            >
              {data.totalCUP.toLocaleString("es-CU")} CUP
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-neutral-900/50 p-3 text-center border-t border-neutral-800">
          <div className="text-[10px] text-neutral-600 uppercase tracking-widest">
            Comprobante Digital
          </div>
        </div>
      </div>

      {/* Share Button */}
      <button
        onClick={handleShare}
        className={cn(
          "flex items-center gap-2 px-6 py-3 rounded-full",
          "bg-white text-neutral-950 font-bold text-sm",
          "hover:bg-neutral-200 active:scale-95",
          "transition-all duration-200 shadow-lg"
        )}
      >
        <Share2 size={18} />
        Compartir Comprobante
      </button>

      {onClose && (
        <button
          onClick={onClose}
          className="text-neutral-500 text-sm hover:text-neutral-300 transition-colors"
        >
          Cerrar
        </button>
      )}
    </div>
  );
}
