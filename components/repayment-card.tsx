import { RotateCcw } from "lucide-react";
import { formatDate, formatMoney } from "@/lib/format";
import type { Repayment } from "@/lib/types";
import { StatusChip } from "@/components/status-chip";
import { confirmRepaymentAction } from "@/app/repayments/actions";

export function RepaymentCard({
  repayment,
  currentProfileId
}: {
  repayment: Repayment;
  currentProfileId?: string;
}) {
  const canConfirm =
    repayment.status === "pending_confirmation" &&
    repayment.created_by !== currentProfileId;

  return (
    <article className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-limeSoft text-leaf">
              <RotateCcw className="h-4 w-4" />
            </span>
            <h2 className="font-bold text-leafDark">سداد</h2>
            <StatusChip status={repayment.status} />
          </div>
          <p className="mt-3 text-sm leading-6 text-muted">
            من {repayment.paid_by?.display_name ?? "مستخدم"} إلى{" "}
            {repayment.paid_to?.display_name ?? "مستخدم"} ·{" "}
            {formatDate(repayment.payment_date)}
          </p>
          {repayment.notes ? (
            <p className="mt-2 text-sm leading-6 text-muted">{repayment.notes}</p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-leafDark">
            {formatMoney(repayment.original_amount, repayment.original_currency)}
          </p>
          {repayment.original_currency !== repayment.base_currency ? (
            <p className="mt-1 text-sm font-semibold text-muted">
              {formatMoney(
                repayment.converted_amount_base,
                repayment.base_currency
              )}
            </p>
          ) : null}
        </div>
      </div>
      {canConfirm ? (
        <form action={confirmRepaymentAction} className="mt-4 border-t border-line pt-3">
          <input type="hidden" name="id" value={repayment.id} />
          <button
            className="rounded-lg bg-leaf px-4 py-2 text-sm font-bold text-white transition hover:bg-leafDark"
            type="submit"
          >
            قبول السداد
          </button>
        </form>
      ) : null}
    </article>
  );
}
