import { BASE_CURRENCY, SUPPORTED_CURRENCIES } from "@/lib/constants";
import type { CurrencyCode } from "@/lib/types";

const arabicNumber = new Intl.NumberFormat("ar-EG", {
  maximumFractionDigits: 2
});

const arabicDate = new Intl.DateTimeFormat("ar-EG", {
  day: "numeric",
  month: "long",
  year: "numeric"
});

const arabicDateTime = new Intl.DateTimeFormat("ar-EG", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit"
});

export function formatNumber(value: number) {
  return arabicNumber.format(Number.isFinite(value) ? value : 0);
}

export function currencyShortName(currency: string) {
  return (
    SUPPORTED_CURRENCIES.find((item) => item.code === currency)?.shortName ??
    currency
  );
}

export function formatMoney(value: number, currency: string = BASE_CURRENCY) {
  return `${formatNumber(value)} ${currencyShortName(currency)}`;
}

export function formatDate(value: string | Date) {
  return arabicDate.format(new Date(value));
}

export function formatDateTime(value: string | Date) {
  return arabicDateTime.format(new Date(value));
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function profileName(name?: string | null, fallback = "الطرف الآخر") {
  return name?.trim() || fallback;
}

export function balanceText(balance: number, otherName?: string | null) {
  const name = profileName(otherName);

  if (Math.abs(balance) < 0.01) {
    return "الرصيد متوازن";
  }

  if (balance > 0) {
    return `مستحق لك من ${name}: ${formatMoney(balance, BASE_CURRENCY)}`;
  }

  return `مستحق عليك لـ${name}: ${formatMoney(Math.abs(balance), BASE_CURRENCY)}`;
}

export function rateLine(
  from: CurrencyCode,
  to: CurrencyCode,
  rate: number
) {
  return `1 ${currencyShortName(from)} = ${formatMoney(rate, to)}`;
}

export function parseNumber(value: FormDataEntryValue | null, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function isBaseCurrency(currency: string) {
  return currency === BASE_CURRENCY;
}
