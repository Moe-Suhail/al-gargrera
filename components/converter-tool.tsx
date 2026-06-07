"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRightLeft, RefreshCw } from "lucide-react";
import { BASE_CURRENCY, SUPPORTED_CURRENCIES } from "@/lib/constants";
import { formatDateTime, formatMoney, rateLine } from "@/lib/format";
import type { CurrencyCode, ExchangeRateResult } from "@/lib/types";

const inputClass =
  "min-h-11 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-leafDark outline-none transition focus:border-leaf focus:ring-2 focus:ring-limeSoft";

function asCurrency(value: string): CurrencyCode {
  return SUPPORTED_CURRENCIES.some((currency) => currency.code === value)
    ? (value as CurrencyCode)
    : BASE_CURRENCY;
}

export function ConverterTool() {
  const [amount, setAmount] = useState("10");
  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>("USD");
  const [toCurrency, setToCurrency] = useState<CurrencyCode>(BASE_CURRENCY);
  const [result, setResult] = useState<ExchangeRateResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const numericAmount = Number(amount) || 0;
  const converted = numericAmount * Number(result?.rate ?? 0);
  const createHref = useMemo(() => {
    const params = new URLSearchParams({
      amount: amount || "",
      currency: fromCurrency
    });

    if (toCurrency === BASE_CURRENCY && result) {
      params.set("rate", String(result.rate));
      params.set("source", result.provider);
      params.set("date", result.validForDate ?? result.fetchedAt.slice(0, 10));
    }

    return `/transactions/new?${params.toString()}`;
  }, [amount, fromCurrency, toCurrency, result]);

  async function convert() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        `/api/exchange-rate?from=${fromCurrency}&to=${toCurrency}`
      );

      if (!response.ok) {
        throw new Error("rate");
      }

      const data = (await response.json()) as ExchangeRateResult;
      setResult(data);
    } catch {
      setError("تعذر جلب سعر الصرف الحالي");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-sm sm:p-5">
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
        <label className="grid gap-2">
          <span className="text-sm font-bold text-leafDark">المبلغ</span>
          <input
            className={inputClass}
            inputMode="decimal"
            min="0"
            onChange={(event) => setAmount(event.target.value)}
            step="0.01"
            type="number"
            value={amount}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-bold text-leafDark">من عملة</span>
          <select
            className={inputClass}
            onChange={(event) => setFromCurrency(asCurrency(event.target.value))}
            value={fromCurrency}
          >
            {SUPPORTED_CURRENCIES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-bold text-leafDark">إلى عملة</span>
          <select
            className={inputClass}
            onChange={(event) => setToCurrency(asCurrency(event.target.value))}
            value={toCurrency}
          >
            {SUPPORTED_CURRENCIES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-leaf px-5 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-leafDark disabled:opacity-65"
          disabled={loading}
          onClick={convert}
          type="button"
        >
          <RefreshCw className="h-4 w-4" />
          {loading ? "جاري التحويل..." : "تحويل"}
        </button>
      </div>

      <div className="mt-5 rounded-lg bg-mintpaper p-4">
        {result ? (
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="text-2xl font-black text-leafDark">
                {formatMoney(numericAmount, fromCurrency)} ={" "}
                {formatMoney(converted, toCurrency)}
              </p>
              <p className="mt-2 text-sm font-semibold text-muted">
                سعر اليوم: {rateLine(fromCurrency, toCurrency, result.rate)}
              </p>
              <p className="mt-1 text-xs text-muted">
                آخر تحديث: {formatDateTime(result.fetchedAt)} · المصدر:{" "}
                {result.provider}
              </p>
            </div>
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-leaf bg-white px-4 py-3 text-sm font-bold text-leaf transition hover:bg-limeSoft"
              href={createHref}
            >
              <ArrowRightLeft className="h-4 w-4" />
              إنشاء عملية
            </Link>
          </div>
        ) : (
          <p className="text-sm leading-6 text-muted">
            {error || "اختر المبلغ والعملات ثم اضغط تحويل."}
          </p>
        )}
      </div>
    </section>
  );
}
