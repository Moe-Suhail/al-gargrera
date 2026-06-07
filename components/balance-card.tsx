import Image from "next/image";
import { Clock3, Sprout } from "lucide-react";
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
      <div className="absolute -left-10 -top-10 hidden h-48 w-48 opacity-[0.08] sm:block">
        <Image
          src="/brand/al-gargeera-logo.png"
          alt=""
          fill
          className="object-contain"
          aria-hidden
        />
      </div>
      <div className="relative">
        <span className="inline-flex items-center gap-2 rounded-full border border-lime/55 bg-limeSoft px-3 py-1.5 text-sm font-bold text-leaf">
          <Sprout className="h-4 w-4" />
          ملخص الرصيد
        </span>
        <h2 className="mt-4 text-[2rem] font-black leading-tight text-leafDark sm:text-5xl">
          {balanceText(balance, otherName)}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-7 text-muted">
          الرصيد يعتمد على العمليات الموافق عليها فقط. أي شيء جديد يظهر لك منفصلًا حتى تتم مراجعته.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800">
          <Clock3 className="h-4 w-4" />
          قيد المراجعة: {formatMoney(Math.abs(pendingImpact))}
        </div>
      </div>
    </section>
  );
}
