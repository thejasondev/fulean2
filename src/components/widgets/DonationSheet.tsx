import { useState } from "react";
import { useStore } from "@nanostores/react";
import {
  Heart,
  Smartphone,
  Copy,
  Check,
  QrCode,
  CreditCard,
} from "lucide-react";
import { $isDonationOpen, closeDonation } from "../../stores/uiStore";
import { cn } from "../../lib/utils";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";

// ============================================
// DonationSheet Component
// Bank Card Transfer for supporting development
// Theme-aware using CSS variables
// ============================================

export function DonationSheet() {
  const isOpen = useStore($isDonationOpen);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Bank card number for receiving donations
  const CARD_NUMBER = "9234 0699 9301 9516";
  const CARD_NUMBER_CLEAN = CARD_NUMBER.replace(/\s/g, "");

  const presetAmounts = [250, 500, 1000];

  const handleSelectAmount = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleCustomChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const finalAmount = selectedAmount || parseInt(customAmount) || 0;

  const handleCopyCard = async () => {
    try {
      await navigator.clipboard.writeText(CARD_NUMBER_CLEAN);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: ignore
    }
  };

  // Open Transfermóvil bank transfer menu
  const handleDonate = () => {
    if (finalAmount < 50) return;
    window.location.href = "tel:*444*45%23";
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeDonation}
      title="Apoya el Desarrollo"
      size="md"
    >
      <div className="p-4 space-y-4">
        {/* Heart Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--pink-bg)] flex items-center justify-center">
            <Heart className="w-8 h-8 text-[var(--pink)]" />
          </div>
        </div>

        {/* Message */}
        <p className="text-sm text-[var(--text-muted)] text-center">
          Tu donación ayuda a mantener Fulean2 gratis y en constante mejora.
          ¡Gracias por tu apoyo!
        </p>

        {/* Card Section with QR Toggle */}
        <div className="bg-[var(--bg-base)] rounded-xl overflow-hidden border border-[var(--border-primary)]">
          {/* Toggle Tabs */}
          <div className="flex border-b border-[var(--border-primary)]">
            <button
              onClick={() => setShowQR(false)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium transition-all",
                !showQR
                  ? "bg-[var(--pink-bg)] text-[var(--pink)] border-b-2 border-[var(--pink)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
              )}
            >
              <CreditCard className="w-4 h-4" />
              Número
            </button>
            <button
              onClick={() => setShowQR(true)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium transition-all",
                showQR
                  ? "bg-[var(--pink-bg)] text-[var(--pink)] border-b-2 border-[var(--pink)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
              )}
            >
              <QrCode className="w-4 h-4" />
              Escanear QR
            </button>
          </div>

          {/* Content Area */}
          <div className="p-4">
            {showQR ? (
              /* QR Code View */
              <div className="flex flex-col items-center gap-3">
                <div className="bg-white p-3 rounded-xl shadow-inner">
                  <img
                    src="/codigoqr.JPG"
                    alt="QR de tarjeta bancaria"
                    className="w-40 h-40 object-contain"
                  />
                </div>
                <p className="text-[11px] text-[var(--text-faint)] text-center">
                  Escanea este código con <strong>Transfermóvil</strong> para
                  añadir la tarjeta automáticamente
                </p>
              </div>
            ) : (
              /* Card Number View */
              <div>
                <p className="text-[10px] text-[var(--text-faint)] uppercase mb-2">
                  Transferir a tarjeta:
                </p>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-lg sm:text-xl font-mono font-bold text-[var(--text-primary)] tracking-wider whitespace-nowrap overflow-hidden text-ellipsis">
                    {CARD_NUMBER}
                  </span>
                  <button
                    onClick={handleCopyCard}
                    className={cn(
                      "p-2.5 rounded-lg transition-all flex-shrink-0",
                      copied
                        ? "bg-[var(--status-success-bg)] text-[var(--status-success)]"
                        : "bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]",
                    )}
                    title="Copiar número de tarjeta"
                  >
                    {copied ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preset Amounts */}
        <div className="grid grid-cols-3 gap-3">
          {presetAmounts.map((amount) => (
            <button
              key={amount}
              onClick={() => handleSelectAmount(amount)}
              className={cn(
                "py-4 rounded-xl font-bold text-base transition-all border",
                selectedAmount === amount
                  ? "bg-[var(--pink-bg)] border-[var(--pink)]/50 text-[var(--pink)]"
                  : "bg-[var(--bg-base)] border-[var(--border-primary)] text-[var(--text-muted)] hover:border-[var(--border-secondary)]",
              )}
            >
              {amount} CUP
            </button>
          ))}
        </div>

        {/* Custom Amount */}
        <Input
          type="number"
          inputMode="numeric"
          placeholder="Otro monto (CUP)"
          value={customAmount}
          onChange={(e) => handleCustomChange(e.target.value)}
          className={cn(
            "bg-[var(--bg-base)] border-[var(--border-primary)] text-center text-lg",
            customAmount && "border-[var(--pink)]/50",
          )}
        />

        {/* Donate Button */}
        <button
          onClick={handleDonate}
          disabled={finalAmount < 50}
          className={cn(
            "w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2",
            finalAmount >= 50
              ? "bg-[var(--pink)] text-[var(--text-inverted)] hover:opacity-90"
              : "bg-[var(--bg-secondary)] text-[var(--text-faint)] cursor-not-allowed",
          )}
        >
          <Smartphone className="w-5 h-5" />
          {finalAmount >= 50
            ? `Donar ${finalAmount} CUP via Transfermóvil`
            : "Selecciona un monto (min. 50 CUP)"}
        </button>

        {/* Instructions - Simplified */}
        <div className="p-3 bg-[var(--bg-base)] rounded-lg border border-[var(--border-primary)]">
          <p className="text-xs text-[var(--text-faint)] leading-relaxed">
            <strong className="text-[var(--text-muted)]">Pasos rápidos:</strong>
            <br />
            1. Escanea el QR o copia la tarjeta
            <br />
            2. Abre Transfermóvil → Transferir
            <br />
            3. Pega/selecciona la tarjeta y completa
          </p>
        </div>
      </div>

      {/* Developer Credit - Enhanced Premium Design */}
      <div className="mt-4 pt-4 px-4 pb-4 border-t border-[var(--border-muted)]">
        <a
          href="https://www.instagram.com/thejasondev"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "relative group flex items-center gap-4 p-4 rounded-2xl",
            "bg-gradient-to-br from-[var(--bg-base)] via-[var(--bg-secondary)] to-[var(--bg-primary)]",
            "border border-[var(--border-primary)]",
            "hover:border-transparent",
            "transition-all duration-500",
            "before:absolute before:inset-0 before:rounded-2xl before:p-[1px]",
            "before:bg-gradient-to-r before:from-[#833AB4] before:via-[#FD1D1D] before:to-[#F77737]",
            "before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500",
            "before:-z-10",
            "overflow-hidden",
          )}
        >
          {/* Animated Glow Effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] blur-xl" />

          {/* Avatar with Instagram Gradient Ring */}
          <div className="relative shrink-0">
            {/* Animated gradient ring */}
            <div
              className={cn(
                "absolute -inset-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                "bg-gradient-to-tr from-[#833AB4] via-[#FD1D1D] to-[#F77737]",
                "animate-spin",
              )}
              style={{ animationDuration: "3s" }}
            />
            <div className="relative w-12 h-12 rounded-full bg-[var(--bg-base)] p-[3px]">
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center">
                <span className="text-white font-black text-sm tracking-tight">
                  JG
                </span>
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-[var(--text-faint)] font-medium uppercase tracking-widest mb-1">
              Desarrollado & diseñado
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-base font-bold text-[var(--text-primary)]",
                  "group-hover:text-transparent group-hover:bg-clip-text",
                  "group-hover:bg-gradient-to-r group-hover:from-[#833AB4] group-hover:via-[#FD1D1D] group-hover:to-[#F77737]",
                  "transition-all duration-300",
                )}
              >
                @thejasondev
              </span>
              {/* Instagram Icon */}
              <svg
                className="w-4 h-4 text-[var(--text-faint)] group-hover:text-[#E1306C] transition-colors"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </div>
          </div>

          {/* Arrow indicator */}
          <svg
            className="w-5 h-5 text-[var(--text-faint)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </Modal>
  );
}
