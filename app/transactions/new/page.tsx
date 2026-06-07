import { redirect } from "next/navigation";
import { getCurrentContext } from "@/lib/current-context";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SetupState } from "@/components/setup-state";
import { TransactionForm } from "@/components/transaction-form";

export const dynamic = "force-dynamic";

export default async function NewTransactionPage({
  searchParams
}: {
  searchParams: {
    amount?: string;
    currency?: string;
    rate?: string;
    source?: string;
    date?: string;
  };
}) {
  const context = await getCurrentContext();

  if (!context.isConfigured) return <SetupState />;
  if (!context.user) redirect("/login");
  if (!context.accountSpace || !context.profile) {
    return <SetupState title="لا يوجد حساب مشترك" />;
  }

  return (
    <AppShell context={context}>
      <PageHeader
        title="إضافة عملية جديدة"
        subtitle="أضف المبلغ والعملة، وسيظهر التحويل قبل الحفظ."
      />
      <TransactionForm
        currentProfileId={context.profile.id}
        defaultCurrency={context.profile.default_currency ?? "EGP"}
        initialAmount={searchParams.amount}
        initialCurrency={searchParams.currency}
        initialRate={searchParams.rate}
        initialRateDate={searchParams.date}
        initialRateSource={searchParams.source}
        members={context.members}
      />
    </AppShell>
  );
}
