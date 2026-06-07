"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  BASE_CURRENCY,
  SUPPORTED_CURRENCIES,
  TRANSACTION_TYPES
} from "@/lib/constants";
import { formatMoney, rateLine, todayIsoDate } from "@/lib/format";
import type {
  AccountMember,
  CurrencyCode,
  Transaction
} from "@/lib/types";
import {
  createTransactionAction,
  updateTransactionAction
} from "@/app/transactions/actions";

const inputClass =
  "min-h-11 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-leafDark outline-none transition focus:border-leaf focus:ring-2 focus:ring-limeSoft";
const labelClass = "text-sm font-bold text-leafDark";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-11 items-center justify-center rounded-lg bg-leaf px-5 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-leafDark disabled:cursor-not-allowed disabled:opacity-65"
      disabled={pending}
      type="submit"
    >
      {pending ? "جاري الحفظ..." : label}
    </button>
  );
}

function asCurrency(value?: string | null): CurrencyCode {
  return SUPPORTED_CURRENCIES.some((currency) => currency.code === value)
    ? (value as CurrencyCode)
    : BASE_CURRENCY;
}

export function TransactionForm({
  members,
  currentProfileId,
  mode = "create",
  transaction,
  initialAmount,
  initialCurrency,
  initialRate,
  initialRateSource,
  initialRateDate,
  defaultCurrency = BASE_CURRENCY
}: {
  members: AccountMember[];
  currentProfileId?: string;
  mode?: "create" | "edit";
  transaction?: Transaction;
  initialAmount?: string;
  initialCurrency?: string;
  initialRate?: string;
  initialRateSource?: string;
  initialRateDate?: string;
  defaultCurrency?: CurrencyCode;
}) {
  const otherMember = members.find((member) => member.user_id !== currentProfileId);
  const [amount, setAmount] = useState(
    String(transaction?.original_amount ?? initialAmount ?? "")
  );
  const [currency, setCurrency] = useState<CurrencyCode>(
    asCurrency(transaction?.original_currency ?? initialCurrency ?? defaultCurrency)
  );
  const [rate, setRate] = useState(
    Number(transaction?.exchange_rate_to_base ?? initialRate ?? 1)
  );
  const [rateSource, setRateSource] = useState(
    transaction?.exchange_rate_source ?? initialRateSource ?? "base"
  );
  const [rateDate, setRateDate] = useState(
    transaction?.exchange_rate_date ?? initialRateDate ?? todayIsoDate()
  );
  const [manualRate, setManualRate] = useState(
    Boolean(transaction?.rate_is_manual)
  );
  const [rateStatus, setRateStatus] = useState("");
  const [loadingRate, setLoadingRate] = useState(false);

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
      setRateStatus("تم إدخال سعر الصرف يدويًا");
      return;
    }

    let active = true;
    setLoadingRate(true);
    setRateStatus("");

    fetch(`/api/exchange-rate?from=${currency}&to=${BASE_CURRENCY}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("rate");
        }

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
      })
      .finally(() => {
        if (active) {
          setLoadingRate(false);
        }
      });

    return () => {
      active = false;
    };
  }, [currency, manualRate]);

  const action = mode === "edit" ? updateTransactionAction : createTransactionAction;

  return (
    <form
      action={action}
      className="rounded-lg border border-line bg-white p-4 shadow-sm sm:p-5"
    >
      {transaction ? <input type="hidden" name="id" value={transaction.id} /> : null}
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
          <span className={labelClass}>نوع العملية</span>
          <select
            className={inputClass}
            defaultValue={transaction?.type ?? "paid_for_other"}
            name="type"
          >
            {Object.entries(TRANSACTION_TYPES).map(([value, item]) => (
              <option key={value} value={value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className={labelClass}>التاريخ</span>
          <input
            className={inputClass}
            defaultValue={transaction?.transaction_date ?? todayIsoDate()}
            name="transaction_date"
            type="date"
          />
        </label>

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
            defaultValue={
              transaction?.paid_by_user_id ?? currentProfileId ?? members[0]?.user_id
            }
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
          <span className={labelClass}>الطرف المرتبط</span>
          <select
            className={inputClass}
            defaultValue={
              transaction?.related_user_id ??
              otherMember?.user_id ??
              members[0]?.user_id
            }
            name="related_user_id"
          >
            {members.map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.profile.display_name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {currency !== BASE_CURRENCY ? (
        <div className="mt-4 rounded-lg border border-coinSoft bg-amber-50/70 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-leafDark">
                سعر اليوم: {rateLine(currency, BASE_CURRENCY, Number(rate) || 0)}
              </p>
              <p className="mt-1 text-sm text-muted">
                القيمة بالجنيه: {formatMoney(convertedAmount, BASE_CURRENCY)}
              </p>
              {rateStatus ? (
                <p className="mt-1 text-xs font-semibold text-amber-800">
                  {loadingRate ? "جاري جلب سعر الصرف..." : rateStatus}
                </p>
              ) : null}
            </div>
            <label className="flex items-center gap-2 text-sm font-bold text-leafDark">
              <input
                checked={manualRate}
                className="h-4 w-4 accent-leaf"
                onChange={(event) => setManualRate(event.target.checked)}
                type="checkbox"
              />
              استخدام سعر مختلف يدويًا
            </label>
          </div>
          {manualRate ? (
            <label className="mt-3 grid gap-2 sm:max-w-xs">
              <span className={labelClass}>سعر الصرف المستخدم</span>
              <input
                className={inputClass}
                inputMode="decimal"
                min="0"
                onChange={(event) => setRate(Number(event.target.value))}
                step="0.0001"
                type="number"
                value={rate || ""}
              />
            </label>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 grid gap-4">
        <label className="grid gap-2">
          <span className={labelClass}>الوصف</span>
          <input
            className={inputClass}
            defaultValue={transaction?.description ?? ""}
            name="description"
            required
          />
        </label>
        <label className="grid gap-2">
          <span className={labelClass}>ملاحظات</span>
          <textarea
            className={`${inputClass} min-h-28 resize-y leading-7`}
            defaultValue={transaction?.notes ?? ""}
            name="notes"
          />
        </label>
        {mode === "create" ? (
          <label className="grid gap-2">
            <span className={labelClass}>صورة إيصال</span>
            <input
              accept="image/*"
              className={inputClass}
              name="receipt"
              type="file"
            />
          </label>
        ) : null}
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-lg bg-mintpaper p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-muted">
          لن تدخل هذه العملية في الرصيد حتى تتم الموافقة عليها.
        </p>
        <SubmitButton
          label={mode === "edit" ? "حفظ التحديث" : "تسجيل العملية"}
        />
      </div>
    </form>
  );
}
