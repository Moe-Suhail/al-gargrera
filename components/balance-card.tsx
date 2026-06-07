import { Coins, Clock3, Sprout } from "lucide-react";
import { balanceText, formatMoney } from "@/lib/format";

export function BalanceCard({
  balance,
  pendingImpact,
  otherName
}: {
  balance: number;
  pendingImpact: number;
  otherName?: string | null;
}) {
  return (
    <section className="money-pattern relative overflow-hidden rounded-lg border border-line bg-white p-5 shadow-soft sm:p-7">
      <div className="absolute left-5 top-5 hidden items-center gap-2 sm:flex">
        <span className="coin-chip">
          <Coins className="h-4 w-4" />
        </span>
        <span className="coin-chip -mr-3 opacity-80">
          <span className="text-sm font-black">ج</span>
        </span>
      </div>
      <div className="relative max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-lg border border-lime/55 bg-limeSoft px-3 py-1.5 text-sm font-bold text-leaf">
          <Sprout className="h-4 w-4" />
          الرصيد الحالي
        </span>
        <h2 className="mt-5 text-3xl font-black leading-tight text-leafDark sm:text-5xl">
          {balanceText(balance, otherName)}
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-7 text-muted">
          العمليات المؤكدة والمكتملة فقط تظهر في هذا الرصيد.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
          <Clock3 className="h-4 w-4" />
          عمليات بانتظار التأكيد: {formatMoney(Math.abs(pendingImpact))}
        </div>
      </div>
    </section>
  );
}
