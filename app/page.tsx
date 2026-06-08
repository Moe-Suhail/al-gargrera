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
        title="المساحة غير جاهزة"
        description="اربط المستخدمين المصرح لهم في نفس المساحة من Supabase للبدء."
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
        title={`أهلًا، ${context.profile.display_name}`}
        subtitle="لوحة مالية مختصرة: الرصيد، المراجعات، وآخر حركة في مكان واحد."
        actions={
          <Link
            href="/transactions/new"
            className="inline-flex items-center gap-2 rounded-lg bg-leaf px-4 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-leafDark"
          >
            <ReceiptText className="h-4 w-4" />
            عملية جديدة
          </Link>
        }
      />

      <BalanceCard
        balance={data.officialBalance}
        otherName={otherMember?.profile.display_name}
        pendingImpact={data.pendingImpact}
      />

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {QUICK_ACTIONS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-lg border border-line/70 bg-white/90 p-4 shadow-card ring-1 ring-line/50 transition-colors hover:bg-limeSoft"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-lime/60 bg-limeSoft text-leaf shadow-sm transition-colors group-hover:bg-white">
                <Icon className="h-5 w-5" />
              </span>
              <span className="mt-3 block text-sm font-black text-ink">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard
          icon={Clock3}
          title="تنتظر الاعتماد"
          value={`${pendingTransactions.length}`}
          note="لا تدخل في الرصيد قبل المراجعة."
        />
        <StatCard
          icon={CheckCircle2}
          title="مكتملة"
          value={`${data.transactions.filter((item) => item.status === "completed").length}`}
        />
        <StatCard
          icon={TrendingUp}
          title="إجمالي الشهر"
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

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-ink">بانتظار الاعتماد</h2>
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
              <p className="rounded-lg border border-white/80 bg-white/90 p-5 text-sm text-sage shadow-card ring-1 ring-line/60">
                لا توجد عمليات تنتظر الاعتماد الآن.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-white/80 bg-white/90 p-5 shadow-card ring-1 ring-line/60">
          <h2 className="text-xl font-black text-ink">العملات</h2>
          <div className="mt-4 grid gap-3">
            {data.currencyTotals.length ? (
              data.currencyTotals.map((item) => (
                <div
                  key={item.currency}
                  className="flex items-center justify-between gap-3 rounded-lg bg-mintpaper px-3 py-2"
                >
                  <span className="font-black text-ink">{item.currency}</span>
                  <span className="text-sm text-sage">
                    {formatMoney(item.originalTotal, item.currency)} ·{" "}
                    {formatMoney(item.convertedTotal)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-sage">لا توجد عمليات معتمدة بعد.</p>
            )}
          </div>
          <Link
            href="/converter"
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-leaf px-4 py-2 text-sm font-bold text-leaf transition hover:bg-limeSoft"
          >
            <ArrowRightLeft className="h-4 w-4" />
            تحويل عملة
          </Link>
        </section>
      </div>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-black text-ink">آخر حركة</h2>
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
            <p className="rounded-lg border border-white/80 bg-white/90 p-5 text-sm text-sage shadow-card ring-1 ring-line/60">
              لا توجد عمليات بعد.
            </p>
          )}
        </div>
      </section>
    </AppShell>
  );
}
