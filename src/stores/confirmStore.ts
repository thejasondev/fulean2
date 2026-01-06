import { atom } from "nanostores";

// ============================================
// Confirm Dialog Store
// Replaces window.confirm() with styled modal
// ============================================

export interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  variant: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

const initialState: ConfirmState = {
  isOpen: false,
  title: "",
  message: "",
  confirmLabel: "Confirmar",
  cancelLabel: "Cancelar",
  variant: "danger",
  onConfirm: () => {},
  onCancel: () => {},
};

export const $confirmDialog = atom<ConfirmState>(initialState);

/**
 * Show a confirmation dialog
 * @returns Promise that resolves to true if confirmed, false if cancelled
 */
export function confirm(options: {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
}): Promise<boolean> {
  return new Promise((resolve) => {
    $confirmDialog.set({
      isOpen: true,
      title: options.title || "Confirmar",
      message: options.message,
      confirmLabel: options.confirmLabel || "Confirmar",
      cancelLabel: options.cancelLabel || "Cancelar",
      variant: options.variant || "danger",
      onConfirm: () => {
        $confirmDialog.set(initialState);
        resolve(true);
      },
      onCancel: () => {
        $confirmDialog.set(initialState);
        resolve(false);
      },
    });
  });
}

export function closeConfirmDialog() {
  const current = $confirmDialog.get();
  current.onCancel();
}
