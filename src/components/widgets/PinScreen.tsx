import { useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import { $pinState, verifyPin } from "../../stores/pinStore";
import { Delete, Lock, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "../../lib/utils";
import { useHaptic } from "../../hooks/useHaptic";
import { confirm } from "../../stores/confirmStore";

export function PinScreen() {
  const pinState = useStore($pinState);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const haptic = useHaptic();

  // Handle Lockout Timer
  useEffect(() => {
    if (pinState.lockoutUntil) {
      const interval = setInterval(() => {
        const now = Date.now();
        const diff = Math.max(
          0,
          Math.ceil((pinState.lockoutUntil! - now) / 1000),
        );
        setRemainingTime(diff);

        if (diff <= 0) {
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [pinState.lockoutUntil]);

  const handlePress = (num: number) => {
    if (pinState.lockoutUntil && Date.now() < pinState.lockoutUntil) {
      haptic.error();
      return;
    }

    if (pin.length < 4) {
      haptic.light();
      const newPin = pin + num;
      setPin(newPin);

      if (newPin.length === 4) {
        setTimeout(() => checkPin(newPin), 100);
      }
    }
  };

  const handleDelete = () => {
    haptic.light();
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const checkPin = (inputPin: string) => {
    const result = verifyPin(inputPin);

    if (result.success) {
      haptic.success();
      setPin("");
    } else {
      haptic.error();
      setError(true);
      setPin("");
    }
  };

  const handleForgotPin = async () => {
    const confirmed = await confirm({
      title: "Restablecer Aplicación",
      message:
        "¿Olvidaste tu PIN? La única forma de recuperar el acceso es borrando TODOS los datos de la aplicación. Esta acción es irreversible.",
      confirmLabel: "Borrar todo y reiniciar",
      cancelLabel: "Cancelar",
      variant: "danger",
    });

    if (confirmed) {
      localStorage.clear();
      window.location.reload();
    }
  };

  if (!pinState.isEnabled || !pinState.isLocked) return null;

  const isLockedOut = pinState.lockoutUntil && remainingTime > 0;

  return (
    <div className="fixed inset-0 z-[60] bg-[var(--bg-primary)] flex flex-col animate-in fade-in duration-300 overflow-hidden">
      {/* ===== HEADER SECTION ===== */}
      {/* Uses flex-grow with min-height to push keypad down on tall screens */}
      <div className="flex-1 flex flex-col items-center justify-end px-6 pt-safe pb-4 min-h-[35vh] sm:min-h-[30vh] lg:min-h-[25vh]">
        {/* Icon Container - Responsive sizing */}
        <div className="mb-4 sm:mb-6 animate-in zoom-in-50 duration-500 fade-in">
          <div
            className={cn(
              "rounded-2xl flex items-center justify-center shadow-xl shadow-black/10",
              "w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20",
              "bg-gradient-to-br from-[var(--bg-tertiary)] to-[var(--bg-secondary)]",
              "border border-[var(--border-primary)]/30",
            )}
          >
            {isLockedOut ? (
              <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-amber-500" />
            ) : (
              <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-[var(--accent)]" />
            )}
          </div>
        </div>

        {/* Title - Responsive typography */}
        <h1
          className={cn(
            "font-bold mb-1 sm:mb-2 text-[var(--text-primary)] tracking-tight text-center",
            "text-xl sm:text-2xl lg:text-3xl",
          )}
        >
          {isLockedOut ? "Acceso Bloqueado" : "Ingrese su PIN"}
        </h1>

        {/* Subtitle */}
        <p
          className={cn(
            "text-[var(--text-secondary)] text-center font-medium max-w-xs",
            "text-xs sm:text-sm",
          )}
        >
          {isLockedOut
            ? `Demasiados intentos fallidos. Espere ${remainingTime}s para reintentar.`
            : "Ingrese su código de 4 dígitos para continuar"}
        </p>

        {/* PIN Dots - Responsive gap and size */}
        <div
          className={cn(
            "flex mt-6 sm:mt-8",
            "gap-4 sm:gap-5 lg:gap-6",
            error && "animate-shake",
          )}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                "rounded-full transition-all duration-300 ease-out",
                "w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4",
                i <= pin.length
                  ? "bg-[var(--accent)] scale-125 shadow-lg shadow-[var(--accent)]/30"
                  : "bg-transparent border-2 border-[var(--border-secondary)]",
              )}
            />
          ))}
        </div>
      </div>

      {/* ===== KEYPAD SECTION ===== */}
      {/* Fixed proportions, centered, with responsive padding */}
      <div className="w-full flex items-center justify-center px-4 py-4 sm:py-6 lg:py-8">
        {!isLockedOut && (
          <div
            className={cn(
              "grid grid-cols-3 w-full",
              "max-w-[260px] sm:max-w-[280px] lg:max-w-[320px]",
              "gap-x-6 gap-y-3 sm:gap-x-8 sm:gap-y-4 lg:gap-x-10 lg:gap-y-5",
              "animate-in slide-in-from-bottom-4 duration-500 fade-in delay-150",
            )}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handlePress(num)}
                className={cn(
                  "aspect-square rounded-full flex items-center justify-center mx-auto",
                  "font-semibold text-[var(--text-primary)] select-none touch-manipulation",
                  "w-14 h-14 text-xl sm:w-16 sm:h-16 sm:text-2xl lg:w-18 lg:h-18 lg:text-3xl",
                  "hover:bg-[var(--bg-secondary)] active:bg-[var(--bg-tertiary)]",
                  "active:scale-90 transition-all duration-150",
                )}
              >
                {num}
              </button>
            ))}

            {/* Empty spacer */}
            <div />

            {/* Zero button */}
            <button
              onClick={() => handlePress(0)}
              className={cn(
                "aspect-square rounded-full flex items-center justify-center mx-auto",
                "font-semibold text-[var(--text-primary)] select-none touch-manipulation",
                "w-14 h-14 text-xl sm:w-16 sm:h-16 sm:text-2xl lg:w-18 lg:h-18 lg:text-3xl",
                "hover:bg-[var(--bg-secondary)] active:bg-[var(--bg-tertiary)]",
                "active:scale-90 transition-all duration-150",
              )}
            >
              0
            </button>

            {/* Delete button */}
            <button
              onClick={handleDelete}
              aria-label="Borrar dígito"
              className={cn(
                "aspect-square rounded-full flex items-center justify-center mx-auto",
                "text-[var(--text-secondary)] select-none touch-manipulation",
                "w-14 h-14 sm:w-16 sm:h-16 lg:w-18 lg:h-18",
                "hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]",
                "active:scale-90 transition-all duration-150",
              )}
            >
              <Delete className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2} />
            </button>
          </div>
        )}

        {/* Lockout state message */}
        {isLockedOut && (
          <div className="text-center py-8 animate-in fade-in duration-300">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <p className="text-[var(--text-secondary)] text-sm">
              Podrás intentar de nuevo en{" "}
              <span className="font-bold text-[var(--text-primary)]">
                {remainingTime}s
              </span>
            </p>
          </div>
        )}
      </div>

      {/* ===== FOOTER SECTION ===== */}
      {/* Branding and recovery option - adapts to safe area */}
      <div className="w-full text-center pb-safe px-6 pt-2 pb-6 sm:pb-8">
        <button
          onClick={handleForgotPin}
          className={cn(
            "text-[var(--text-muted)] font-medium uppercase tracking-wider",
            "text-[10px] sm:text-xs",
            "hover:text-[var(--text-secondary)] active:opacity-70",
            "py-2 px-4 rounded-lg transition-colors",
          )}
        >
          ¿Olvidaste tu PIN?
        </button>

        {/* Branding - Subtle and elegant */}
        <div className="mt-4 opacity-30 hover:opacity-50 transition-opacity">
          <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] text-[var(--text-secondary)] uppercase">
            Fulean<span className="text-[var(--accent)]">2</span>
          </span>
        </div>
      </div>
    </div>
  );
}
