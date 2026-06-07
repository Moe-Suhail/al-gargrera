import { redirect } from "next/navigation";
import { SUPPORTED_CURRENCIES } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { getCurrentContext } from "@/lib/current-context";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProfileAvatar } from "@/components/profile-avatar";
import { SetupState } from "@/components/setup-state";
import {
  changePasswordAction,
  updateProfileAction
} from "@/app/profile/actions";

const inputClass =
  "min-h-11 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-leafDark outline-none transition focus:border-leaf focus:ring-2 focus:ring-limeSoft";

const ERROR_COPY: Record<string, string> = {
  required: "اكتب الاسم المعروض.",
  save: "تعذر حفظ الملف الشخصي.",
  "password-match": "تأكيد كلمة المرور غير مطابق.",
  "password-weak": "كلمة المرور يجب أن تكون 8 أحرف على الأقل وتحتوي على حرف ورقم.",
  password: "تعذر تحديث كلمة المرور، حاول مرة أخرى"
};

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  searchParams
}: {
  searchParams: { success?: string; error?: string };
}) {
  const context = await getCurrentContext();

  if (!context.isConfigured) return <SetupState />;
  if (!context.user) redirect("/login");
  if (!context.accountSpace || !context.profile) {
    return (
      <SetupState
        title="لا يوجد حساب مشترك"
        description="أضف المستخدمين إلى account_members بعد تشغيل schema.sql."
      />
    );
  }

  const profile = context.profile;
  const error = searchParams.error ? ERROR_COPY[searchParams.error] : null;
  const success =
    searchParams.success === "password"
      ? "تم تحديث كلمة المرور بنجاح"
      : searchParams.success === "profile"
        ? "تم حفظ الملف الشخصي"
        : null;

  return (
    <AppShell context={context}>
      <PageHeader
        title="الملف الشخصي"
        subtitle="بياناتك الشخصية مرتبطة بحساب Supabase Auth الخاص بك."
      />
      {success ? (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
          {success}
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <form
          action={updateProfileAction}
          className="rounded-lg border border-line bg-white p-5 shadow-sm"
        >
          <div className="mb-5 flex items-center gap-4">
            <ProfileAvatar
              imageUrl={profile.profile_image_url}
              name={profile.display_name}
              size="lg"
            />
            <div>
              <h2 className="text-xl font-black text-leafDark">
                {profile.display_name}
              </h2>
              <p className="mt-1 text-sm text-muted">{profile.email}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-bold text-leafDark">الاسم</span>
              <input
                className={inputClass}
                defaultValue={profile.display_name}
                name="display_name"
                required
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-bold text-leafDark">البريد</span>
              <input
                className={`${inputClass} bg-mintpaper text-muted`}
                dir="ltr"
                readOnly
                value={profile.email}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-bold text-leafDark">الهاتف</span>
              <input
                className={inputClass}
                defaultValue={profile.phone ?? ""}
                name="phone"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-bold text-leafDark">
                العملة الافتراضية
              </span>
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
              <span className="text-sm font-bold text-leafDark">الدولة</span>
              <input
                className={inputClass}
                defaultValue={profile.country ?? ""}
                name="country"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-bold text-leafDark">المدينة</span>
              <input
                className={inputClass}
                defaultValue={profile.city ?? ""}
                name="city"
              />
            </label>
            <label className="grid gap-2 sm:col-span-2">
              <span className="text-sm font-bold text-leafDark">
                مكان الإقامة الحالي
              </span>
              <input
                className={inputClass}
                defaultValue={profile.current_residence_label ?? ""}
                name="current_residence_label"
                placeholder="القاهرة، مصر"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-bold text-leafDark">المنطقة الزمنية</span>
              <input
                className={inputClass}
                defaultValue={profile.timezone ?? ""}
                name="timezone"
                placeholder="Africa/Cairo"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-bold text-leafDark">رابط الصورة</span>
              <input
                className={inputClass}
                defaultValue={profile.profile_image_url ?? ""}
                dir="ltr"
                name="profile_image_url"
                type="url"
              />
            </label>
          </div>

          <p className="mt-4 rounded-lg bg-mintpaper px-3 py-2 text-sm leading-6 text-muted">
            لا يتم حفظ عنوان منزل دقيق هنا. استخدم الدولة والمدينة أو وصفًا عامًا
            لمكان الإقامة الحالي.
          </p>
          <button
            className="mt-5 rounded-lg bg-leaf px-5 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-leafDark"
            type="submit"
          >
            حفظ الملف الشخصي
          </button>
        </form>

        <div className="grid gap-5">
          <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-leafDark">تغيير كلمة المرور</h2>
            <form action={changePasswordAction} className="mt-4 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-leafDark">
                  كلمة المرور الجديدة
                </span>
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
                <span className="text-sm font-bold text-leafDark">
                  تأكيد كلمة المرور
                </span>
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
                className="rounded-lg border border-leaf bg-white px-5 py-3 text-sm font-bold text-leaf transition hover:bg-limeSoft"
                type="submit"
              >
                تحديث كلمة المرور
              </button>
            </form>
          </section>
          <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-leafDark">بيانات الحساب</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">تاريخ الإنشاء</dt>
                <dd className="font-semibold text-leafDark">
                  {formatDateTime(profile.created_at)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">آخر تحديث</dt>
                <dd className="font-semibold text-leafDark">
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
