import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRightLeft,
  BarChart3,
  CheckCircle2,
  Clock3,
  ReceiptText,
  RotateCcw,
  TrendingUp
} from "lucide-react";
import { QUICK_ACTIONS } from "@/lib/constants";
import { getCurrentContext, getOtherMember } from "@/lib/current-context";
import { getDashboardData } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import { AppShell } from "@/components/app-shell";
import { BalanceCard } from "@/components/balance-card";
import { PageHeader } from "@/components/page-header";
import { SetupState } from "@/components/setup-state";
import { StatCard } from "@/components/stat-card";
import { TransactionCard } from "@/components/transaction-card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const context = await getCurrentContext();

  if (!context.isConfigured) return <SetupState />;
  if (!context.user) redirect("/login");
  if (!context.accountSpace || !context.profile) {
    return (
      <SetupState
        title="لا توجد مساحة مشتركة"
        description="بعد إنشاء مستخدمي Supabase، اربطهما في account_members حسب README."
      />
    );
  }

  const data = await getDashboardData(context);
  const otherMember = getOtherMember(context);
  const pendingTransactions = data.transactions.filter(
    (transaction) => transaction.status === "pending_confirmation"
  );
  const recentTransactions = data.transactions.slice(0, 5);

  return (
    <AppShell context={context}>
      <PageHeader
        title="الرئيسية"
        subtitle="كل مبلغ في مكانه… وكل حساب واضح"
        actions={
          <Link
            href="/transactions/new"
            className="inline-flex items-center gap-2 rounded-lg bg-leaf px-4 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-leafDark"
          >
            <ReceiptText className="h-4 w-4" />
            إضافة عملية جديدة
          </Link>
        }
      />

      <BalanceCard
        balance={data.officialBalance}
        otherName={otherMember?.profile.display_name}
        pendingImpact={data.pendingImpact}
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_ACTIONS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg border border-line bg-white p-4 font-bold text-leafDark shadow-sm transition hover:border-leaf hover:bg-limeSoft"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-limeSoft text-leaf">
                <Icon className="h-5 w-5" />
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon={Clock3}
          title="بانتظار التأكيد"
          value={`${pendingTransactions.length}`}
          note="هذه العمليات لا تظهر في الرصيد الرسمي بعد."
        />
        <StatCard
          icon={CheckCircle2}
          title="عمليات مكتملة"
          value={`${data.transactions.filter((item) => item.status === "completed").length}`}
        />
        <StatCard
          icon={TrendingUp}
          title="إجمالي هذا الشهر"
          value={formatMoney(data.monthlyTotal)}
        />
        <StatCard
          icon={RotateCcw}
          title="آخر سداد"
          value={
            data.lastRepayment
              ? formatMoney(
                  data.lastRepayment.original_amount,
                  data.lastRepayment.original_currency
                )
              : "لا يوجد"
          }
        />
        <StatCard
          icon={BarChart3}
          title="أكبر عملية"
          value={
            data.biggestTransaction
              ? formatMoney(
                  data.biggestTransaction.original_amount,
                  data.biggestTransaction.original_currency
                )
              : "لا يوجد"
          }
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-leafDark">
              عمليات بانتظار التأكيد
            </h2>
            <Link href="/transactions" className="text-sm font-bold text-leaf">
              عرض الكل
            </Link>
          </div>
          <div className="grid gap-3">
            {pendingTransactions.length ? (
              pendingTransactions
                .slice(0, 3)
                .map((transaction) => (
                  <TransactionCard
                    key={transaction.id}
                    currentProfileId={context.profile?.id}
                    transaction={transaction}
                  />
                ))
            ) : (
              <p className="rounded-lg border border-line bg-white p-5 text-sm text-muted">
                لا توجد عمليات بانتظار التأكيد
              </p>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-leafDark">ملخص العملات</h2>
          <div className="mt-4 grid gap-3">
            {data.currencyTotals.length ? (
              data.currencyTotals.map((item) => (
                <div
                  key={item.currency}
                  className="flex items-center justify-between gap-3 rounded-lg bg-mintpaper px-3 py-2"
                >
                  <span className="font-bold text-leafDark">{item.currency}</span>
                  <span className="text-sm text-muted">
                    {formatMoney(item.originalTotal, item.currency)} ·{" "}
                    {formatMoney(item.convertedTotal)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">لا توجد عمليات مؤكدة بعد</p>
            )}
          </div>
          <Link
            href="/converter"
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-leaf px-4 py-2 text-sm font-bold text-leaf transition hover:bg-limeSoft"
          >
            <ArrowRightLeft className="h-4 w-4" />
            محول العملات
          </Link>
        </section>
      </div>

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-black text-leafDark">آخر العمليات</h2>
          <Link href="/transactions" className="text-sm font-bold text-leaf">
            كل العمليات
          </Link>
        </div>
        <div className="grid gap-3">
          {recentTransactions.length ? (
            recentTransactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                compact
                currentProfileId={context.profile?.id}
                transaction={transaction}
              />
            ))
          ) : (
            <p className="rounded-lg border border-line bg-white p-5 text-sm text-muted">
              لا توجد عمليات بعد
            </p>
          )}
        </div>
      </section>
    </AppShell>
  );
}
