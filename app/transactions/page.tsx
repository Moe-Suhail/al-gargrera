import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import {
  SUPPORTED_CURRENCIES,
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES
} from "@/lib/constants";
import { getCurrentContext } from "@/lib/current-context";
import { getTransactions } from "@/lib/data";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SetupState } from "@/components/setup-state";
import { TransactionCard } from "@/components/transaction-card";

export const dynamic = "force-dynamic";

export default async function TransactionsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const context = await getCurrentContext();

  if (!context.isConfigured) return <SetupState />;
  if (!context.user) redirect("/login");
  if (!context.accountSpace || !context.profile) {
    return <SetupState title="المساحة غير جاهزة" />;
  }

  const transactions = await getTransactions(context, resolvedSearchParams);

  return (
    <AppShell context={context}>
      <PageHeader
        title="العمليات"
        subtitle="فلترة وبحث في كل العمليات المسجلة."
        actions={
          <Link
            href="/transactions/new"
            className="inline-flex items-center gap-2 rounded-lg bg-leaf px-4 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-leafDark"
          >
            <Plus className="h-4 w-4" />
            عملية جديدة
          </Link>
        }
      />

      <form className="mb-5 grid gap-3 rounded-lg border border-line bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
        <select className="min-h-11 rounded-lg border border-line px-3 text-sm" name="status" defaultValue={resolvedSearchParams.status ?? ""}>
          <option value="">الحالة</option>
          {Object.entries(TRANSACTION_STATUSES).map(([value, item]) => (
            <option key={value} value={value}>
              {item.label}
            </option>
          ))}
        </select>
        <select className="min-h-11 rounded-lg border border-line px-3 text-sm" name="type" defaultValue={resolvedSearchParams.type ?? ""}>
          <option value="">نوع العملية</option>
          {Object.entries(TRANSACTION_TYPES).map(([value, item]) => (
            <option key={value} value={value}>
              {item.label}
            </option>
          ))}
        </select>
        <select className="min-h-11 rounded-lg border border-line px-3 text-sm" name="currency" defaultValue={resolvedSearchParams.currency ?? ""}>
          <option value="">العملة</option>
          {SUPPORTED_CURRENCIES.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.code}
            </option>
          ))}
        </select>
        <select className="min-h-11 rounded-lg border border-line px-3 text-sm" name="person" defaultValue={resolvedSearchParams.person ?? ""}>
          <option value="">الشخص</option>
          {context.members.map((member) => (
            <option key={member.user_id} value={member.user_id}>
              {member.profile.display_name}
            </option>
          ))}
        </select>
        <input
          className="min-h-11 rounded-lg border border-line px-3 text-sm"
          defaultValue={resolvedSearchParams.query ?? ""}
          name="query"
          placeholder="بحث في الوصف"
        />
        <button className="rounded-lg bg-leaf px-4 py-2 text-sm font-bold text-white" type="submit">
          تطبيق
        </button>
      </form>

      <div className="grid gap-3">
        {transactions.length ? (
          transactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
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
    </AppShell>
  );
}
