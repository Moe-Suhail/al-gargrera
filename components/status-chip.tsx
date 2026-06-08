import { TRANSACTION_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { TransactionStatus } from "@/lib/types";

export function StatusChip({ status }: { status: TransactionStatus }) {
  const item = TRANSACTION_STATUSES[status];
  const Icon = item.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold shadow-sm",
        item.chip
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {item.label}
    </span>
  );
}
