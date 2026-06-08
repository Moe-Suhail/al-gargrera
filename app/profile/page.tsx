import { redirect } from "next/navigation";
import { KeyRound, Mail, ShieldCheck } from "lucide-react";
import { SUPPORTED_CURRENCIES } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { getCurrentContext } from "@/lib/current-context";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProfileImagePicker } from "@/components/profile-image-picker";
import { SetupState } from "@/components/setup-state";
import {
  changePasswordAction,
  updateProfileAction
} from "@/app/profile/actions";

const inputClass =
  "min-h-11 w-full rounded-lg border border-white/75 bg-white/72 px-3 py-2 text-sm text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.68)] outline-none backdrop-blur-xl transition placeholder:text-sage/70 focus:border-coin/55 focus:bg-white focus:ring-2 focus:ring-coinSoft/45";
const labelClass = "text-sm font-black text-ink";

const ERROR_COPY: Record<string, string> = {
  required: "اكتب الاسم المعروض.",
  save: "لم يتم حفظ الملف الشخصي.",
  image: "لم يتم رفع الصورة. استخدم JPG أو PNG أو WebP بحجم مناسب.",
  "password-match": "تأكيد كلمة المرور غير مطابق.",
  "password-weak": "كلمة المرور يجب أن تكون 8 أحرف على الأقل وتحتوي على حرف ورقم.",
  password: "تعذر تحديث كلمة المرور، حاول مرة أخرى"
};

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  searchParams
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const context = await getCurrentContext();

  if (!context.isConfigured) return <SetupState />;
  if (!context.user) redirect("/login");
  if (!context.accountSpace || !context.profile) {
    return (
      <SetupState
        title="المساحة غير جاهزة"
        description="أضف المستخدمين المصرح لهم إلى نفس المساحة بعد تشغيل schema.sql."
      />
    );
  }

  const profile = context.profile;
  const error = resolvedSearchParams.error
    ? ERROR_COPY[resolvedSearchParams.error]
    : null;
  const success =
    resolvedSearchParams.success === "password"
      ? "تم تحديث كلمة المرور بنجاح"
      : resolvedSearchParams.success === "profile"
        ? "تم حفظ الملف الشخصي"
        : null;

  return (
    <AppShell context={context}>
      <PageHeader
        title="الملف الشخصي"
        subtitle="حدّث بيانات الحساب، الصورة، العملة الافتراضية، ومكان الإقامة الحالي."
      />

      {success ? (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50/85 px-3 py-2 text-sm font-semibold text-emerald-700">
          {success}
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50/85 px-3 py-2 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <form
          action={updateProfileAction}
          encType="multipart/form-data"
          className="rounded-lg border border-white/75 bg-white/62 p-5 shadow-[0_22px_62px_rgba(31,42,31,0.10)] ring-1 ring-white/70 backdrop-blur-2xl"
        >
          <input
            type="hidden"
            name="profile_image_url"
            value={profile.profile_image_url ?? ""}
          />

          <ProfileImagePicker
            imageUrl={profile.profile_image_url}
            name={profile.display_name}
          />

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className={labelClass}>الاسم</span>
              <input
                className={inputClass}
                defaultValue={profile.display_name}
                name="display_name"
                required
              />
            </label>
            <label className="grid gap-2">
              <span className={labelClass}>البريد</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-sage" />
                <input
                  className={`${inputClass} pr-9 text-sage`}
                  dir="ltr"
                  readOnly
                  value={profile.email}
                />
              </div>
            </label>
            <label className="grid gap-2">
              <span className={labelClass}>الهاتف</span>
              <input
                className={inputClass}
                defaultValue={profile.phone ?? ""}
                name="phone"
                placeholder="اختياري"
              />
            </label>
            <label className="grid gap-2">
              <span className={labelClass}>العملة الافتراضية</span>
              <select
                className={inputClass}
                defaultValue={profile.default_currency ?? "EGP"}
                name="default_currency"
              >
                {SUPPORTED_CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className={labelClass}>الدولة</span>
              <input
                className={inputClass}
                defaultValue={profile.country ?? ""}
                name="country"
                placeholder="مصر"
              />
            </label>
            <label className="grid gap-2">
              <span className={labelClass}>المدينة</span>
              <input
                className={inputClass}
                defaultValue={profile.city ?? ""}
                name="city"
                placeholder="القاهرة"
              />
            </label>
            <label className="grid gap-2 sm:col-span-2">
              <span className={labelClass}>مكان الإقامة الحالي</span>
              <input
                className={inputClass}
                defaultValue={profile.current_residence_label ?? ""}
                name="current_residence_label"
                placeholder="القاهرة، مصر"
              />
            </label>
            <label className="grid gap-2">
              <span className={labelClass}>المنطقة الزمنية</span>
              <input
                className={inputClass}
                defaultValue={profile.timezone ?? ""}
                name="timezone"
                placeholder="Africa/Cairo"
              />
            </label>
          </div>

          <p className="mt-4 rounded-lg border border-white/70 bg-white/50 px-3 py-2 text-sm leading-6 text-sage backdrop-blur-xl">
            لا يتم حفظ عنوان منزل دقيق هنا. استخدم الدولة والمدينة أو وصفًا عامًا لمكان الإقامة الحالي.
          </p>
          <button
            className="mt-5 rounded-lg bg-gradient-to-b from-leaf to-[#173f26] px-5 py-3 text-sm font-black text-white shadow-soft transition hover:brightness-105"
            type="submit"
          >
            حفظ الملف الشخصي
          </button>
        </form>

        <div className="grid gap-5">
          <section className="rounded-lg border border-white/75 bg-white/62 p-5 shadow-card ring-1 ring-white/70 backdrop-blur-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-leaf text-coinSoft">
                <KeyRound className="h-5 w-5" />
              </span>
              <h2 className="text-lg font-black text-ink">تغيير كلمة المرور</h2>
            </div>
            <form action={changePasswordAction} className="mt-4 grid gap-4">
              <label className="grid gap-2">
                <span className={labelClass}>كلمة المرور الجديدة</span>
                <input
                  autoComplete="new-password"
                  className={inputClass}
                  dir="ltr"
                  name="new_password"
                  required
                  type="password"
                />
              </label>
              <label className="grid gap-2">
                <span className={labelClass}>تأكيد كلمة المرور</span>
                <input
                  autoComplete="new-password"
                  className={inputClass}
                  dir="ltr"
                  name="confirm_password"
                  required
                  type="password"
                />
              </label>
              <button
                className="rounded-lg border border-leaf/35 bg-white/70 px-5 py-3 text-sm font-black text-leaf transition hover:bg-limeSoft"
                type="submit"
              >
                تحديث كلمة المرور
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-white/75 bg-white/62 p-5 shadow-card ring-1 ring-white/70 backdrop-blur-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-limeSoft text-leaf">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <h2 className="text-lg font-black text-ink">بيانات الحساب</h2>
            </div>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-sage">تاريخ الإنشاء</dt>
                <dd className="font-semibold text-ink">
                  {formatDateTime(profile.created_at)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-sage">آخر تحديث</dt>
                <dd className="font-semibold text-ink">
                  {formatDateTime(profile.updated_at)}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
