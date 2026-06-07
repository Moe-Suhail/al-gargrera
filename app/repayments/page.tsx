import { redirect } from "next/navigation";
import { getCurrentContext } from "@/lib/current-context";
import { getRepayments, getTransactions } from "@/lib/data";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RepaymentCard } from "@/components/repayment-card";
import { RepaymentForm } from "@/components/repayment-form";
import { SetupState } from "@/components/setup-state";

export const dynamic = "force-dynamic";

export default async function RepaymentsPage() {
  const context = await getCurrentContext();

  if (!context.isConfigured) return <SetupState />;
  if (!context.user) redirect("/login");
  if (!context.accountSpace || !context.profile) {
    return <SetupState title="لا يوجد حساب مشترك" />;
  }

  const [repayments, transactions] = await Promise.all([
    getRepayments(context),
    getTransactions(context)
  ]);

  return (
    <AppShell context={context}>
      <PageHeader
        title="السداد"
        subtitle="إضافة سداد كامل أو جزئي وربطه بعملية عند الحاجة."
      />
      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <section>
          <h2 className="mb-3 text-xl font-black text-leafDark">إضافة سداد</h2>
          <RepaymentForm
            currentProfileId={context.profile.id}
            defaultCurrency={context.profile.default_currency ?? "EGP"}
            members={context.members}
            transactions={transactions.filter(
              (transaction) =>
                transaction.status === "confirmed" ||
                transaction.status === "completed"
            )}
          />
        </section>
        <section>
          <h2 className="mb-3 text-xl font-black text-leafDark">قائمة السداد</h2>
          <div className="grid gap-3">
            {repayments.length ? (
              repayments.map((repayment) => (
                <RepaymentCard
                  key={repayment.id}
                  currentProfileId={context.profile?.id}
                  repayment={repayment}
                />
              ))
            ) : (
              <p className="rounded-lg border border-line bg-white p-5 text-sm text-muted">
                لا توجد عمليات سداد بعد
              </p>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
