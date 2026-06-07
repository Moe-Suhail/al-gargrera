"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { BASE_CURRENCY, SUPPORTED_CURRENCIES } from "@/lib/constants";
import { formatMoney, rateLine, todayIsoDate } from "@/lib/format";
import type { AccountMember, CurrencyCode, Transaction } from "@/lib/types";
import { createRepaymentAction } from "@/app/repayments/actions";

const inputClass =
  "min-h-11 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-leafDark outline-none transition focus:border-leaf focus:ring-2 focus:ring-limeSoft";
const labelClass = "text-sm font-bold text-leafDark";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-11 items-center justify-center rounded-lg bg-leaf px-5 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-leafDark disabled:opacity-65"
      disabled={pending}
      type="submit"
    >
      {pending ? "جاري الحفظ..." : "إضافة سداد"}
    </button>
  );
}

function asCurrency(value?: string | null): CurrencyCode {
  return SUPPORTED_CURRENCIES.some((currency) => currency.code === value)
    ? (value as CurrencyCode)
    : BASE_CURRENCY;
}

export function RepaymentForm({
  members,
  currentProfileId,
  transactions,
  defaultCurrency = BASE_CURRENCY
}: {
  members: AccountMember[];
  currentProfileId?: string;
  transactions: Transaction[];
  defaultCurrency?: CurrencyCode;
}) {
  const otherMember = members.find((member) => member.user_id !== currentProfileId);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency);
  const [rate, setRate] = useState(1);
  const [manualRate, setManualRate] = useState(false);
  const [rateSource, setRateSource] = useState("base");
  const [rateDate, setRateDate] = useState(todayIsoDate());
  const [rateStatus, setRateStatus] = useState("");
  const numericAmount = Number(amount) || 0;
  const convertedAmount = useMemo(
    () => numericAmount * (Number(rate) || 0),
    [numericAmount, rate]
  );

  useEffect(() => {
    if (currency === BASE_CURRENCY) {
      setRate(1);
      setRateSource("base");
      setRateDate(todayIsoDate());
      setRateStatus("");
      return;
    }

    if (manualRate) {
      setRateSource("manual");
      setRateDate(todayIsoDate());
      setRateStatus("تم إدخال السعر يدويًا");
      return;
    }

    let active = true;

    fetch(`/api/exchange-rate?from=${currency}&to=${BASE_CURRENCY}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("rate");
        return response.json() as Promise<{
          rate: number;
          provider: string;
          fetchedAt: string;
          validForDate?: string;
        }>;
      })
      .then((data) => {
        if (!active) return;
        setRate(Number(data.rate));
        setRateSource(data.provider);
        setRateDate(data.validForDate ?? data.fetchedAt.slice(0, 10));
        setRateStatus("تم استخدام سعر صرف اليوم");
      })
      .catch(() => {
        if (!active) return;
        setManualRate(true);
        setRateSource("manual");
        setRateStatus("لم نتمكن من جلب السعر الآن");
      });

    return () => {
      active = false;
    };
  }, [currency, manualRate]);

  return (
    <form
      action={createRepaymentAction}
      className="rounded-lg border border-line bg-white p-4 shadow-sm sm:p-5"
    >
      <input type="hidden" name="exchange_rate_to_base" value={rate || 0} />
      <input
        type="hidden"
        name="converted_amount_base"
        value={convertedAmount || 0}
      />
      <input type="hidden" name="exchange_rate_source" value={rateSource} />
      <input type="hidden" name="exchange_rate_date" value={rateDate} />
      <input type="hidden" name="rate_is_manual" value={String(manualRate)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className={labelClass}>المبلغ</span>
          <input
            className={inputClass}
            inputMode="decimal"
            min="0"
            name="original_amount"
            onChange={(event) => setAmount(event.target.value)}
            required
            step="0.01"
            type="number"
            value={amount}
          />
        </label>
        <label className="grid gap-2">
          <span className={labelClass}>العملة</span>
          <select
            className={inputClass}
            name="original_currency"
            onChange={(event) => setCurrency(asCurrency(event.target.value))}
            value={currency}
          >
            {SUPPORTED_CURRENCIES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className={labelClass}>الدافع</span>
          <select
            className={inputClass}
            defaultValue={currentProfileId ?? members[0]?.user_id}
            name="paid_by_user_id"
          >
            {members.map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.profile.display_name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className={labelClass}>إلى من؟</span>
          <select
            className={inputClass}
            defaultValue={otherMember?.user_id ?? members[0]?.user_id}
            name="paid_to_user_id"
          >
            {members.map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.profile.display_name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className={labelClass}>التاريخ</span>
          <input
            className={inputClass}
            defaultValue={todayIsoDate()}
            name="payment_date"
            type="date"
          />
        </label>
        <label className="grid gap-2">
          <span className={labelClass}>مرتبط بعملية</span>
          <select className={inputClass} name="transaction_id">
            <option value="">بدون ربط</option>
            {transactions.map((transaction) => (
              <option key={transaction.id} value={transaction.id}>
                {transaction.description} ·{" "}
                {formatMoney(
                  transaction.original_amount,
                  transaction.original_currency
                )}
              </option>
            ))}
          </select>
        </label>
      </div>

      {currency !== BASE_CURRENCY ? (
        <div className="mt-4 rounded-lg border border-coinSoft bg-amber-50/70 p-4">
          <p className="text-sm font-bold text-leafDark">
            سعر اليوم: {rateLine(currency, BASE_CURRENCY, rate || 0)}
          </p>
          <p className="mt-1 text-sm text-muted">
            القيمة بالجنيه: {formatMoney(convertedAmount, BASE_CURRENCY)}
          </p>
          {rateStatus ? (
            <p className="mt-1 text-xs font-semibold text-amber-800">
              {rateStatus}
            </p>
          ) : null}
          <label className="mt-3 flex items-center gap-2 text-sm font-bold text-leafDark">
            <input
              checked={manualRate}
              className="h-4 w-4 accent-leaf"
              onChange={(event) => setManualRate(event.target.checked)}
              type="checkbox"
            />
            استخدام سعر مختلف يدويًا
          </label>
          {manualRate ? (
            <input
              className={`${inputClass} mt-3 sm:max-w-xs`}
              inputMode="decimal"
              min="0"
              onChange={(event) => setRate(Number(event.target.value))}
              step="0.0001"
              type="number"
              value={rate || ""}
            />
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 grid gap-2">
        <label className={labelClass}>ملاحظة</label>
        <textarea
          className={`${inputClass} min-h-24 resize-y leading-7`}
          name="notes"
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-lg bg-mintpaper p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-muted">
          السداد يحتاج موافقة الطرف الآخر قبل دخوله في الرصيد.
        </p>
        <SubmitButton />
      </div>
    </form>
  );
}
