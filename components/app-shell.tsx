import Link from "next/link";
import {
  Activity,
  ArrowRightLeft,
  BarChart3,
  CalendarClock,
  Home,
  ListFilter,
  LogOut,
  Plus,
  ReceiptText,
  RotateCcw,
  Settings,
  UserRound
} from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import type { AppContext } from "@/lib/types";
import { signOutAction } from "@/app/actions";
import { ProfileAvatar } from "@/components/profile-avatar";

const navItems = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/transactions", label: "العمليات", icon: ListFilter },
  { href: "/monthly-expenses", label: "الثابتة", icon: CalendarClock },
  { href: "/repayments", label: "السداد", icon: RotateCcw },
  { href: "/converter", label: "التحويل", icon: ArrowRightLeft },
  { href: "/reports", label: "الكشف", icon: BarChart3 },
  { href: "/activity", label: "النشاط", icon: Activity },
  { href: "/profile", label: "الملف", icon: UserRound },
  { href: "/settings", label: "الإعدادات", icon: Settings }
];

const mobileNavItems = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/transactions", label: "العمليات", icon: ListFilter },
  { href: "/transactions/new", label: "جديد", icon: ReceiptText },
  { href: "/repayments", label: "السداد", icon: RotateCcw },
  { href: "/settings", label: "حسابي", icon: Settings }
];

function BrandMark() {
  return (
    <span className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-coin/40 bg-leafDark text-xl font-black text-coinSoft shadow-[0_14px_28px_rgba(31,42,31,0.18)]">
      ج
      <span className="absolute bottom-1.5 left-1.5 h-2 w-2 rounded-full bg-coin shadow-coin" />
      <span className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/12" />
    </span>
  );
}

export function AppShell({
  context,
  children
}: {
  context: AppContext;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <header className="sticky top-0 z-20 border-b border-line/70 bg-surface/92 shadow-[0_12px_34px_rgba(31,42,31,0.07)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <BrandMark />
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
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-line/80 bg-white/90 px-2 text-xs font-bold text-muted shadow-sm transition hover:border-leaf/40 hover:bg-limeSoft"
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
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-line/80 bg-white/90 text-leaf shadow-sm transition hover:border-leaf/40 hover:bg-limeSoft"
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
                className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-line/70 bg-white/80 px-3 py-2 text-sm font-bold text-leafDark shadow-sm transition hover:border-leaf/30 hover:bg-limeSoft"
              >
                <Icon className="h-4 w-4 text-leaf" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-5">{children}</main>
      <nav className="fixed inset-x-3 bottom-3 z-30 rounded-lg border border-line/80 bg-white/96 px-2 py-2 shadow-nav backdrop-blur-xl md:hidden">
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
                    ? "relative -mt-5 flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-lg bg-leaf text-[11px] font-black text-white shadow-elevated transition hover:bg-leafDark"
                    : "flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-bold text-muted transition hover:bg-limeSoft hover:text-leafDark"
                }
              >
                {isPrimary ? (
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-coin text-leafDark shadow-coin">
                    <Plus className="h-4 w-4" />
                  </span>
                ) : (
                  <Icon className="h-5 w-5 text-leaf" />
                )}
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
