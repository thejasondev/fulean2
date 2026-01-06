import type { ReactNode } from "react";
import { ToastProvider } from "../ui/Toast";
import { ConfirmDialog } from "../ui/ConfirmDialog";

// ============================================
// App Shell
// Wraps all React components with providers
// Used in Astro pages to provide context
// ============================================

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <ToastProvider>
      {children}
      <ConfirmDialog />
    </ToastProvider>
  );
}
