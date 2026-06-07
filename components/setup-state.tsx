import Image from "next/image";
import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

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
      <section className="money-pattern w-full max-w-xl rounded-lg border border-line bg-white/86 p-6 text-center shadow-soft backdrop-blur">
        <Image
          src="/brand/al-gargeera-logo.png"
          alt={APP_NAME}
          width={180}
          height={180}
          className="mx-auto mb-5 h-28 w-28 object-contain sm:h-36 sm:w-36"
          priority
        />
        <p className="text-sm font-semibold text-coin">{APP_TAGLINE}</p>
        <h1 className="mt-2 text-2xl font-bold text-leafDark">{title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted">
          {description}
        </p>
        {actionHref && actionLabel ? (
          <Link
            href={actionHref}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-leaf px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-leafDark"
          >
            {actionLabel}
          </Link>
        ) : null}
      </section>
    </main>
  );
}
