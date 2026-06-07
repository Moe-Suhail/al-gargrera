/* eslint-disable @next/next/no-img-element */
import { notFound, redirect } from "next/navigation";
import {
  Archive,
  CheckCircle2,
  Image as ImageIcon,
  XCircle
} from "lucide-react";
import { TRANSACTION_TYPES } from "@/lib/constants";
import { getCurrentContext } from "@/lib/current-context";
import { getActivities, getTransactionById } from "@/lib/data";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  rateLine
} from "@/lib/format";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SetupState } from "@/components/setup-state";
import { StatusChip } from "@/components/status-chip";
import { TransactionForm } from "@/components/transaction-form";
import {
  addAttachmentAction,
  archiveTransactionAction,
  cancelTransactionAction,
  completeTransactionAction,
  confirmTransactionAction,
  rejectTransactionAction
} from "@/app/transactions/actions";

export const dynamic = "force-dynamic";

const inputClass =
  "min-h-11 rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-leaf focus:ring-2 focus:ring-limeSoft";

export default async function TransactionDetailsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const context = await getCurrentContext();

  if (!context.isConfigured) return <SetupState />;
  if (!context.user) redirect("/login");
  if (!context.accountSpace || !context.profile) {
    return <SetupState title="المساحة غير جاهزة" />;
  }

  const transaction = await getTransactionById(context, resolvedParams.id);
  if (!transaction) notFound();

  const activities = (await getActivities(context, 100)).filter(
    (activity) => activity.entity_id === transaction.id
  );
  const type = TRANSACTION_TYPES[transaction.type];
  const TypeIcon = type.icon;
  const canConfirm =
    transaction.status === "pending_confirmation" &&
    transaction.created_by !== context.profile.id;

  return (
    <AppShell context={context}>
      <PageHeader title="تفاصيل العملية" subtitle={transaction.description} />
      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-limeSoft text-leaf">
                  <TypeIcon className="h-5 w-5" />
                </span>
                <h1 className="text-2xl font-black text-leafDark">
                  {transaction.description}
                </h1>
                <StatusChip status={transaction.status} />
              </div>
              <p className="mt-3 text-sm leading-6 text-muted">{type.label}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-leafDark">
                {formatMoney(
                  transaction.original_amount,
                  transaction.original_currency
                )}
              </p>
              {transaction.original_currency !== transaction.base_currency ? (
                <p className="mt-1 text-sm font-semibold text-muted">
                  {formatMoney(
                    transaction.converted_amount_base,
                    transaction.base_currency
                  )}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-5 rounded-lg bg-mintpaper p-4 text-sm leading-7 text-muted">
            {transaction.status === "pending_confirmation"
              ? "هذه العملية تنتظر الموافقة، ولن تدخل في الرصيد الآن."
              : transaction.status === "confirmed" ||
                  transaction.status === "completed"
                ? "هذه العملية داخلة في الرصيد."
                : "هذه العملية لا تؤثر على الرصيد."}
          </div>

          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <Detail label="التاريخ" value={formatDate(transaction.transaction_date)} />
            <Detail
              label="الدافع"
              value={transaction.paid_by?.display_name ?? "مستخدم"}
            />
            <Detail
              label="الطرف المرتبط"
              value={transaction.related_user?.display_name ?? "مستخدم"}
            />
            <Detail
              label="سعر الصرف"
              value={rateLine(
                transaction.original_currency,
                transaction.base_currency,
                transaction.exchange_rate_to_base
              )}
            />
            <Detail
              label="مصدر السعر"
              value={
                transaction.rate_is_manual
                  ? "تم إدخال سعر الصرف يدويًا"
                  : transaction.exchange_rate_source
              }
            />
            <Detail label="تاريخ السعر" value={transaction.exchange_rate_date} />
          </dl>

          {transaction.notes ? (
            <div className="mt-5 rounded-lg border border-line p-4">
              <h2 className="font-bold text-leafDark">ملاحظة</h2>
              <p className="mt-2 text-sm leading-7 text-muted">
                {transaction.notes}
              </p>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            {canConfirm ? (
              <>
                <form action={confirmTransactionAction}>
                  <input type="hidden" name="id" value={transaction.id} />
                  <button
                    className="inline-flex items-center gap-2 rounded-lg bg-leaf px-4 py-2 text-sm font-bold text-white"
                    type="submit"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    موافقة
                  </button>
                </form>
                <form action={rejectTransactionAction} className="flex gap-2">
                  <input type="hidden" name="id" value={transaction.id} />
                  <input
                    className={inputClass}
                    name="rejection_reason"
                    placeholder="سبب الرفض"
                  />
                  <button
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700"
                    type="submit"
                  >
                    <XCircle className="h-4 w-4" />
                    رفض
                  </button>
                </form>
              </>
            ) : null}
            {transaction.status === "confirmed" ? (
              <form action={completeTransactionAction}>
                <input type="hidden" name="id" value={transaction.id} />
                <button
                  className="rounded-lg border border-leaf bg-white px-4 py-2 text-sm font-bold text-leaf hover:bg-limeSoft"
                  type="submit"
                >
                  مكتملة
                </button>
              </form>
            ) : null}
            <form action={cancelTransactionAction}>
              <input type="hidden" name="id" value={transaction.id} />
              <button
                className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-bold text-muted hover:bg-mintpaper"
                type="submit"
              >
                إلغاء
              </button>
            </form>
            <form action={archiveTransactionAction}>
              <input type="hidden" name="id" value={transaction.id} />
              <button
                className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2 text-sm font-bold text-muted hover:bg-mintpaper"
                type="submit"
              >
                <Archive className="h-4 w-4" />
                أرشفة
              </button>
            </form>
          </div>

          <details className="mt-6 rounded-lg border border-line bg-white p-4">
            <summary className="cursor-pointer font-bold text-leaf">
              تعديل العملية
            </summary>
            <div className="mt-4">
              <TransactionForm
                currentProfileId={context.profile.id}
                defaultCurrency={context.profile.default_currency ?? "EGP"}
                members={context.members}
                mode="edit"
                transaction={transaction}
              />
            </div>
          </details>
        </section>

        <aside className="grid gap-5">
          <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-black text-leafDark">
              <ImageIcon className="h-5 w-5 text-coin" />
              الإيصالات
            </h2>
            <div className="mt-4 grid gap-3">
              {transaction.attachments?.length ? (
                transaction.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.signed_url}
                    className="block overflow-hidden rounded-lg border border-line"
                    target="_blank"
                  >
                    {attachment.file_type?.startsWith("image/") &&
                    attachment.signed_url ? (
                      <img
                        src={attachment.signed_url}
                        alt={attachment.file_name}
                        className="h-48 w-full object-cover"
                      />
                    ) : (
                      <span className="block p-3 text-sm text-muted">
                        {attachment.file_name}
                      </span>
                    )}
                  </a>
                ))
              ) : (
                <p className="text-sm text-muted">لا يوجد إيصال</p>
              )}
            </div>
            <form action={addAttachmentAction} className="mt-4 grid gap-3">
              <input type="hidden" name="id" value={transaction.id} />
              <input
                accept="image/*"
                className={inputClass}
                name="receipt"
                required
                type="file"
              />
              <button
                className="rounded-lg bg-leaf px-4 py-2 text-sm font-bold text-white"
                type="submit"
              >
                رفع إيصال
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-leafDark">النشاط</h2>
            <div className="mt-4 grid gap-3">
              {activities.length ? (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="rounded-lg bg-mintpaper px-3 py-2 text-sm"
                  >
                    <p className="font-bold text-leafDark">{activity.action}</p>
                    <p className="mt-1 text-xs text-muted">
                      {activity.performer?.display_name ?? "مستخدم"} ·{" "}
                      {formatDateTime(activity.created_at)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">لا يوجد نشاط بعد</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2">
      <dt className="text-xs font-bold text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-leafDark">{value}</dd>
    </div>
  );
}
