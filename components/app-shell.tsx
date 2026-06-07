import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowRightLeft,
  BarChart3,
  Home,
  ListFilter,
  LogOut,
  ReceiptText,
  UserRound,
  RotateCcw,
  Settings
} from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import type { AppContext } from "@/lib/types";
import { signOutAction } from "@/app/actions";
import { ProfileAvatar } from "@/components/profile-avatar";

const navItems = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/transactions", label: "العمليات", icon: ListFilter },
  { href: "/repayments", label: "السداد", icon: RotateCcw },
  { href: "/converter", label: "التحويل", icon: ArrowRightLeft },
  { href: "/reports", label: "الكشف", icon: BarChart3 },
  { href: "/activity", label: "النشاط", icon: Activity },
  { href: "/profile", label: "الملف الشخصي", icon: UserRound },
  { href: "/settings", label: "الإعدادات", icon: Settings }
];

const mobileNavItems = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/transactions", label: "العمليات", icon: ListFilter },
  { href: "/transactions/new", label: "جديد", icon: ReceiptText },
  { href: "/repayments", label: "السداد", icon: RotateCcw },
  { href: "/settings", label: "الإعدادات", icon: Settings }
];

export function AppShell({
  context,
  children
}: {
  context: AppContext;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <header className="sticky top-0 z-20 border-b border-line/80 bg-paper/96 shadow-[0_8px_30px_rgba(47,107,63,0.06)] backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <Image
              src="/brand/al-gargeera-logo.png"
              alt={APP_NAME}
              width={52}
              height={52}
              className="h-11 w-11 rounded-lg object-contain"
              priority
            />
            <span className="min-w-0">
              <span className="block truncate text-lg font-black text-leafDark">
                {APP_NAME}
              </span>
              <span className="hidden max-w-[300px] truncate text-xs text-muted sm:block">
                {APP_TAGLINE}
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-2 py-1.5 text-xs font-semibold text-muted transition hover:border-leaf hover:bg-limeSoft"
            >
              <ProfileAvatar
                imageUrl={context.profile?.profile_image_url}
                name={context.profile?.display_name}
                size="sm"
              />
              <span className="hidden sm:inline">{context.profile?.display_name}</span>
            </Link>
            <form action={signOutAction}>
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white text-leaf transition hover:border-leaf hover:bg-limeSoft"
                title="تسجيل الخروج"
                type="submit"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
        <nav className="mx-auto hidden max-w-5xl gap-2 overflow-x-auto px-4 pb-3 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-line bg-white/90 px-3 py-2 text-sm font-bold text-leafDark transition hover:border-lime hover:bg-limeSoft"
              >
                <Icon className="h-4 w-4 text-leaf" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-5">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/96 px-2 pb-3 pt-2 shadow-[0_-12px_30px_rgba(47,107,63,0.10)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isPrimary = item.href === "/transactions/new";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  isPrimary
                    ? "flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg bg-leaf text-[11px] font-bold text-white shadow-soft transition hover:bg-leafDark"
                    : "flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-bold text-muted transition hover:bg-limeSoft hover:text-leafDark"
                }
              >
                <Icon className={isPrimary ? "h-5 w-5 text-white" : "h-5 w-5 text-leaf"} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
