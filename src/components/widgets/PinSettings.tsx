import { useState } from "react";
import { useStore } from "@nanostores/react";
import { $pinState, setPin, disablePin } from "../../stores/pinStore";
import {
  Lock,
  Smartphone,
  Check,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useHaptic } from "../../hooks/useHaptic";
import { Toggle } from "../ui/Toggle";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

export function PinSettings() {
  const pinState = useStore($pinState);
  const haptic = useHaptic();

  // Local state for "Change PIN" flow
  const [isChanging, setIsChanging] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleToggle = (checked: boolean) => {
    haptic.medium();
    if (checked) {
      setIsChanging(true); // Start Setup Flow
    } else {
      disablePin(); // Turn off
    }
  };

  const handlePinSubmit = () => {
    if (newPin.length !== 4) {
      setError("El PIN debe tener 4 dígitos");
      haptic.error();
      return;
    }

    if (newPin !== confirmPin) {
      setError("Los PIN no coinciden");
      haptic.error();
      return;
    }

    // Success
    setPin(newPin);
    setIsChanging(false);
    setNewPin("");
    setConfirmPin("");
    setError(null);
    haptic.success();
  };

  const cancelChange = () => {
    setIsChanging(false);
    setNewPin("");
    setConfirmPin("");
    setError(null);
    if (!pinState.isEnabled) {
      // If we were enabling, cancel means stay disabled
    }
  };

  return (
    <div className="pt-4 mt-4 border-t border-[var(--border-primary)] space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <Lock size={14} className="text-[var(--text-faint)]" />
        <span className="text-xs text-[var(--text-faint)] font-bold uppercase tracking-wide">
          Seguridad
        </span>
      </div>

      {/* Main Toggle */}
      <div
        onClick={() => handleToggle(!pinState.isEnabled)}
        className="flex items-center justify-between p-3 -mx-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer active:scale-[0.99] duration-200"
      >
        <div>
          <p className="text-sm font-bold text-[var(--text-primary)]">
            Protección con PIN
          </p>
          <p className="text-xs text-[var(--text-faint)]">
            Solicitar código al abrir la app
          </p>
        </div>
        <div className="pointer-events-none">
          <Toggle
            checked={pinState.isEnabled}
            onChange={() => {}} // Handled by parent div
          />
        </div>
      </div>

      {/* Change PIN / Setup Interface */}
      {isChanging && (
        <div className="bg-[var(--bg-secondary)]/50 p-4 rounded-xl border border-[var(--border-secondary)] animate-in fade-in slide-in-from-top-2">
          <h4 className="text-sm font-bold mb-3">Configurar Nuevo PIN</h4>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase text-[var(--text-faint)] font-bold mb-1 block">
                Nuevo PIN (4 dígitos)
              </label>
              <Input
                type="number"
                numericOnly
                maxLength={4}
                value={newPin}
                onChange={(e) => {
                  if (e.target.value.length <= 4) setNewPin(e.target.value);
                  setError(null);
                }}
                className="text-center tracking-[0.5em] font-bold text-lg"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase text-[var(--text-faint)] font-bold mb-1 block">
                Confirmar PIN
              </label>
              <Input
                type="number"
                numericOnly
                maxLength={4}
                value={confirmPin}
                onChange={(e) => {
                  if (e.target.value.length <= 4) setConfirmPin(e.target.value);
                  setError(null);
                }}
                className="text-center tracking-[0.5em] font-bold text-lg"
              />
            </div>

            {error && (
              <p className="text-xs text-[var(--status-error)] flex items-center gap-1">
                <AlertTriangle size={12} /> {error}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={cancelChange}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={handlePinSubmit}
                disabled={newPin.length !== 4 || confirmPin.length !== 4}
              >
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Change PIN Button (if enabled and not changing) */}
      {pinState.isEnabled && !isChanging && (
        <button
          onClick={() => {
            haptic.light();
            setIsChanging(true);
          }}
          className="w-full text-left px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] flex items-center justify-between"
        >
          <span>Cambiar PIN</span>
          <ChevronRight size={14} className="text-[var(--text-faint)]" />
        </button>
      )}
    </div>
  );
}
