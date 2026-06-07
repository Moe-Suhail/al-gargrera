import Image from "next/image";
import { CircleDollarSign, Coins, Landmark } from "lucide-react";
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
    <section className="relative overflow-hidden rounded-lg border border-line bg-white p-5 shadow-soft sm:p-7">
      <div className="pointer-events-none absolute -left-20 -top-16 h-72 w-72 opacity-[0.14] sm:-left-16 sm:-top-20 sm:h-96 sm:w-96">
        <Image
          src="/brand/al-gargeera-logo.png"
          alt=""
          fill
          className="object-contain"
          aria-hidden
        />
      </div>
      <div className="pointer-events-none absolute left-5 top-8 flex -space-x-3 space-x-reverse opacity-80">
        <span className="coin-chip scale-90">
          <span className="text-sm font-black">ج</span>
        </span>
        <span className="coin-chip translate-y-3 scale-75">
          <CircleDollarSign className="h-4 w-4" />
        </span>
        <span className="coin-chip -translate-y-2 scale-80">
          <span className="text-sm font-black">$</span>
        </span>
      </div>
      <div className="pointer-events-none absolute bottom-5 left-10 hidden items-end gap-1 opacity-70 sm:flex">
        <span className="h-8 w-7 rounded-full border border-coin/50 bg-gradient-to-b from-coinSoft to-coin shadow-coin" />
        <span className="h-11 w-7 rounded-full border border-coin/50 bg-gradient-to-b from-coinSoft to-coin shadow-coin" />
        <span className="h-6 w-7 rounded-full border border-coin/50 bg-gradient-to-b from-coinSoft to-coin shadow-coin" />
      </div>
      <div className="relative">
        <span className="inline-flex items-center gap-2 rounded-full border border-coinSoft bg-amber-50 px-3 py-1.5 text-sm font-black text-leaf">
          <Coins className="h-4 w-4 text-coin" />
          ملخص الرصيد
        </span>
        <h2 className="mt-4 text-[2rem] font-black leading-tight text-leafDark sm:text-5xl">
          {balanceText(balance, otherName)}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-7 text-muted">
          الرصيد يعتمد على العمليات الموافق عليها فقط. أي شيء جديد يظهر لك منفصلًا حتى تتم مراجعته.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800">
          <Landmark className="h-4 w-4" />
          قيد المراجعة: {formatMoney(Math.abs(pendingImpact))}
        </div>
      </div>
    </section>
  );
}
