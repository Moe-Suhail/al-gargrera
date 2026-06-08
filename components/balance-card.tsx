import { Coins, ShieldCheck } from "lucide-react";
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
    <section className="relative overflow-hidden rounded-lg border border-white/18 bg-leafDark/82 p-5 text-white shadow-elevated ring-1 ring-coin/20 backdrop-blur-xl sm:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(246,227,161,0.16),transparent_22%),radial-gradient(circle_at_88%_10%,rgba(217,164,65,0.12),transparent_20%),linear-gradient(135deg,rgba(47,107,63,0.74),rgba(23,32,23,0.78)_58%,rgba(10,28,17,0.86))]" />
      <span className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-l from-transparent via-white/55 to-transparent" />
      <span className="pointer-events-none absolute inset-0 bg-white/[0.035]" />
      <span aria-hidden className="coin-chip pointer-events-none absolute left-6 top-8 rotate-[-18deg] scale-[0.36] opacity-25" />
      <span aria-hidden className="coin-chip pointer-events-none absolute bottom-8 left-16 rotate-[21deg] scale-[0.32] opacity-20" />

      <div className="relative sm:max-w-xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-coin/30 bg-white/10 px-3 py-1.5 text-sm font-black text-coinSoft backdrop-blur">
          <Coins className="h-4 w-4" />
          ملخص الرصيد
        </span>
        <h2 className="mt-4 text-[1.9rem] font-black leading-tight text-white sm:text-5xl">
          {balanceText(balance, otherName)}
        </h2>
        <p className="mt-3 text-sm leading-7 text-white/72">
          يعرض الرصيد العمليات المعتمدة فقط. البنود المعلقة تبقى منفصلة إلى أن تتم مراجعتها.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-coin/35 bg-coinSoft/12 px-3 py-2 text-sm font-bold text-coinSoft">
          <ShieldCheck className="h-4 w-4" />
          قيد المراجعة: {formatMoney(Math.abs(pendingImpact))}
        </div>
      </div>
    </section>
  );
}
