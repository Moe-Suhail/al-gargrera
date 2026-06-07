import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowRightLeft,
  BarChart3,
  Home,
  ListFilter,
  LogOut,
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
  { href: "/converter", label: "محول العملات", icon: ArrowRightLeft },
  { href: "/reports", label: "الكشف", icon: BarChart3 },
  { href: "/activity", label: "النشاط", icon: Activity },
  { href: "/profile", label: "الملف الشخصي", icon: UserRound },
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
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <Image
              src="/brand/al-gargeera-logo.png"
              alt={APP_NAME}
              width={52}
              height={52}
              className="h-12 w-12 rounded-lg object-contain"
              priority
            />
            <span className="min-w-0">
              <span className="block truncate text-lg font-bold text-leafDark">
                {APP_NAME}
              </span>
              <span className="hidden text-xs text-muted sm:block">
                {APP_TAGLINE}
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="hidden items-center gap-2 rounded-lg border border-line bg-white px-2 py-1.5 text-xs font-semibold text-muted transition hover:border-leaf hover:bg-limeSoft sm:inline-flex"
            >
              <ProfileAvatar
                imageUrl={context.profile?.profile_image_url}
                name={context.profile?.display_name}
                size="sm"
              />
              {context.profile?.display_name}
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
        <nav className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-leafDark transition hover:border-lime hover:bg-limeSoft"
              >
                <Icon className="h-4 w-4 text-leaf" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
