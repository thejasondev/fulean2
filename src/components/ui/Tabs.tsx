import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

// ============================================
// Tabs Component
// Accessible tab navigation with proper ARIA roles
// Theme-aware using CSS variables
// ============================================

export interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div
      className={cn(
        "flex",
        "bg-[var(--bg-primary)]/80 backdrop-blur-sm",
        "border-b border-[var(--border-primary)]/60",
      )}
      role="tablist"
      aria-label="Navegación principal"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={cn(
              // Layout
              "flex-1 flex items-center justify-center gap-2",
              // Size (48px touch target)
              "min-h-[48px] px-4 py-3",
              // Typography
              "text-sm font-semibold",
              // Transitions
              "transition-all duration-200",
              // Border indicator
              "border-b-2",
              // States
              isActive
                ? "text-[var(--accent-text)] border-[var(--accent)] bg-[var(--accent-muted)]"
                : "text-[var(--text-muted)] border-transparent hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]/50",
            )}
            aria-selected={isActive ? "true" : "false"}
            aria-controls={`tabpanel-${tab.id}`}
            role="tab"
            tabIndex={isActive ? 0 : -1}
          >
            {tab.icon && (
              <span className="shrink-0" aria-hidden="true">
                {tab.icon}
              </span>
            )}
            {/* Label hidden on mobile, visible on md+ */}
            <span className="hidden md:inline">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

interface TabPanelProps {
  id: string;
  activeTab: string;
  children: ReactNode;
}

export function TabPanel({ id, activeTab, children }: TabPanelProps) {
  if (id !== activeTab) return null;

  return (
    <div
      id={`tabpanel-${id}`}
      role="tabpanel"
      aria-labelledby={`tab-${id}`}
      className="animate-fade-in"
    >
      {children}
    </div>
  );
}
