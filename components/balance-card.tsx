import { Coins, ShieldCheck } from "lucide-react";
import { formatMoney, profileName } from "@/lib/format";
import type { CurrencyCode } from "@/lib/types";

type CurrencyBalance = {
  currency: CurrencyCode;
  amount: number;
};

export function BalanceCard({
  balances,
  pendingBalances,
  otherName
}: {
  balances: CurrencyBalance[];
  pendingBalances: CurrencyBalance[];
  otherName?: string | null;
}) {
  const name = profileName(otherName);
  const activeBalances = balances.filter((item) => Math.abs(item.amount) >= 0.01);
  const activePending = pendingBalances.filter(
    (item) => Math.abs(item.amount) >= 0.01
  );

  return (
    <section className="relative overflow-hidden rounded-lg border border-coin/18 bg-leafDark p-5 text-white shadow-elevated ring-1 ring-coin/20 sm:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(47,107,63,0.70),rgba(23,32,23,0.78)_58%,rgba(10,28,17,0.84))]" />
      <span className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-l from-transparent via-white/55 to-transparent" />

      <div className="relative sm:max-w-xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-coin/30 bg-white/10 px-3 py-1.5 text-sm font-black text-coinSoft">
          <Coins className="h-4 w-4" />
          ملخص الرصيد
        </span>
        {activeBalances.length ? (
          <div className="mt-4 grid gap-3">
            {activeBalances.map((item) => {
              const isReceivable = item.amount > 0;

              return (
                <div key={item.currency}>
                  <p className="text-sm font-bold text-white/68">
                    {isReceivable ? `مستحق لك من ${name}` : `مستحق عليك لـ${name}`}
                  </p>
                  <p className="mt-1 text-[1.9rem] font-black leading-tight text-white sm:text-5xl">
                    {formatMoney(Math.abs(item.amount), item.currency)}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <h2 className="mt-4 text-[1.9rem] font-black leading-tight text-white sm:text-5xl">
            الرصيد متوازن
          </h2>
        )}
        <p className="mt-3 text-sm leading-7 text-white/72">
          لا يتم جمع العملات المختلفة. كل عملة تظهر في رصيد مستقل.
        </p>
        <div className="mt-5 inline-flex max-w-full flex-wrap items-center gap-2 rounded-lg border border-coin/35 bg-coinSoft/12 px-3 py-2 text-sm font-bold text-coinSoft">
          <ShieldCheck className="h-4 w-4" />
          <span>قيد المراجعة:</span>
          {activePending.length ? (
            activePending.map((item, index) => (
              <span key={item.currency}>
                {index ? " · " : ""}
                {formatMoney(Math.abs(item.amount), item.currency)}
              </span>
            ))
          ) : (
            <span>لا يوجد</span>
          )}
        </div>
      </div>
    </section>
  );
}
