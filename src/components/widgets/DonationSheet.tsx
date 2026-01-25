import { useState } from "react";
import { useStore } from "@nanostores/react";
import { Heart, Smartphone, Copy, Check } from "lucide-react";
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

        {/* Card Number Display */}
        <div className="bg-[var(--bg-base)] rounded-xl p-4 border border-[var(--border-primary)]">
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
                "p-2.5 rounded-lg transition-all flex-shrink-0", // Icon button style
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

        {/* Instructions */}
        <div className="p-3 bg-[var(--bg-base)] rounded-lg border border-[var(--border-primary)]">
          <p className="text-xs text-[var(--text-faint)] leading-relaxed">
            <strong className="text-[var(--text-muted)]">Cómo donar:</strong>
            <br />
            1. Autentícate desde tu app bancaria y vuelve a nuestra app.
            <br />
            2. Copia la tarjeta de donación y selecciona la cantidad deseada.
            <br />
            2.1. Sigue los pasos de la transferencia bancaria, pegando la
            tarjeta y llenando el monto deseado.
            <br />
            3. Finaliza la transferencia y espera a que se confirme.
            <br />
            4. GRACIAS!!
          </p>
        </div>
      </div>

      {/* Developer Credit - Premium Design */}
      <div className="mt-2 mb-4 pt-2 border-t border-[var(--border-muted)]">
        <a
          href="https://thejasondev.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "relative group flex items-center gap-4 p-3 pr-4 rounded-2xl",
            "bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)]",
            "border border-[var(--border-primary)] hover:border-[var(--accent)]/50",
            "shadow-sm hover:shadow-[0_4px_12px_-4px_rgba(var(--accent-rgb),0.2)]",
            "transition-all duration-300 transform hover:-translate-y-0.5",
          )}
        >
          {/* Avatar Container with Gradient Ring */}
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-[var(--accent)] to-[var(--blue)] rounded-full blur-[2px] opacity-70 group-hover:opacity-100 transition-opacity" />
            <div className="relative w-10 h-10 rounded-full bg-[var(--bg-base)] p-0.5 flex items-center justify-center border border-[var(--bg-primary)]">
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-[var(--accent)] to-[var(--blue)] flex items-center justify-center text-white font-bold text-xs tracking-tighter">
                JG
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-[var(--text-faint)] font-medium uppercase tracking-wider mb-0.5">
              Code & Design
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-[var(--text-primary)] group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[var(--accent)] group-hover:to-[var(--blue)] transition-all">
                @thejasondev
              </span>
              <svg
                className="w-3 h-3 text-[var(--text-muted)] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 17l9.2-9.2M17 17V7H7" />
              </svg>
            </div>
          </div>
        </a>
      </div>
    </Modal>
  );
}
