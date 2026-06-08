import { redirect } from "next/navigation";
import { getCurrentContext } from "@/lib/current-context";
import { signInAction } from "@/app/login/actions";
import { BrandMark } from "@/components/brand-mark";
import { SetupState } from "@/components/setup-state";

const ERROR_COPY: Record<string, string> = {
  env: "بيانات Supabase غير مكتملة.",
  login: "لم نتمكن من تسجيل الدخول. راجع البريد وكلمة المرور."
};

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const context = await getCurrentContext();

  if (!context.isConfigured) {
    return (
      <SetupState
        title="أضف بيانات Supabase"
        description="املأ NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY ثم أعد تشغيل التطبيق."
      />
    );
  }

  if (context.user) {
    redirect("/");
  }

  const error = resolvedSearchParams.error
    ? ERROR_COPY[resolvedSearchParams.error]
    : null;

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <section className="w-full max-w-md overflow-hidden rounded-lg border border-white/75 bg-white/64 p-6 shadow-[0_26px_76px_rgba(31,42,31,0.12)] ring-1 ring-white/70 backdrop-blur-2xl">
        <div className="flex justify-center">
          <BrandMark />
        </div>
        <div className="mt-6 text-center">
          <h1 className="text-2xl font-black text-ink">
            مرحبًا بك في الجرجيرة
          </h1>
          <p className="mt-2 text-sm leading-7 text-sage">
            سجّل دخولك لإدارة العمليات والرصيد في مساحة خاصة وواضحة.
          </p>
        </div>
        {error ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : null}
        <form action={signInAction} className="mt-5 grid gap-4">
          <input
            type="hidden"
            name="next"
            value={resolvedSearchParams.next ?? "/"}
          />
          <label className="grid gap-2">
            <span className="text-sm font-bold text-ink">البريد</span>
            <input
              autoComplete="email"
              className="min-h-11 rounded-lg border border-white/75 bg-white/72 px-3 text-sm text-ink outline-none transition focus:border-coin/55 focus:ring-2 focus:ring-coinSoft/45"
              dir="ltr"
              name="email"
              required
              type="email"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-bold text-ink">كلمة المرور</span>
            <input
              autoComplete="current-password"
              className="min-h-11 rounded-lg border border-white/75 bg-white/72 px-3 text-sm text-ink outline-none transition focus:border-coin/55 focus:ring-2 focus:ring-coinSoft/45"
              dir="ltr"
              name="password"
              required
              type="password"
            />
          </label>
          <button
            className="min-h-11 rounded-lg bg-gradient-to-b from-leaf to-[#173f26] px-5 py-3 text-sm font-black text-white shadow-soft transition hover:brightness-105"
            type="submit"
          >
            تسجيل الدخول
          </button>
        </form>
      </section>
    </main>
  );
}
