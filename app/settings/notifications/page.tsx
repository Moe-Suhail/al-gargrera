import { redirect } from "next/navigation";
import { getCurrentContext } from "@/lib/current-context";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SetupState } from "@/components/setup-state";
import { updateNotificationSettingsAction } from "@/app/settings/notifications/actions";

const fields = [
  {
    name: "receive_email_notifications",
    label: "استقبال تنبيهات البريد"
  },
  {
    name: "notify_on_transaction_created",
    label: "عند إضافة عملية جديدة"
  },
  {
    name: "notify_on_transaction_confirmed",
    label: "عند تأكيد أو رفض العملية"
  },
  {
    name: "notify_on_transaction_completed",
    label: "عند اكتمال العملية"
  },
  {
    name: "notify_on_repayment",
    label: "عند إضافة أو تأكيد سداد"
  },
  {
    name: "notify_on_pending_reminder",
    label: "تذكير العمليات بانتظار التأكيد"
  }
] as const;

export const dynamic = "force-dynamic";

export default async function NotificationSettingsPage({
  searchParams
}: {
  searchParams: { success?: string; error?: string };
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
        title="إعدادات التنبيهات"
        subtitle="اختر رسائل البريد التي تريد استقبالها من الجرجيرة."
      />
      {searchParams.success ? (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
          تم حفظ إعدادات التنبيهات
        </p>
      ) : null}
      {searchParams.error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          تعذر حفظ إعدادات التنبيهات
        </p>
      ) : null}
      <form
        action={updateNotificationSettingsAction}
        className="max-w-2xl rounded-lg border border-line bg-white p-5 shadow-sm"
      >
        <div className="grid gap-3">
          {fields.map((field) => (
            <label
              key={field.name}
              className="flex items-center justify-between gap-4 rounded-lg border border-line bg-mintpaper px-4 py-3"
            >
              <span className="text-sm font-bold text-leafDark">{field.label}</span>
              <input
                className="h-5 w-5 accent-leaf"
                defaultChecked={Boolean(context.profile?.[field.name])}
                name={field.name}
                type="checkbox"
              />
            </label>
          ))}
        </div>
        <button
          className="mt-5 rounded-lg bg-leaf px-5 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-leafDark"
          type="submit"
        >
          حفظ الإعدادات
        </button>
      </form>
    </AppShell>
  );
}
