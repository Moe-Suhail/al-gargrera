import Link from "next/link";
import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import { TRANSACTION_STATUSES } from "@/lib/constants";
import { getCurrentContext, getOtherMember } from "@/lib/current-context";
import { getDashboardData } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SetupState } from "@/components/setup-state";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const context = await getCurrentContext();

  if (!context.isConfigured) return <SetupState />;
  if (!context.user) redirect("/login");
  if (!context.accountSpace || !context.profile) {
    return <SetupState title="المساحة غير جاهزة" />;
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
    const totals = new Map<string, number>();

    data.transactions
      .filter(
        (transaction) =>
          (transaction.status === "confirmed" ||
            transaction.status === "completed") &&
          transaction.paid_by_user_id === member.user_id
      )
      .forEach((transaction) => {
        totals.set(
          transaction.base_currency,
          (totals.get(transaction.base_currency) ?? 0) +
            transaction.converted_amount_base
        );
      });

    return {
      member,
      totals: Array.from(totals.entries()).map(([currency, total]) => ({
        currency,
        total
      }))
    };
  });

  return (
    <AppShell context={context}>
      <PageHeader
        title="التقارير"
        subtitle="أرقام مختصرة تساعدك تفهم الوضع بسرعة."
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
          <h2 className="text-xl font-black text-leafDark">ملخص الرصيد</h2>
          <div className="mt-3 grid gap-2">
            {data.officialBalances.length ? (
              data.officialBalances.map((item) => (
                <p key={item.currency} className="text-3xl font-black text-leaf">
                  {item.amount > 0
                    ? `مستحق لك من ${otherMember?.profile.display_name ?? "الطرف الآخر"}: `
                    : `مستحق عليك لـ${otherMember?.profile.display_name ?? "الطرف الآخر"}: `}
                  {formatMoney(Math.abs(item.amount), item.currency)}
                </p>
              ))
            ) : (
              <p className="text-3xl font-black text-leaf">الرصيد متوازن</p>
            )}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {memberTotals.map(({ member, totals }) => (
              <div
                key={member.user_id}
                className="rounded-lg bg-mintpaper px-4 py-3"
              >
                <p className="text-sm text-muted">إجمالي ما دفعه</p>
                <p className="mt-1 font-black text-leafDark">
                  {member.profile.display_name}:{" "}
                  {totals.length
                    ? totals
                        .map((item) => formatMoney(item.total, item.currency))
                        .join(" · ")
                    : "لا يوجد"}
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
                  مسجلة كرصد: {formatMoney(item.convertedTotal, item.baseCurrency)}
                  {item.currency !== item.baseCurrency
                    ? " حسب سعر الصرف المحفوظ وقت العملية"
                    : " بدون تحويل"}
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
