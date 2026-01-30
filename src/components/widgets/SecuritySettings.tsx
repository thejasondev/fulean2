import { useState, useCallback, useRef } from "react";
import { useStore } from "@nanostores/react";
import {
  Download,
  Upload,
  Trash2,
  MessageCircle,
  Play,
  HelpCircle,
  Database,
  ChevronRight,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useHaptic } from "../../hooks/useHaptic";
import { useToast } from "../ui/Toast";
import { PinSettings } from "./PinSettings";
import { startTour } from "../../stores/onboardingStore";
import { $transactions } from "../../stores/historyStore";
import { $wallets, $activeWalletId } from "../../stores/walletStore";
import { $buyRates, $sellRates } from "../../stores/ratesStore";
import { $capitalMovements } from "../../stores/capitalStore";
import { confirm } from "../../stores/confirmStore";
import { closeSettings } from "../../stores/uiStore";

// ============================================
// Security Settings Component
// Unified security, data management, and help section
// ============================================

export function SecuritySettings() {
  const haptic = useHaptic();
  const { showToast } = useToast();

  const [isExporting, setIsExporting] = useState(false);

  // Get all data stores for backup
  const transactions = useStore($transactions);
  const wallets = useStore($wallets);
  const activeWalletId = useStore($activeWalletId);
  const buyRates = useStore($buyRates);
  const sellRates = useStore($sellRates);
  const capitalMovements = useStore($capitalMovements);

  // ============================================
  // Data Export/Backup (Mobile-optimized)
  // ============================================
  const handleExportData = useCallback(async () => {
    setIsExporting(true);
    haptic.medium();

    try {
      // Collect ALL localStorage data for this app
      // Keys use either "fulean2_" or "fulean2-" prefix
      const rawStorage: Record<string, string> = {};
      const allKeys: string[] = [];

      // Debug: show all localStorage keys
      console.log("Total localStorage keys:", localStorage.length);
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          allKeys.push(key);
          if (key.startsWith("fulean2_") || key.startsWith("fulean2-")) {
            rawStorage[key] = localStorage.getItem(key) || "";
          }
        }
      }

      console.log("All localStorage keys:", allKeys);
      console.log("App keys found:", Object.keys(rawStorage));
      console.log("App keys count:", Object.keys(rawStorage).length);

      // Validate we have data to export
      if (Object.keys(rawStorage).length === 0) {
        showToast("No hay datos para exportar", "error");
        haptic.error();
        return;
      }

      const backupData = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        rawLocalStorage: rawStorage,
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const filename = `fulean-backup-${new Date().toISOString().split("T")[0]}.json`;

      console.log(
        "Backup created with",
        Object.keys(rawStorage).length,
        "keys",
      );

      // Try Web Share API first (best for mobile)
      if (navigator.share && navigator.canShare) {
        const file = new File([jsonString], filename, {
          type: "application/json",
        });
        const shareData = { files: [file] };

        if (navigator.canShare(shareData)) {
          try {
            await navigator.share(shareData);
            showToast("Copia de seguridad compartida", "success");
            haptic.success();
            return;
          } catch (shareError) {
            // User cancelled or share failed, fall through to download
            if ((shareError as Error).name !== "AbortError") {
              console.log("Share failed, falling back to download");
            }
          }
        }
      }

      // Fallback: Direct download (works on most browsers)
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();

      // Cleanup with delay for iOS Safari
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);

      showToast(
        `Backup exportado (${Object.keys(rawStorage).length} configuraciones)`,
        "success",
      );
      haptic.success();
    } catch (error) {
      console.error("Export failed:", error);
      showToast("Error al exportar datos", "error");
      haptic.error();
    } finally {
      setIsExporting(false);
    }
  }, [haptic, showToast]);

  // ============================================
  // Data Import/Restore
  // ============================================
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleImportClick = useCallback(() => {
    haptic.light();
    fileInputRef.current?.click();
  }, [haptic]);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Reset input so same file can be selected again
      e.target.value = "";

      try {
        const text = await file.text();
        const backup = JSON.parse(text);

        // Log backup structure for debugging
        console.log("Backup loaded:", {
          version: backup.version,
          exportedAt: backup.exportedAt,
          keysCount: Object.keys(backup.rawLocalStorage || {}).length,
          keys: Object.keys(backup.rawLocalStorage || {}),
        });

        // Validate backup structure
        if (!backup.version || !backup.rawLocalStorage) {
          throw new Error("Formato de backup inválido");
        }

        const keysCount = Object.keys(backup.rawLocalStorage).length;
        if (keysCount === 0) {
          throw new Error("El backup no contiene datos");
        }

        // Confirm before restoring
        const confirmed = await confirm({
          title: "¿Restaurar datos?",
          message: `Se restaurarán ${keysCount} configuraciones del backup del ${new Date(backup.exportedAt).toLocaleDateString()}. La aplicación se reiniciará.`,
          confirmLabel: "Sí, restaurar",
          cancelLabel: "Cancelar",
          variant: "warning",
        });

        if (!confirmed) return;

        // Show restoring state
        setIsRestoring(true);

        // First, clear existing app data to avoid conflicts
        const existingKeys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (
            key &&
            (key.startsWith("fulean2_") || key.startsWith("fulean2-"))
          ) {
            existingKeys.push(key);
          }
        }
        existingKeys.forEach((key) => localStorage.removeItem(key));

        // Restore all keys from backup
        const rawStorage = backup.rawLocalStorage as Record<string, string>;
        Object.entries(rawStorage).forEach(([key, value]) => {
          localStorage.setItem(key, value);
          console.log(`Restored key: ${key}`);
        });

        console.log("Restore complete, reloading...");
        haptic.success();

        // Force immediate reload using same approach as clear
        requestAnimationFrame(() => {
          window.location.replace(
            window.location.origin + window.location.pathname,
          );
        });
      } catch (error) {
        console.error("Import failed:", error);
        showToast(
          error instanceof SyntaxError
            ? "Archivo JSON inválido"
            : (error as Error).message || "Error al restaurar datos",
          "error",
        );
        haptic.error();
        setIsRestoring(false);
      }
    },
    [haptic, showToast],
  );

  // ============================================
  // Clear All Data
  // ============================================
  const [isClearing, setIsClearing] = useState(false);

  const handleClearAllData = useCallback(async () => {
    haptic.medium();

    const result = await confirm({
      title: "¿Borrar todos los datos?",
      message:
        "Esta acción eliminará todas tus transacciones, carteras, tasas y configuraciones. La app se reiniciará automáticamente.",
      confirmLabel: "Sí, borrar todo",
      cancelLabel: "Cancelar",
      variant: "danger",
    });

    if (result) {
      // Show clearing state
      setIsClearing(true);

      // Clear ALL localStorage keys for this app
      // Keys use either "fulean2_" or "fulean2-" prefix
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("fulean2_") || key.startsWith("fulean2-"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      haptic.success();

      // Force immediate reload - use location.replace for cleaner history
      // and wrap in requestAnimationFrame to ensure state updates are flushed
      requestAnimationFrame(() => {
        // For PWAs: try to clear caches too
        if ("caches" in window) {
          caches.keys().then((names) => {
            names.forEach((name) => caches.delete(name));
          });
        }

        // Force hard reload - location.replace prevents back button issues
        window.location.replace(
          window.location.origin + window.location.pathname,
        );
      });
    }
  }, [haptic]);

  // ============================================
  // Help & Support
  // ============================================
  const handleStartTour = useCallback(() => {
    haptic.light();
    // FIRST close the settings modal
    closeSettings();
    // THEN start the tour after modal animation completes
    setTimeout(() => {
      startTour();
    }, 350);
  }, [haptic]);

  const handleContactSupport = useCallback(() => {
    haptic.light();
    const message = encodeURIComponent(
      "Hola! Necesito ayuda con la app Fulean2.",
    );
    window.open(`https://wa.me/+5353118193?text=${message}`, "_blank");
  }, [haptic]);

  return (
    <div className="space-y-6">
      {/* PIN Protection Section */}
      <PinSettings />

      {/* Data Management Section */}
      <div className="pt-4 mt-4 border-t border-[var(--border-primary)] space-y-4">
        <div className="flex items-center gap-2">
          <Database size={14} className="text-[var(--text-faint)]" />
          <span className="text-xs text-[var(--text-faint)] font-bold uppercase tracking-wide">
            Datos
          </span>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportData}
          disabled={isExporting}
          className={cn(
            "w-full flex items-center justify-between p-3 rounded-xl",
            "hover:bg-[var(--bg-secondary)] transition-colors",
            "active:scale-[0.99] duration-200",
            isExporting && "opacity-50 cursor-wait",
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--status-success-bg)] flex items-center justify-center">
              <Download size={16} className="text-[var(--status-success)]" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-[var(--text-primary)]">
                Exportar Copia de Seguridad
              </p>
              <p className="text-xs text-[var(--text-faint)]">
                Descarga todos tus datos en JSON
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-[var(--text-faint)]" />
        </button>

        {/* Hidden file input for import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Seleccionar archivo de backup"
        />

        {/* Import Button */}
        <button
          onClick={handleImportClick}
          disabled={isRestoring}
          className={cn(
            "w-full flex items-center justify-between p-3 rounded-xl",
            "hover:bg-[var(--bg-secondary)] transition-colors",
            "active:scale-[0.99] duration-200",
            isRestoring && "opacity-50 cursor-wait",
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--blue-bg)] flex items-center justify-center">
              <Upload
                size={16}
                className={cn(
                  "text-[var(--blue)]",
                  isRestoring && "animate-pulse",
                )}
              />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-[var(--text-primary)]">
                {isRestoring ? "Restaurando..." : "Restaurar Datos"}
              </p>
              <p className="text-xs text-[var(--text-faint)]">
                {isRestoring ? "Aplicando backup" : "Importar desde backup"}
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-[var(--text-faint)]" />
        </button>

        {/* Clear Data Button */}
        <button
          onClick={handleClearAllData}
          disabled={isClearing}
          className={cn(
            "w-full flex items-center justify-between p-3 rounded-xl",
            "hover:bg-[var(--status-error-bg)]/50 transition-colors",
            "active:scale-[0.99] duration-200",
            isClearing && "opacity-50 cursor-wait",
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--status-error-bg)] flex items-center justify-center">
              <Trash2
                size={16}
                className={cn(
                  "text-[var(--status-error)]",
                  isClearing && "animate-pulse",
                )}
              />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-[var(--status-error)]">
                {isClearing ? "Reiniciando..." : "Borrar Todos los Datos"}
              </p>
              <p className="text-xs text-[var(--text-faint)]">
                {isClearing
                  ? "Por favor espera"
                  : "Elimina todo permanentemente"}
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-[var(--text-faint)]" />
        </button>
      </div>

      {/* Help & Support Section */}
      <div className="pt-4 mt-4 border-t border-[var(--border-primary)] space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle size={14} className="text-[var(--text-faint)]" />
          <span className="text-xs text-[var(--text-faint)] font-bold uppercase tracking-wide">
            Ayuda
          </span>
        </div>

        {/* Start Tour Button */}
        <button
          onClick={handleStartTour}
          className={cn(
            "w-full flex items-center justify-between p-3 rounded-xl",
            "hover:bg-[var(--bg-secondary)] transition-colors",
            "active:scale-[0.99] duration-200",
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-bg)] flex items-center justify-center">
              <Play size={16} className="text-[var(--accent)]" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-[var(--text-primary)]">
                Ver Tutorial
              </p>
              <p className="text-xs text-[var(--text-faint)]">
                Recorrido guiado por la app
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-[var(--text-faint)]" />
        </button>

        {/* Contact Support Button */}
        <button
          onClick={handleContactSupport}
          className={cn(
            "w-full flex items-center justify-between p-3 rounded-xl",
            "hover:bg-[var(--bg-secondary)] transition-colors",
            "active:scale-[0.99] duration-200",
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--status-success-bg)] flex items-center justify-center">
              <MessageCircle
                size={16}
                className="text-[var(--status-success)]"
              />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-[var(--text-primary)]">
                Contactar Soporte
              </p>
              <p className="text-xs text-[var(--text-faint)]">
                Escríbenos por WhatsApp
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-[var(--text-faint)]" />
        </button>
      </div>
    </div>
  );
}
