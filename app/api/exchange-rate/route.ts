import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/current-context";
import { EMPTY_STATES, SUPPORTED_CURRENCIES } from "@/lib/constants";
import type { CurrencyCode } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getExchangeRateWithCache } from "@/lib/exchange-rates/cache";

function isCurrency(value: string | null): value is CurrencyCode {
  return Boolean(
    value && SUPPORTED_CURRENCIES.some((currency) => currency.code === value)
  );
}

export async function GET(request: Request) {
  const context = await getCurrentContext();

  if (!context.isConfigured) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 }
    );
  }

  if (!context.user || !context.accountSpace) {
    return NextResponse.json({ error: EMPTY_STATES.unauthorized }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const fromCurrency = searchParams.get("from");
  const toCurrency = searchParams.get("to");

  if (!isCurrency(fromCurrency) || !isCurrency(toCurrency)) {
    return NextResponse.json({ error: "العملة غير مدعومة" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 }
    );
  }

  try {
    const rate = await getExchangeRateWithCache({
      supabase,
      fromCurrency,
      toCurrency
    });

    return NextResponse.json(rate);
  } catch {
    return NextResponse.json(
      { error: EMPTY_STATES.exchangeRateError },
      { status: 502 }
    );
  }
}
