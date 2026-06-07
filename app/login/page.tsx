import Image from "next/image";
import { redirect } from "next/navigation";
import { APP_NAME } from "@/lib/constants";
import { getCurrentContext } from "@/lib/current-context";
import { signInAction } from "@/app/login/actions";
import { SetupState } from "@/components/setup-state";

const ERROR_COPY: Record<string, string> = {
  env: "بيانات Supabase غير مكتملة.",
  login: "تعذر تسجيل الدخول، تأكد من البريد وكلمة المرور."
};

export default async function LoginPage({
  searchParams
}: {
  searchParams: { error?: string; next?: string };
}) {
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

  const error = searchParams.error ? ERROR_COPY[searchParams.error] : null;

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <section className="money-pattern w-full max-w-md rounded-lg border border-line bg-white/90 p-6 shadow-soft backdrop-blur">
        <Image
          src="/brand/al-gargeera-logo.png"
          alt={APP_NAME}
          width={210}
          height={210}
          className="mx-auto h-36 w-36 object-contain"
          priority
        />
        <div className="mt-4 text-center">
          <h1 className="text-2xl font-black text-leafDark">
            مرحبًا بك في الجرجيرة 🌳
          </h1>
          <p className="mt-2 text-sm leading-7 text-muted">
            سجّل دخولك لمتابعة العمليات والرصيد بينك وبين أخيك.
          </p>
        </div>
        {error ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : null}
        <form action={signInAction} className="mt-5 grid gap-4">
          <input type="hidden" name="next" value={searchParams.next ?? "/"} />
          <label className="grid gap-2">
            <span className="text-sm font-bold text-leafDark">البريد</span>
            <input
              autoComplete="email"
              className="min-h-11 rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-leaf focus:ring-2 focus:ring-limeSoft"
              dir="ltr"
              name="email"
              required
              type="email"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-bold text-leafDark">كلمة المرور</span>
            <input
              autoComplete="current-password"
              className="min-h-11 rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-leaf focus:ring-2 focus:ring-limeSoft"
              dir="ltr"
              name="password"
              required
              type="password"
            />
          </label>
          <button
            className="min-h-11 rounded-lg bg-leaf px-5 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-leafDark"
            type="submit"
          >
            تسجيل الدخول
          </button>
        </form>
      </section>
    </main>
  );
}
