import { DENOMINATIONS } from "../../lib/constants";
import { cn } from "../../lib/utils";
import { BillRow } from "./BillRow";

// ============================================
// MoneyCounter Component
// Main counter view with all denomination rows
// ============================================

export function MoneyCounter() {
  return (
    <main
      className={cn(
        // Layout
        "flex-1 overflow-y-auto",
        // Padding (consistent spacing scale)
        "px-4 py-4",
        // Bottom padding for compact footer (~100px + safe area)
        "pb-32"
      )}
    >
      {/* Bill Rows - 12px gap (3 × 4px base unit) */}
      <div className="space-y-3">
        {DENOMINATIONS.map((denomination) => (
          <BillRow key={denomination} denomination={denomination} />
        ))}
      </div>
    </main>
  );
}
