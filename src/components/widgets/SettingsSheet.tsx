import { useStore } from "@nanostores/react";
import { useState } from "react";
import {
  RotateCcw,
  TrendingUp,
  Zap,
  RefreshCw,
  Pencil,
  Eye,
  Heart,
  Smartphone,
  Sun,
} from "lucide-react";
import {
  $buyRates,
  $sellRates,
  $spreads,
  $elToqueRates,
  $isLoadingElToque,
  $manualElToqueRates,
  setBuyRate,
  setSellRate,
  setManualElToqueRate,
  isManualElToqueCurrency,
  resetRates,
  loadElToqueRates,
} from "../../stores/ratesStore";
import {
  $visibleDenominations,
  $visibleCurrencies,
  toggleDenomination,
  toggleCurrency,
} from "../../stores/visibilityStore";
import { $theme, toggleTheme } from "../../stores/themeStore";
import { $isSettingsOpen, closeSettings } from "../../stores/uiStore";
import {
  CURRENCIES,
  DENOMINATIONS,
  CURRENCY_META,
  CASH_CURRENCIES,
  DIGITAL_CURRENCIES,
  type Currency,
  type Denomination,
} from "../../lib/constants";
import { cn } from "../../lib/utils";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Toggle } from "../ui/Toggle";
import { useHaptic } from "../../hooks/useHaptic";

// ============================================
// SettingsSheet Component
// Buy/Sell rate editing with El Toque reference
// Theme-aware using CSS variables
// ============================================

function RateRow({ currency }: { currency: Currency }) {
  const buyRates = useStore($buyRates);
  const sellRates = useStore($sellRates);
  const spreads = useStore($spreads);
  const elToqueRates = useStore($elToqueRates);
  const manualElToqueRates = useStore($manualElToqueRates);

  const meta = CURRENCY_META[currency];
  const buyRate = buyRates[currency];
  const sellRate = sellRates[currency];
  const spread = spreads[currency];

  // Check if this currency uses manual El Toque rate
  const isManual = isManualElToqueCurrency(currency);
  const elToqueRate = isManual
    ? manualElToqueRates[currency as "CAD" | "ZELLE" | "CLASICA"]
    : elToqueRates?.[currency];

  const handleBuyChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      setBuyRate(currency, numValue);
    }
  };

  const handleSellChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      setSellRate(currency, numValue);
    }
  };

  const handleManualElToqueChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0 && isManual) {
      setManualElToqueRate(currency as "CAD" | "ZELLE" | "CLASICA", numValue);
    }
  };

  return (
    <div
      className={cn(
        "bg-[var(--bg-primary)] rounded-xl p-4 border border-[var(--border-primary)]",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{meta.flag}</span>
          <span className="font-bold text-[var(--text-primary)]">
            {currency}
          </span>
          {meta.category === "digital" && (
            <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-[var(--purple-bg)] text-[var(--purple)]">
              DIG
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* El Toque Reference - Editable for manual currencies */}
          {isManual ? (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--purple-bg)] border border-[var(--purple)]/20">
              <Pencil size={10} className="text-[var(--purple)]" />
              <input
                type="number"
                value={elToqueRate || 0}
                onChange={(e) => handleManualElToqueChange(e.target.value)}
                className="w-12 bg-transparent text-[10px] font-bold text-[var(--purple)] tabular-nums text-center outline-none"
                min={1}
              />
            </div>
          ) : elToqueRate ? (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--blue-bg)] border border-[var(--blue)]/20">
              <Zap size={10} className="text-[var(--blue)]" />
              <span className="text-[10px] font-bold text-[var(--blue)] tabular-nums">
                {elToqueRate}
              </span>
            </div>
          ) : null}

          {/* Spread Badge */}
          {spread > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--status-success-bg)] border border-[var(--status-success)]/20">
              <TrendingUp size={12} className="text-[var(--status-success)]" />
              <span className="text-xs font-bold text-[var(--status-success)] tabular-nums">
                +{spread}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Buy/Sell Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-[var(--text-faint)] mb-1 font-medium uppercase tracking-wide">
            Compra
          </label>
          <Input
            type="number"
            value={buyRate}
            onChange={(e) => handleBuyChange(e.target.value)}
            size="sm"
            numericOnly
            className="text-center font-bold tabular-nums text-[var(--status-success)]"
            min={1}
          />
        </div>
        <div>
          <label className="block text-[10px] text-[var(--text-faint)] mb-1 font-medium uppercase tracking-wide">
            Venta
          </label>
          <Input
            type="number"
            value={sellRate}
            onChange={(e) => handleSellChange(e.target.value)}
            size="sm"
            numericOnly
            className="text-center font-bold tabular-nums text-[var(--status-warning)]"
            min={1}
          />
        </div>
      </div>
    </div>
  );
}

// Visibility & Theme Customization Section
function VisibilitySection() {
  const visibleDenominations = useStore($visibleDenominations);
  const visibleCurrencies = useStore($visibleCurrencies);
  const theme = useStore($theme);
  const haptic = useHaptic();

  const handleDenomToggle = (denom: Denomination) => {
    haptic.light();
    toggleDenomination(denom);
  };

  const handleCurrencyToggle = (currency: Currency) => {
    haptic.light();
    toggleCurrency(currency);
  };

  const handleThemeToggle = () => {
    haptic.medium();
    toggleTheme();
  };

  return (
    <div className="pt-4 mt-4 border-t border-[var(--border-primary)] space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <Eye size={14} className="text-[var(--text-faint)]" />
        <span className="text-xs text-[var(--text-faint)] font-bold uppercase tracking-wide">
          Personalización
        </span>
      </div>

      {/* Denominations */}
      <div>
        <span className="block text-[10px] text-[var(--text-faint)] mb-2 font-medium">
          Billetes visibles
        </span>
        <div className="flex flex-wrap gap-2">
          {DENOMINATIONS.map((denom) => {
            const isVisible = visibleDenominations.includes(denom);
            const isOnlyOne = visibleDenominations.length === 1 && isVisible;
            return (
              <button
                key={denom}
                onClick={() => handleDenomToggle(denom)}
                disabled={isOnlyOne}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-bold transition-all",
                  "border",
                  isVisible
                    ? "bg-[var(--status-success-bg)] border-[var(--status-success)]/30 text-[var(--status-success)]"
                    : "bg-[var(--bg-primary)] border-[var(--border-secondary)] text-[var(--text-faint)]",
                  isOnlyOne && "opacity-50 cursor-not-allowed",
                )}
              >
                {denom}
              </button>
            );
          })}
        </div>
      </div>

      {/* Currencies */}
      <div>
        <span className="block text-[10px] text-[var(--text-faint)] mb-2 font-medium">
          Monedas visibles
        </span>
        <div className="flex flex-wrap gap-2">
          {CURRENCIES.map((currency) => {
            const meta = CURRENCY_META[currency];
            const isVisible = visibleCurrencies.includes(currency);
            const isOnlyOne = visibleCurrencies.length === 1 && isVisible;
            return (
              <button
                key={currency}
                onClick={() => handleCurrencyToggle(currency)}
                disabled={isOnlyOne}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-bold transition-all",
                  "border flex items-center gap-1.5",
                  isVisible
                    ? "bg-[var(--blue-bg)] border-[var(--blue)]/30 text-[var(--blue)]"
                    : "bg-[var(--bg-primary)] border-[var(--border-secondary)] text-[var(--text-faint)]",
                  isOnlyOne && "opacity-50 cursor-not-allowed",
                )}
              >
                <span>{meta.flag}</span>
                <span>{currency}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Donation Section Component - Bank Card Transfer
function DonationSection() {
  const [customAmount, setCustomAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Your BANK CARD number for receiving donations (NOT phone)
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
      // Fallback: select text
    }
  };

  const handleDonate = () => {
    if (finalAmount < 50) return;
    window.location.href = "tel:*444*45%23";
  };

  return (
    <div className="bg-[var(--bg-primary)] rounded-xl p-4 border border-[var(--border-primary)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[var(--pink-bg)] flex items-center justify-center">
          <Heart className="w-5 h-5 text-[var(--pink)]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            Apoya el Desarrollo
          </h3>
          <p className="text-xs text-[var(--text-faint)]">
            Tu donación mantiene la app gratis
          </p>
        </div>
      </div>

      {/* Card Number Display - Easy to copy */}
      <div className="bg-[var(--bg-base)] rounded-xl p-3 mb-4 border border-[var(--border-primary)]">
        <p className="text-[10px] text-[var(--text-faint)] uppercase mb-1">
          Transferir a tarjeta:
        </p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-mono font-bold text-[var(--text-primary)] tracking-wider">
            {CARD_NUMBER}
          </span>
          <button
            onClick={handleCopyCard}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-bold transition-all",
              copied
                ? "bg-[var(--status-success-bg)] text-[var(--status-success)]"
                : "bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]",
            )}
          >
            {copied ? "✓ Copiado" : "Copiar"}
          </button>
        </div>
      </div>

      {/* Preset Amounts */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {presetAmounts.map((amount) => (
          <button
            key={amount}
            onClick={() => handleSelectAmount(amount)}
            className={cn(
              "py-3 rounded-xl font-bold text-sm transition-all border",
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
      <div className="mb-4">
        <Input
          type="number"
          inputMode="numeric"
          placeholder="Otro monto (CUP)"
          value={customAmount}
          onChange={(e) => handleCustomChange(e.target.value)}
          className={cn(
            "bg-[var(--bg-base)] border-[var(--border-primary)] text-center",
            customAmount && "border-[var(--pink)]/50",
          )}
        />
      </div>

      {/* Donate Button */}
      <button
        onClick={handleDonate}
        disabled={finalAmount < 50}
        className={cn(
          "w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
          finalAmount >= 50
            ? "bg-[var(--pink)] text-[var(--text-inverted)] hover:opacity-90"
            : "bg-[var(--bg-secondary)] text-[var(--text-faint)] cursor-not-allowed",
        )}
      >
        <Smartphone className="w-4 h-4" />
        {finalAmount >= 50
          ? `Donar ${finalAmount} CUP via Transfermóvil`
          : "Selecciona un monto (min. 50 CUP)"}
      </button>

      {/* Instructions */}
      <div className="mt-3 p-3 bg-[var(--bg-base)] rounded-lg border border-[var(--border-primary)]">
        <p className="text-[10px] text-[var(--text-faint)] leading-relaxed">
          <strong className="text-[var(--text-muted)]">Pasos:</strong>
          <br />
          1. Copia el número de tarjeta
          <br />
          2. Toca el botón para abrir Transfermóvil
          <br />
          3. Autentícate si es necesario (*444*40*02#)
          <br />
          4. Transfiere el monto a la tarjeta copiada
        </p>
      </div>
    </div>
  );
}

export function SettingsSheet() {
  const isOpen = useStore($isSettingsOpen) ?? false;
  const isLoadingElToque = useStore($isLoadingElToque);
  const elToqueRates = useStore($elToqueRates);
  const haptic = useHaptic();

  const handleRefreshElToque = () => {
    haptic.medium();
    loadElToqueRates();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeSettings}
      title="Configurar Tasas"
      size="md"
    >
      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Explanation */}
        <div className="bg-[var(--bg-base)]/50 rounded-xl p-3 border border-[var(--border-primary)]/40">
          <p className="text-sm text-[var(--text-secondary)] font-medium">
            Compra / Venta
          </p>
          <p className="text-xs text-[var(--text-faint)] mt-1">
            Define las tasas a las que compras y vendes cada moneda.
          </p>
        </div>

        {/* El Toque Reference Section */}
        <div className="bg-[var(--blue-bg)] rounded-xl p-3 border border-[var(--blue)]/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-[var(--blue)]" />
              <div>
                <p className="text-sm text-[var(--blue)] font-bold">El Toque</p>
                <p className="text-[10px] text-[var(--blue)]/60">
                  Referencia mercado informal
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshElToque}
              className="h-8 w-8 p-0 text-[var(--blue)] hover:text-[var(--blue)]"
              title="Actualizar El Toque"
            >
              <RefreshCw
                size={14}
                className={cn(isLoadingElToque && "animate-spin")}
              />
            </Button>
          </div>
          {elToqueRates && (
            <p className="text-[10px] text-[var(--blue)]/60 mt-2">
              Usa estos valores como guía para ajustar tus tasas
            </p>
          )}
        </div>

        {/* Cash Currencies */}
        <div>
          <div className="text-xs text-[var(--text-faint)] font-bold uppercase tracking-wide mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--status-success)]" />
            Efectivo
          </div>
          <div className="space-y-3">
            {CASH_CURRENCIES.map((currency) => (
              <RateRow key={currency} currency={currency} />
            ))}
          </div>
        </div>

        {/* Digital Currencies */}
        <div>
          <div className="text-xs text-[var(--text-faint)] font-bold uppercase tracking-wide mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--purple)]" />
            Digital
          </div>
          <div className="space-y-3">
            {DIGITAL_CURRENCIES.map((currency) => (
              <RateRow key={currency} currency={currency} />
            ))}
          </div>
        </div>

        {/* Visibility Customization */}
        <VisibilitySection />

        {/* Actions - Fixed Footer */}
        <div className="flex gap-3 pt-4 mt-4 border-t border-[var(--border-primary)]">
          <Button
            variant="secondary"
            onClick={resetRates}
            className="flex-1 gap-2"
          >
            <RotateCcw size={14} />
            Resetear
          </Button>
          <Button variant="primary" onClick={closeSettings} className="flex-1">
            Listo
          </Button>
        </div>
      </div>
    </Modal>
  );
}
