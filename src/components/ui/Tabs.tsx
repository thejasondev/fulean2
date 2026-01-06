import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

// ============================================
// Tabs Component
// Accessible tab navigation with proper ARIA roles
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
        "bg-neutral-900/80 backdrop-blur-sm",
        "border-b border-neutral-800/60"
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
                ? "text-emerald-400 border-emerald-400 bg-emerald-400/5"
                : "text-neutral-400 border-transparent hover:text-neutral-200 hover:bg-neutral-800/50"
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
            <span>{tab.label}</span>
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
