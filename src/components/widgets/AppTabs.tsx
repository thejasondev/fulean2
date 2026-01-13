import { useStore } from "@nanostores/react";
import { Calculator, Hash, ArrowRightLeft, BarChart3 } from "lucide-react";
import { $activeTab, setActiveTab, type TabId } from "../../stores/uiStore";
import { Tabs, TabPanel } from "../ui/Tabs";
import { MoneyCounter } from "./MoneyCounter";
import { CalculatorTab } from "./CalculatorTab";
import { TransactionForm } from "./TransactionForm";
import { ReportsTab } from "./ReportsTab";

// ============================================
// AppTabs Component
// Main tab wrapper with 4 tabs
// ============================================

const TABS = [
  {
    id: "contar" as TabId,
    label: "Contar",
    icon: <Hash className="w-4 h-4" />,
  },
  {
    id: "operar" as TabId,
    label: "Operar",
    icon: <ArrowRightLeft className="w-4 h-4" />,
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
  const activeTab = useStore($activeTab) ?? "contar";

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as TabId);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Tab Navigation */}
      <Tabs tabs={TABS} activeTab={activeTab} onChange={handleTabChange} />

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden relative">
        <TabPanel id="contar" activeTab={activeTab}>
          <MoneyCounter />
        </TabPanel>

        <TabPanel id="operar" activeTab={activeTab}>
          <TransactionForm />
        </TabPanel>

        <TabPanel id="calcular" activeTab={activeTab}>
          <CalculatorTab />
        </TabPanel>

        <TabPanel id="reportes" activeTab={activeTab}>
          <ReportsTab />
        </TabPanel>
      </div>
    </div>
  );
}
