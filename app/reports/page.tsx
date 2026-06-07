import Link from "next/link";
import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import { TRANSACTION_STATUSES } from "@/lib/constants";
import { getCurrentContext, getOtherMember } from "@/lib/current-context";
import {
  calculateOfficialBalance,
  getDashboardData
} from "@/lib/data";
import { balanceText, formatMoney } from "@/lib/format";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SetupState } from "@/components/setup-state";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const context = await getCurrentContext();

  if (!context.isConfigured) return <SetupState />;
  if (!context.user) redirect("/login");
  if (!context.accountSpace || !context.profile) {
    return <SetupState title="لا يوجد حساب مشترك" />;
  }

  const data = await getDashboardData(context);
  const otherMember = getOtherMember(context);
  const statusCounts = Object.keys(TRANSACTION_STATUSES).map((status) => ({
    status,
    label: TRANSACTION_STATUSES[status as keyof typeof TRANSACTION_STATUSES].label,
    count: data.transactions.filter((transaction) => transaction.status === status)
      .length
  }));
  const memberTotals = context.members.map((member) => {
    const total = data.transactions
      .filter(
        (transaction) =>
          (transaction.status === "confirmed" ||
            transaction.status === "completed") &&
          transaction.paid_by_user_id === member.user_id
      )
      .reduce((sum, transaction) => sum + transaction.converted_amount_base, 0);

    return { member, total };
  });

  return (
    <AppShell context={context}>
      <PageHeader
        title="كشف بسيط"
        subtitle="ملخص واضح للرصيد والعملات والحالات."
        actions={
          <Link
            className="inline-flex items-center gap-2 rounded-lg border border-leaf bg-white px-4 py-3 text-sm font-bold text-leaf transition hover:bg-limeSoft"
            href="/api/reports?format=csv"
          >
            <Download className="h-4 w-4" />
            تنزيل CSV
          </Link>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="rounded-lg border border-line bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-xl font-black text-leafDark">الرصيد الحالي</h2>
          <p className="mt-3 text-3xl font-black text-leaf">
            {balanceText(
              calculateOfficialBalance(
                data.transactions,
                data.repayments,
                context.profile.id
              ),
              otherMember?.profile.display_name
            )}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {memberTotals.map(({ member, total }) => (
              <div
                key={member.user_id}
                className="rounded-lg bg-mintpaper px-4 py-3"
              >
                <p className="text-sm text-muted">إجمالي ما دفعه</p>
                <p className="mt-1 font-black text-leafDark">
                  {member.profile.display_name}: {formatMoney(total)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-leafDark">حسب الحالة</h2>
          <div className="mt-4 grid gap-2">
            {statusCounts.map((item) => (
              <div
                key={item.status}
                className="flex items-center justify-between rounded-lg bg-mintpaper px-3 py-2 text-sm"
              >
                <span className="font-bold text-leafDark">{item.label}</span>
                <span className="text-muted">{item.count}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-5 rounded-lg border border-line bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-leafDark">تفصيل العملات</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.currencyTotals.length ? (
            data.currencyTotals.map((item) => (
              <div key={item.currency} className="rounded-lg bg-mintpaper p-4">
                <p className="font-black text-leafDark">
                  إجمالي العمليات بـ{item.currency}:{" "}
                  {formatMoney(item.originalTotal, item.currency)}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  ما يعادل تقريبًا: {formatMoney(item.convertedTotal)} حسب الأسعار
                  المحفوظة وقت كل عملية
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">لا توجد عمليات مؤكدة بعد</p>
          )}
        </div>
      </section>
    </AppShell>
  );
}
