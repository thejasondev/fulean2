import { useState } from "react";
import { useStore } from "@nanostores/react";
import { Heart, Smartphone, X } from "lucide-react";
import { $isDonationOpen, closeDonation } from "../../stores/uiStore";
import { cn } from "../../lib/utils";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";

// ============================================
// DonationSheet Component
// Bank Card Transfer for supporting development
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
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Heart Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-pink-500/15 flex items-center justify-center">
            <Heart className="w-8 h-8 text-pink-400" />
          </div>
        </div>

        {/* Message */}
        <p className="text-sm text-neutral-400 text-center">
          Tu donación ayuda a mantener Fulean2 gratis y en constante mejora.
          ¡Gracias por tu apoyo!
        </p>

        {/* Card Number Display */}
        <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800">
          <p className="text-[10px] text-neutral-500 uppercase mb-2">
            Transferir a tarjeta:
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xl font-mono font-bold text-white tracking-wider">
              {CARD_NUMBER}
            </span>
            <button
              onClick={handleCopyCard}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                copied
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-neutral-800 text-neutral-400 hover:text-white"
              )}
            >
              {copied ? "✓ Copiado" : "Copiar"}
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
                  ? "bg-pink-500/20 border-pink-500/50 text-pink-400"
                  : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
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
            "bg-neutral-950 border-neutral-800 text-center text-lg",
            customAmount && "border-pink-500/50"
          )}
        />

        {/* Donate Button */}
        <button
          onClick={handleDonate}
          disabled={finalAmount < 50}
          className={cn(
            "w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2",
            finalAmount >= 50
              ? "bg-pink-500 text-white hover:bg-pink-600"
              : "bg-neutral-800 text-neutral-600 cursor-not-allowed"
          )}
        >
          <Smartphone className="w-5 h-5" />
          {finalAmount >= 50
            ? `Donar ${finalAmount} CUP via Transfermóvil`
            : "Selecciona un monto (min. 50 CUP)"}
        </button>

        {/* Instructions */}
        <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800">
          <p className="text-xs text-neutral-500 leading-relaxed">
            <strong className="text-neutral-400">Cómo donar:</strong>
            <br />
            1. Autentícate desde tu app bancaria y vuelve a nuestra app.
            <br />
            2. Copia la tarjeta de donación y selecciona la cantidad deseada.
            <br />
            3. Transfiere a la tarjeta copiada la cantidad deseada.
          </p>
        </div>
      </div>
    </Modal>
  );
}
