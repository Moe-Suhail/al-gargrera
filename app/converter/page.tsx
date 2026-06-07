import { redirect } from "next/navigation";
import { getCurrentContext } from "@/lib/current-context";
import { AppShell } from "@/components/app-shell";
import { ConverterTool } from "@/components/converter-tool";
import { PageHeader } from "@/components/page-header";
import { SetupState } from "@/components/setup-state";

export const dynamic = "force-dynamic";

export default async function ConverterPage() {
  const context = await getCurrentContext();

  if (!context.isConfigured) return <SetupState />;
  if (!context.user) redirect("/login");
  if (!context.accountSpace) return <SetupState title="لا يوجد حساب مشترك" />;

  return (
    <AppShell context={context}>
      <PageHeader
        title="محول العملات"
        subtitle="تحويل سريع بسعر اليوم مع رابط لإنشاء عملية."
      />
      <ConverterTool />
    </AppShell>
  );
}
