import { useState } from "react";
import { useStore } from "@nanostores/react";
import {
  ChevronDown,
  Plus,
  Wallet,
  Check,
  Trash2,
  Edit2,
  Layers,
} from "lucide-react";
import {
  $wallets,
  $activeWalletId,
  $activeWallet,
  $activeWallets,
  $canCreateWallet,
  $isConsolidatedView,
  $defaultWalletId,
  WALLET_COLORS,
  CONSOLIDATED_ID,
  createWallet,
  switchWallet,
  renameWallet,
  deleteWallet,
  getWalletColorHex,
  type Wallet as WalletType,
  type WalletColor,
} from "../../stores/walletStore";
import { $transactions } from "../../stores/historyStore";
import { confirm } from "../../stores/confirmStore";
import { cn } from "../../lib/utils";
import { useHaptic } from "../../hooks/useHaptic";
import { Input } from "../ui/Input";

// ============================================
// Wallet Selector Component
// Modern dropdown for multi-wallet management
// ============================================

export function WalletSelector() {
  const activeWallet = useStore($activeWallet);
  const activeWallets = useStore($activeWallets);
  const isConsolidated = useStore($isConsolidatedView);
  const canCreate = useStore($canCreateWallet);
  const allTransactions = useStore($transactions);
  const defaultWalletId = useStore($defaultWalletId);
  const haptic = useHaptic();

  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newWalletName, setNewWalletName] = useState("");
  const [selectedColor, setSelectedColor] = useState<WalletColor>("cyan");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleSelect = (id: string) => {
    haptic.light();
    switchWallet(id);
    setIsOpen(false);
  };

  const handleCreate = () => {
    if (!newWalletName.trim()) return;
    haptic.medium();
    const wallet = createWallet(newWalletName, selectedColor);
    if (wallet) {
      switchWallet(wallet.id);
      setNewWalletName("");
      setIsCreating(false);
      setIsOpen(false);
    }
  };

  const handleStartEdit = (wallet: WalletType) => {
    setEditingId(wallet.id);
    setEditName(wallet.name);
  };

  const handleSaveEdit = () => {
    if (editingId && editName.trim()) {
      renameWallet(editingId, editName);
    }
    setEditingId(null);
    setEditName("");
  };

  const handleDelete = async (wallet: WalletType) => {
    const confirmed = await confirm({
      title: "Eliminar Cartera",
      message: `¿Eliminar "${wallet.name}" y todos sus datos? Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      variant: "danger",
    });
    if (confirmed) {
      haptic.heavy();
      deleteWallet(wallet.id);
    }
  };

  // Get transaction count for a wallet (using all transactions)
  const getWalletStats = (walletId: string) => {
    const walletTxns = allTransactions.filter((t) => {
      if (t.walletId) {
        return t.walletId === walletId;
      } else {
        // Legacy transactions only belong to default wallet
        return walletId === defaultWalletId;
      }
    });
    return walletTxns.length;
  };

  const displayName = isConsolidated
    ? "Todas las Carteras"
    : (activeWallet?.name ?? "Seleccionar");

  const displayColor = isConsolidated
    ? "#8b5cf6"
    : activeWallet
      ? getWalletColorHex(activeWallet.color)
      : "#06b6d4";

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => {
          haptic.light();
          setIsOpen(!isOpen);
        }}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl",
          "bg-[var(--bg-primary)] border border-[var(--border-primary)]",
          "hover:border-[var(--border-secondary)] transition-all duration-200",
          "text-sm font-medium text-[var(--text-primary)]",
          "min-w-[140px] max-w-[200px]",
        )}
      >
        <span
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: displayColor }}
        />
        <span className="truncate flex-1 text-left">{displayName}</span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-[var(--text-muted)] transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div
            className={cn(
              "absolute top-full left-0 mt-2 z-50",
              "w-72 max-h-[400px] overflow-y-auto",
              "bg-[var(--bg-primary)] border border-[var(--border-primary)]",
              "rounded-xl shadow-xl",
              "animate-in fade-in slide-in-from-top-2 duration-200",
            )}
          >
            {/* Header */}
            <div className="p-3 border-b border-[var(--border-primary)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase">
                  Mis Carteras
                </span>
                <span className="text-xs text-[var(--text-faint)]">
                  {activeWallets.length}/5
                </span>
              </div>
            </div>

            {/* Consolidated View Option */}
            <button
              onClick={() => handleSelect(CONSOLIDATED_ID)}
              className={cn(
                "w-full flex items-center gap-3 p-3",
                "hover:bg-[var(--bg-hover)] transition-colors",
                isConsolidated && "bg-[var(--bg-secondary)]",
              )}
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Layers className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  Todas las Carteras
                </div>
                <div className="text-xs text-[var(--text-faint)]">
                  Vista consolidada
                </div>
              </div>
              {isConsolidated && <Check className="w-4 h-4 text-purple-400" />}
            </button>

            <div className="border-t border-[var(--border-primary)]" />

            {/* Wallet List */}
            {activeWallets.map((wallet) => (
              <div
                key={wallet.id}
                className={cn(
                  "flex items-center gap-3 p-3",
                  "hover:bg-[var(--bg-hover)] transition-colors",
                  activeWallet?.id === wallet.id &&
                    !isConsolidated &&
                    "bg-[var(--bg-secondary)]",
                )}
              >
                {editingId === wallet.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                      onBlur={handleSaveEdit}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                    />
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleSelect(wallet.id)}
                      className="flex items-center gap-3 flex-1"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor: `${getWalletColorHex(wallet.color)}20`,
                        }}
                      >
                        <Wallet
                          className="w-4 h-4"
                          style={{ color: getWalletColorHex(wallet.color) }}
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium text-[var(--text-primary)]">
                          {wallet.name}
                        </div>
                        <div className="text-xs text-[var(--text-faint)]">
                          {getWalletStats(wallet.id)} operaciones
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center gap-1">
                      {activeWallet?.id === wallet.id && !isConsolidated && (
                        <Check
                          className="w-4 h-4 mr-1"
                          style={{ color: getWalletColorHex(wallet.color) }}
                        />
                      )}
                      <button
                        onClick={() => handleStartEdit(wallet)}
                        className="p-1.5 rounded-lg text-[var(--text-faint)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {activeWallets.length > 1 && (
                        <button
                          onClick={() => handleDelete(wallet)}
                          className="p-1.5 rounded-lg text-[var(--text-faint)] hover:text-[var(--status-error)] hover:bg-[var(--status-error-bg)]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Create New Section */}
            {isCreating ? (
              <div className="p-3 border-t border-[var(--border-primary)] space-y-3">
                <Input
                  placeholder="Nombre de la cartera"
                  value={newWalletName}
                  onChange={(e) => setNewWalletName(e.target.value)}
                  className="text-sm"
                  autoFocus
                />
                {/* Color Picker */}
                <div className="flex gap-2">
                  {WALLET_COLORS.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColor(c.name)}
                      className={cn(
                        "w-8 h-8 rounded-full transition-all",
                        selectedColor === c.name
                          ? "ring-2 ring-offset-2 ring-offset-[var(--bg-primary)]"
                          : "opacity-60 hover:opacity-100",
                      )}
                      style={{
                        backgroundColor: c.value,
                        ringColor: c.value,
                      }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsCreating(false)}
                    className="flex-1 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!newWalletName.trim()}
                    className={cn(
                      "flex-1 py-2 text-sm font-bold rounded-lg",
                      "bg-[var(--blue)] text-white",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                    )}
                  >
                    Crear
                  </button>
                </div>
              </div>
            ) : canCreate ? (
              <button
                onClick={() => {
                  haptic.light();
                  setIsCreating(true);
                }}
                className={cn(
                  "w-full flex items-center gap-3 p-3",
                  "border-t border-[var(--border-primary)]",
                  "text-[var(--blue)] hover:bg-[var(--bg-hover)]",
                  "transition-colors",
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--blue-bg)] flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Nueva Cartera</span>
              </button>
            ) : (
              <div className="p-3 border-t border-[var(--border-primary)] text-center text-xs text-[var(--text-faint)]">
                Límite de 5 carteras alcanzado
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
