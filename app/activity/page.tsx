import { redirect } from "next/navigation";
import { getCurrentContext } from "@/lib/current-context";
import { getActivities } from "@/lib/data";
import { formatDateTime } from "@/lib/format";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SetupState } from "@/components/setup-state";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const context = await getCurrentContext();

  if (!context.isConfigured) return <SetupState />;
  if (!context.user) redirect("/login");
  if (!context.accountSpace) return <SetupState title="المساحة غير جاهزة" />;

  const activities = await getActivities(context, 100);

  return (
    <AppShell context={context}>
      <PageHeader title="النشاط" subtitle="سجل واضح لأهم التغييرات." />
      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <div className="grid gap-3">
          {activities.length ? (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="rounded-lg border border-line bg-mintpaper px-4 py-3"
              >
                <p className="font-black text-leafDark">{activity.action}</p>
                <p className="mt-1 text-sm text-muted">
                  {activity.performer?.display_name ?? "مستخدم"} ·{" "}
                  {formatDateTime(activity.created_at)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">لا يوجد نشاط بعد</p>
          )}
        </div>
      </section>
    </AppShell>
  );
}
