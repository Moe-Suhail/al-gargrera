import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Bell,
  CalendarClock,
  CircleDollarSign,
  KeyRound,
  MapPin,
  UserRound
} from "lucide-react";
import { getCurrentContext } from "@/lib/current-context";
import { currencyShortName } from "@/lib/format";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProfileAvatar } from "@/components/profile-avatar";
import { SetupState } from "@/components/setup-state";

const accountLinks = [
  { href: "/profile", label: "تعديل الملف الشخصي", icon: UserRound },
  { href: "/profile", label: "تغيير كلمة المرور", icon: KeyRound },
  { href: "/profile", label: "العملة الافتراضية", icon: CircleDollarSign },
  { href: "/profile", label: "مكان الإقامة الحالي", icon: MapPin },
  { href: "/monthly-expenses", label: "المصاريف الثابتة", icon: CalendarClock },
  { href: "/settings/notifications", label: "تنبيهات البريد", icon: Bell }
];

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const context = await getCurrentContext();

  if (!context.isConfigured) return <SetupState />;
  if (!context.user) redirect("/login");
  if (!context.accountSpace || !context.profile) {
    return <SetupState title="المساحة غير جاهزة" />;
  }

  return (
    <AppShell context={context}>
      <PageHeader title="الإعدادات" subtitle="إدارة الحساب، التفضيلات، والصلاحيات." />
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-lg border border-white/80 bg-white/92 p-5 shadow-card ring-1 ring-line/60">
          <h2 className="text-lg font-black text-ink">حسابي</h2>
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-mintpaper p-4">
            <ProfileAvatar
              imageUrl={context.profile.profile_image_url}
              name={context.profile.display_name}
            />
            <div>
              <p className="font-bold text-ink">
                {context.profile.display_name}
              </p>
              <p className="text-sm text-sage">{context.profile.email}</p>
              <p className="mt-1 text-xs text-sage">
                {currencyShortName(context.profile.default_currency)} ·{" "}
                {context.profile.current_residence_label ?? "مكان الإقامة الحالي"}
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-2">
            {accountLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg border border-line bg-white/70 px-4 py-3 text-sm font-bold text-ink transition hover:border-leaf/40 hover:bg-limeSoft"
                >
                  <Icon className="h-4 w-4 text-leaf" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </section>
        <section className="rounded-lg border border-white/80 bg-white/92 p-5 shadow-card ring-1 ring-line/60">
          <h2 className="text-lg font-black text-ink">مساحة العمل</h2>
          <p className="mt-2 text-sm leading-6 text-sage">
            {context.accountSpace.name}
          </p>
          <div className="mt-4 grid gap-3">
            {context.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-lg bg-mintpaper p-3"
              >
                <ProfileAvatar
                  imageUrl={member.profile.profile_image_url}
                  name={member.profile.display_name}
                  size="sm"
                />
                <div>
                  <p className="font-bold text-ink">
                    {member.profile.display_name}
                  </p>
                  <p className="text-xs text-sage">
                    {member.role === "owner" ? "المالك" : "مستخدم"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
