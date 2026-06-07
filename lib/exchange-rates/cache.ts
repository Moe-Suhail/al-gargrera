import type { SupabaseClient } from "@supabase/supabase-js";
import { todayIsoDate } from "@/lib/format";
import type { CurrencyCode, ExchangeRateResult } from "@/lib/types";
import {
  fetchLatestExchangeRate,
  getConfiguredExchangeProvider
} from "@/lib/exchange-rates/provider";

type AnySupabase = SupabaseClient<any, "public", any>;

export async function getCachedExchangeRate({
  supabase,
  fromCurrency,
  toCurrency,
  provider
}: {
  supabase: AnySupabase;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  provider: string;
}) {
  const { data } = await supabase
    .from("exchange_rate_cache")
    .select("*")
    .eq("base_currency", fromCurrency)
    .eq("target_currency", toCurrency)
    .eq("provider", provider)
    .eq("valid_for_date", todayIsoDate())
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return {
    baseCurrency: data.base_currency,
    targetCurrency: data.target_currency,
    rate: Number(data.rate),
    provider: data.provider,
    fetchedAt: data.fetched_at,
    isManual: false,
    validForDate: data.valid_for_date
  } as ExchangeRateResult;
}

export async function storeExchangeRate(
  supabase: AnySupabase,
  rate: ExchangeRateResult
) {
  const { error } = await supabase.from("exchange_rate_cache").upsert(
    {
      base_currency: rate.baseCurrency,
      target_currency: rate.targetCurrency,
      rate: rate.rate,
      provider: rate.provider,
      fetched_at: rate.fetchedAt,
      valid_for_date: rate.validForDate ?? todayIsoDate()
    },
    {
      onConflict: "base_currency,target_currency,provider,valid_for_date"
    }
  );

  if (error) {
    console.error("Unable to cache exchange rate", error.message);
  }
}

export async function getExchangeRateWithCache({
  supabase,
  fromCurrency,
  toCurrency
}: {
  supabase: AnySupabase;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
}) {
  const provider = getConfiguredExchangeProvider();

  const cached = await getCachedExchangeRate({
    supabase,
    fromCurrency,
    toCurrency,
    provider: provider.name
  });

  if (cached) {
    return cached;
  }

  const fetched = await fetchLatestExchangeRate({
    fromCurrency,
    toCurrency
  });

  await storeExchangeRate(supabase, fetched);
  return fetched;
}
