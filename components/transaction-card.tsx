import Link from "next/link";
import { Paperclip, UserRound } from "lucide-react";
import { TRANSACTION_TYPES } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import { StatusChip } from "@/components/status-chip";
import {
  confirmTransactionAction,
  rejectTransactionAction
} from "@/app/transactions/actions";

export function TransactionCard({
  transaction,
  currentProfileId,
  compact = false
}: {
  transaction: Transaction;
  currentProfileId?: string;
  compact?: boolean;
}) {
  const type = TRANSACTION_TYPES[transaction.type];
  const Icon = type.icon;
  const canConfirm =
    transaction.status === "pending_confirmation" &&
    transaction.created_by !== currentProfileId;

  return (
    <article className="rounded-lg border border-line/70 bg-white/92 p-4 shadow-card ring-1 ring-line/50 transition-colors hover:border-leaf/25">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-coin/30 bg-coinSoft/70 text-leaf shadow-sm">
              <Icon className="h-5 w-5" />
            </span>
            <Link
              href={`/transactions/${transaction.id}`}
              className="min-w-0 max-w-full truncate text-base font-black text-ink hover:text-leaf"
            >
              {transaction.description}
            </Link>
            <StatusChip status={transaction.status} />
            {transaction.attachments?.length ? (
              <Paperclip className="h-4 w-4 text-coin" />
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-sage">
            <span>{type.label}</span>
            <span>{formatDate(transaction.transaction_date)}</span>
            <span className="inline-flex items-center gap-1">
              <UserRound className="h-3.5 w-3.5" />
              {transaction.paid_by?.display_name ?? "مستخدم"}
            </span>
          </div>
        </div>
        <div className="rounded-lg bg-mintpaper px-3 py-2 text-right sm:min-w-36">
          <p className="text-xl font-black text-ink">
            {formatMoney(
              transaction.original_amount,
              transaction.original_currency
            )}
          </p>
          {transaction.original_currency !== transaction.base_currency ? (
            <p className="mt-1 text-sm font-semibold text-sage">
              {formatMoney(
                transaction.converted_amount_base,
                transaction.base_currency
              )}
            </p>
          ) : null}
        </div>
      </div>
      {!compact && transaction.notes ? (
        <p className="mt-3 rounded-lg bg-mintpaper px-3 py-2 text-sm leading-6 text-sage">
          {transaction.notes}
        </p>
      ) : null}
      {canConfirm ? (
        <div className="mt-4 grid gap-2 border-t border-line pt-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <form action={confirmTransactionAction}>
            <input type="hidden" name="id" value={transaction.id} />
            <button
              className="w-full rounded-lg bg-leaf px-4 py-2 text-sm font-bold text-white shadow-soft transition hover:bg-leafDark sm:w-auto"
              type="submit"
            >
              اعتماد
            </button>
          </form>
          <form action={rejectTransactionAction} className="contents">
            <input type="hidden" name="id" value={transaction.id} />
            <input
              className="min-h-10 rounded-lg border border-line bg-white px-3 text-sm outline-none transition focus:border-leaf focus:ring-2 focus:ring-limeSoft"
              name="rejection_reason"
              placeholder="سبب الرفض"
            />
            <button
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100"
              type="submit"
            >
              رفض
            </button>
          </form>
        </div>
      ) : null}
    </article>
  );
}
