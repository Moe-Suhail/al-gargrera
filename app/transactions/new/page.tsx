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
  searchParams: Promise<{
    amount?: string;
    currency?: string;
    rate?: string;
    source?: string;
    date?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const context = await getCurrentContext();

  if (!context.isConfigured) return <SetupState />;
  if (!context.user) redirect("/login");
  if (!context.accountSpace || !context.profile) {
    return <SetupState title="المساحة غير جاهزة" />;
  }

  return (
    <AppShell context={context}>
      <PageHeader
        title="عملية جديدة"
        subtitle="سجّل التفاصيل بوضوح، وسيظهر التحويل قبل الحفظ."
      />
      <TransactionForm
        currentProfileId={context.profile.id}
        defaultCurrency={context.profile.default_currency ?? "EGP"}
        initialAmount={resolvedSearchParams.amount}
        initialCurrency={resolvedSearchParams.currency}
        initialRate={resolvedSearchParams.rate}
        initialRateDate={resolvedSearchParams.date}
        initialRateSource={resolvedSearchParams.source}
        members={context.members}
      />
    </AppShell>
  );
}
