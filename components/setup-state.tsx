import Link from "next/link";
import { APP_TAGLINE } from "@/lib/constants";
import { BrandMark } from "@/components/brand-mark";

export function SetupState({
  title = "الإعداد غير مكتمل",
  description = "أضف بيانات Supabase في ملف البيئة ثم شغّل قاعدة البيانات من ملف schema.sql.",
  actionHref,
  actionLabel
}: {
  title?: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <section className="w-full max-w-xl rounded-lg border border-white/75 bg-white/64 p-6 text-center shadow-[0_26px_76px_rgba(31,42,31,0.12)] ring-1 ring-white/70 backdrop-blur-2xl">
        <div className="mb-5 flex justify-center">
          <BrandMark />
        </div>
        <p className="text-sm font-semibold text-coin">{APP_TAGLINE}</p>
        <h1 className="mt-2 text-2xl font-black text-ink">{title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-sage">
          {description}
        </p>
        {actionHref && actionLabel ? (
          <Link
            href={actionHref}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-gradient-to-b from-leaf to-[#173f26] px-5 py-3 text-sm font-black text-white shadow-soft transition hover:brightness-105"
          >
            {actionLabel}
          </Link>
        ) : null}
      </section>
    </main>
  );
}
