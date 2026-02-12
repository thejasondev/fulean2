import { useEffect } from "react";
import { useStore } from "@nanostores/react";
import { Calculator, Hash, ArrowRightLeft, BarChart3 } from "lucide-react";
import {
  $activeTab,
  setActiveTab,
  $headerVisible,
  type TabId,
} from "../../stores/uiStore";
import { Tabs, TabPanel } from "../ui/Tabs";
import { MoneyCounter } from "./MoneyCounter";
import { CalculatorTab } from "./CalculatorTab";
import { TransactionForm } from "./TransactionForm";
import { ReportsTab } from "./ReportsTab";
import { useAutoHideHeader } from "../../hooks/useAutoHideHeader";

// ============================================
// AppTabs Component
// Main tab wrapper with 4 tabs
// Auto-hide header scroll detection lives here
// ============================================

const TABS = [
  {
    id: "operar" as TabId,
    label: "Operar",
    icon: <ArrowRightLeft className="w-4 h-4" />,
  },
  {
    id: "contar" as TabId,
    label: "Contar",
    icon: <Hash className="w-4 h-4" />,
  },
  {
    id: "calcular" as TabId,
    label: "Calcular",
    icon: <Calculator className="w-4 h-4" />,
  },
  {
    id: "reportes" as TabId,
    label: "Reportes",
    icon: <BarChart3 className="w-4 h-4" />,
  },
];

export function AppTabs() {
  const activeTab = useStore($activeTab) ?? "operar";
  const scrollRef = useAutoHideHeader<HTMLDivElement>();

  // Reset header visibility on tab change
  useEffect(() => {
    $headerVisible.set(true);
    // Also reset scroll position on tab change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as TabId);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Tab Navigation */}
      <div data-tour="tabs">
        <Tabs tabs={TABS} activeTab={activeTab} onChange={handleTabChange} />
      </div>

      {/* Tab Content - Single scroll container with auto-hide detection */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto relative">
        <TabPanel id="operar" activeTab={activeTab}>
          <div data-tour="operar">
            <TransactionForm />
          </div>
        </TabPanel>

        <TabPanel id="contar" activeTab={activeTab}>
          <div data-tour="contar">
            <MoneyCounter />
          </div>
        </TabPanel>

        <TabPanel id="calcular" activeTab={activeTab}>
          <CalculatorTab />
        </TabPanel>

        <TabPanel id="reportes" activeTab={activeTab}>
          <div data-tour="reportes">
            <ReportsTab />
          </div>
        </TabPanel>
      </div>
    </div>
  );
}
