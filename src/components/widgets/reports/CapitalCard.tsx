import { useState } from "react";
import { useStore } from "@nanostores/react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Edit3,
  Check,
  RotateCcw,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Receipt,
} from "lucide-react";
import {
  $walletInitialCapital,
  $currentBalance,
  $totalIn,
  $totalOut,
  setInitialCapital,
  resetCapital,
} from "../../../stores/capitalStore";
import { $inventorySummary } from "../../../stores/inventoryStore";
import {
  $expenses,
  $totalExpenses,
  addExpense,
  deleteExpense,
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
} from "../../../stores/expensesStore";
import {
  $savingsPerCurrency,
  $savingsTotalCUP,
} from "../../../stores/savingsStore";
import { $sellRates } from "../../../stores/ratesStore";
import { confirm } from "../../../stores/confirmStore";
import { type Currency } from "../../../lib/constants";
import { formatNumber } from "../../../lib/formatters";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { useToast } from "../../ui/Toast";
import { useHaptic } from "../../../hooks/useHaptic";

export function CapitalCard() {
  const initialCapital = useStore($walletInitialCapital);
  const currentBalance = useStore($currentBalance);

  const expenses = useStore($expenses);
  const totalExpenses = useStore($totalExpenses);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] =
    useState<ExpenseCategory>("transport");

  const haptic = useHaptic();
  const { toast } = useToast();

  const handleEdit = () => {
    setEditValue(initialCapital.toString());
    setIsEditing(true);
  };

  const handleSave = () => {
    const value = parseInt(editValue, 10);
    if (isNaN(value) || value < 0) {
      toast.error("Ingrese un monto válido");
      return;
    }
    haptic.medium();
    setInitialCapital(value);
    setIsEditing(false);
    toast.success("Capital inicial actualizado");
  };

  const handleReset = async () => {
    const confirmed = await confirm({
      title: "Reiniciar Capital",
      message: "¿Borrar todo el historial de capital?",
      confirmLabel: "Reiniciar",
      variant: "danger",
    });
    if (confirmed) {
      haptic.heavy();
      resetCapital();
      toast.info("Capital reiniciado");
    }
  };

  const handleAddExpense = () => {
    const amount = parseInt(expenseAmount, 10);
    if (!expenseDesc.trim() || isNaN(amount) || amount <= 0) {
      toast.warning("Ingrese descripción y monto válido");
      return;
    }

    addExpense(expenseDesc, amount, expenseCategory);
    haptic.light();
    toast.success("Gasto registrado");

    setExpenseDesc("");
    setExpenseAmount("");
    setExpenseCategory("transport");
    setShowExpenseForm(false);
  };

  const handleDeleteExpense = (id: string) => {
    deleteExpense(id);
    haptic.light();
    toast.info("Gasto eliminado");
  };

  const inventorySummary = useStore($inventorySummary);
  const totalInventoryValue = Object.values(inventorySummary).reduce(
    (sum, item) => sum + item.totalCost,
    0,
  );

  const totalEquity = currentBalance + totalInventoryValue;

  const savingsPerCurrency = useStore($savingsPerCurrency);
  const savingsTotalCUP = useStore($savingsTotalCUP);
  const currentSellRates = useStore($sellRates);
  const savingsCurrentValue = Object.entries(savingsPerCurrency).reduce(
    (sum, [currency, amount]) => {
      const rate = currentSellRates[currency as Currency] || 0;
      return sum + (amount || 0) * rate;
    },
    0,
  );

  const netPatrimony = totalEquity - totalExpenses + savingsCurrentValue;
  const realNetChange = netPatrimony - initialCapital;
  const realPercentageChange =
    initialCapital > 0 ? (realNetChange / initialCapital) * 100 : 0;
  const isPositive = realNetChange >= 0;

  return (
    <div className="bg-(--bg-primary) rounded-2xl p-5 border border-(--border-primary)">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-(--status-success-bg) flex items-center justify-center">
            <Wallet className="w-5 h-5 text-(--status-success)" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-(--text-primary)">
              Capital de Operación
            </h3>
            <p className="text-xs text-(--text-faint)">Gestión de patrimonio</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-8 w-8 p-0 text-(--text-faint) hover:text-(--status-error)"
          title="Reiniciar"
        >
          <RotateCcw size={14} />
        </Button>
      </div>

      {/* Initial Capital - Editable */}
      <div className="bg-(--bg-base) rounded-xl p-4 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-(--text-muted)">Capital Inicial</span>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-28 h-8 text-right text-sm"
                numericOnly
                autoFocus
              />
              <button
                onClick={handleSave}
                className="w-8 h-8 rounded-lg bg-(--status-success-bg) text-(--status-success) flex items-center justify-center hover:opacity-80"
                title="Guardar"
              >
                <Check size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 text-(--text-primary) font-bold tabular-nums hover:text-(--status-success) transition-colors"
            >
              {formatNumber(initialCapital)} CUP
              <Edit3 size={12} className="text-(--text-faint)" />
            </button>
          )}
        </div>
      </div>

      {/* Asset Breakdown */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-(--bg-base) rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs text-(--text-faint)">Efectivo (CUP)</span>
            {totalExpenses > 0 && (
              <span className="text-[10px] text-(--status-error)">*neto</span>
            )}
          </div>
          <span className="text-sm font-bold text-(--text-primary) tabular-nums">
            {formatNumber(currentBalance - totalExpenses)}
          </span>
          {totalExpenses > 0 && (
            <div className="text-[10px] text-(--text-faint) mt-0.5">
              <span className="line-through opacity-60">
                {formatNumber(currentBalance)}
              </span>
              <span className="text-(--status-error) ml-1">
                -{formatNumber(totalExpenses)}
              </span>
            </div>
          )}
        </div>
        <div className="bg-(--bg-base) rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs text-(--text-faint)">
              Invertido (Divisa)
            </span>
          </div>
          <span className="text-sm font-bold text-(--status-error) tabular-nums">
            {formatNumber(totalInventoryValue)}
          </span>
        </div>
      </div>

      {/* Operational Expenses Section */}
      <div className="mb-3">
        <button
          onClick={() => setShowExpenseForm(!showExpenseForm)}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-(--bg-base) hover:bg-(--bg-secondary) transition-colors"
        >
          <div className="flex items-center gap-2">
            <Receipt size={16} className="text-(--status-error)" />
            <span className="text-sm font-medium text-(--text-primary)">
              Gastos Operativos
            </span>
            {totalExpenses > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-(--status-error-bg) text-(--status-error) font-bold tabular-nums">
                -{formatNumber(totalExpenses)}
              </span>
            )}
          </div>
          {showExpenseForm ? (
            <ChevronDown size={16} className="text-(--text-muted)" />
          ) : (
            <ChevronRight size={16} className="text-(--text-muted)" />
          )}
        </button>

        {showExpenseForm && (
          <div className="mt-2 p-3 rounded-xl bg-(--bg-base) border border-(--border-primary) space-y-3">
            {/* Add Expense Form */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  placeholder="Descripción del gasto"
                  className="flex-1 text-sm"
                  maxLength={50}
                />
                <Input
                  type="number"
                  inputMode="numeric"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="CUP"
                  className="w-24 text-sm text-right"
                  numericOnly
                />
              </div>

              {/* Category Selector */}
              <div className="flex gap-1.5 flex-wrap">
                {(Object.keys(EXPENSE_CATEGORIES) as ExpenseCategory[]).map(
                  (cat) => {
                    const { label, emoji } = EXPENSE_CATEGORIES[cat];
                    const isSelected = expenseCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setExpenseCategory(cat)}
                        className={cn(
                          "px-2 py-1 rounded-lg text-xs font-medium transition-colors",
                          isSelected
                            ? "bg-(--status-error-bg) text-(--status-error) border border-(--status-error)/30"
                            : "bg-(--bg-secondary) text-(--text-muted) border border-transparent hover:border-(--border-secondary)",
                        )}
                      >
                        {emoji} {label}
                      </button>
                    );
                  },
                )}
              </div>

              <Button
                onClick={handleAddExpense}
                variant="primary"
                size="sm"
                className="w-full bg-(--status-error) hover:bg-(--status-error)/80"
              >
                <Plus size={14} />
                Agregar Gasto
              </Button>
            </div>

            {/* Expense List */}
            {expenses.length > 0 && (
              <div className="border-t border-(--border-primary) pt-2 space-y-1 max-h-40 overflow-y-auto">
                {expenses.slice(0, 5).map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between py-2 px-2 rounded-lg bg-(--bg-secondary)/50 active:bg-(--bg-hover)"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-base shrink-0">
                        {EXPENSE_CATEGORIES[expense.category].emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs text-(--text-muted) truncate block">
                          {expense.description}
                        </span>
                        <span className="text-xs font-bold text-(--status-error) tabular-nums">
                          -{formatNumber(expense.amount)} CUP
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className={cn(
                        "shrink-0 ml-2 p-2.5 rounded-lg",
                        "bg-(--status-error-bg) text-(--status-error)",
                        "active:scale-95 transition-transform",
                        "min-w-[44px] min-h-[44px] flex items-center justify-center",
                      )}
                      aria-label={`Eliminar gasto: ${expense.description}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {expenses.length > 5 && (
                  <p className="text-[10px] text-(--text-faint) text-center py-1">
                    +{expenses.length - 5} gastos más
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Patrimony Summary */}
      <div className="bg-gradient-to-r from-(--blue)/10 to-transparent rounded-xl p-4 border border-(--blue)/20">
        {/* Gross Patrimony */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-(--text-muted)">Patrimonio Bruto</span>
          <span className="text-sm font-bold text-(--text-primary) tabular-nums">
            {formatNumber(totalEquity)} CUP
          </span>
        </div>

        {/* Expenses Deduction */}
        {totalExpenses > 0 && (
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-(--border-primary)/50">
            <span className="text-xs text-(--status-error)">
              Gastos Operativos
            </span>
            <span className="text-sm font-bold text-(--status-error) tabular-nums">
              -{formatNumber(totalExpenses)} CUP
            </span>
          </div>
        )}

        {/* Savings Value */}
        {savingsCurrentValue > 0 && (
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-(--border-primary)/50">
            <span className="text-xs text-(--status-success)">
              Ahorros en Divisas
            </span>
            <span className="text-sm font-bold text-(--status-success) tabular-nums">
              +{formatNumber(savingsCurrentValue)} CUP
            </span>
          </div>
        )}

        {/* Net Patrimony */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-(--text-muted)">Patrimonio Neto</span>
            <div className="text-2xl font-bold text-(--blue) tabular-nums">
              {formatNumber(netPatrimony)} CUP
            </div>
          </div>
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",
              isPositive
                ? "bg-(--status-success-bg) text-(--status-success)"
                : "bg-(--status-error-bg) text-(--status-error)",
            )}
          >
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {isPositive ? "+" : ""}
            {realPercentageChange.toFixed(1)}%
          </div>
        </div>
        <div className="mt-2 text-sm text-(--text-muted)">
          Variación Real:
          <span
            className={cn(
              "font-bold ml-1 tabular-nums",
              isPositive ? "text-(--status-success)" : "text-(--status-error)",
            )}
          >
            {isPositive ? "+" : ""}
            {formatNumber(realNetChange)} CUP
          </span>
        </div>
      </div>
    </div>
  );
}
