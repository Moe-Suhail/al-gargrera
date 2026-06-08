import { SUPPORTED_CURRENCIES } from "@/lib/constants";
import { todayIsoDate } from "@/lib/format";
import type { CurrencyCode } from "@/lib/types";
import {
  ExchangeRateError,
  type ExchangeRateProvider
} from "@/lib/exchange-rates/types";

function assertSupportedCurrency(currency: string): asserts currency is CurrencyCode {
  if (!SUPPORTED_CURRENCIES.some((item) => item.code === currency)) {
    throw new ExchangeRateError("العملة غير مدعومة");
  }
}

const frankfurterProvider: ExchangeRateProvider = {
  name: "frankfurter",
  async fetchRate({ fromCurrency, toCurrency }) {
    if (fromCurrency === toCurrency) {
      return {
        baseCurrency: fromCurrency,
        targetCurrency: toCurrency,
        rate: 1,
        provider: this.name,
        fetchedAt: new Date().toISOString(),
        isManual: false,
        validForDate: todayIsoDate()
      };
    }

    const url = new URL("https://api.frankfurter.app/latest");
    url.searchParams.set("from", fromCurrency);
    url.searchParams.set("to", toCurrency);

    const response = await fetch(url, {
      next: { revalidate: 60 * 60 }
    });

    if (!response.ok) {
      throw new ExchangeRateError();
    }

    const payload = (await response.json()) as {
      date?: string;
      rates?: Record<string, number>;
    };

    const rate = payload.rates?.[toCurrency];

    if (!rate) {
      throw new ExchangeRateError();
    }

    return {
      baseCurrency: fromCurrency,
      targetCurrency: toCurrency,
      rate,
      provider: this.name,
      fetchedAt: new Date().toISOString(),
      isManual: false,
      validForDate: payload.date ?? todayIsoDate()
    };
  }
};

const exchangeRateHostProvider: ExchangeRateProvider = {
  name: "exchangerate-host",
  async fetchRate({ fromCurrency, toCurrency, apiKey }) {
    if (fromCurrency === toCurrency) {
      return {
        baseCurrency: fromCurrency,
        targetCurrency: toCurrency,
        rate: 1,
        provider: this.name,
        fetchedAt: new Date().toISOString(),
        isManual: false,
        validForDate: todayIsoDate()
      };
    }

    const url = new URL("https://api.exchangerate.host/latest");
    url.searchParams.set("base", fromCurrency);
    url.searchParams.set("symbols", toCurrency);

    if (apiKey) {
      url.searchParams.set("access_key", apiKey);
    }

    const response = await fetch(url, {
      next: { revalidate: 60 * 60 }
    });

    if (!response.ok) {
      throw new ExchangeRateError();
    }

    const payload = (await response.json()) as {
      date?: string;
      rates?: Record<string, number>;
      success?: boolean;
    };

    const rate = payload.rates?.[toCurrency];

    if (!rate || payload.success === false) {
      throw new ExchangeRateError();
    }

    return {
      baseCurrency: fromCurrency,
      targetCurrency: toCurrency,
      rate,
      provider: this.name,
      fetchedAt: new Date().toISOString(),
      isManual: false,
      validForDate: payload.date ?? todayIsoDate()
    };
  }
};

const openExchangeRateApiProvider: ExchangeRateProvider = {
  name: "open-er-api",
  async fetchRate({ fromCurrency, toCurrency }) {
    if (fromCurrency === toCurrency) {
      return {
        baseCurrency: fromCurrency,
        targetCurrency: toCurrency,
        rate: 1,
        provider: this.name,
        fetchedAt: new Date().toISOString(),
        isManual: false,
        validForDate: todayIsoDate()
      };
    }

    const url = new URL(`https://open.er-api.com/v6/latest/${fromCurrency}`);
    const response = await fetch(url, {
      next: { revalidate: 60 * 60 }
    });

    if (!response.ok) {
      throw new ExchangeRateError();
    }

    const payload = (await response.json()) as {
      result?: string;
      rates?: Record<string, number>;
      time_last_update_utc?: string;
    };
    const rate = payload.rates?.[toCurrency];

    if (payload.result !== "success" || !rate) {
      throw new ExchangeRateError();
    }

    return {
      baseCurrency: fromCurrency,
      targetCurrency: toCurrency,
      rate,
      provider: this.name,
      fetchedAt: new Date().toISOString(),
      isManual: false,
      validForDate: payload.time_last_update_utc
        ? new Date(payload.time_last_update_utc).toISOString().slice(0, 10)
        : todayIsoDate()
    };
  }
};

export function getConfiguredExchangeProvider(): ExchangeRateProvider {
  const provider = (process.env.EXCHANGE_RATE_PROVIDER || "frankfurter")
    .trim()
    .toLowerCase();

  if (provider === "exchangerate-host" || provider === "exchangerate_host") {
    return exchangeRateHostProvider;
  }

  if (provider === "open-er-api" || provider === "open_er_api") {
    return openExchangeRateApiProvider;
  }

  return frankfurterProvider;
}

export async function fetchLatestExchangeRate(input: {
  fromCurrency: string;
  toCurrency: string;
}) {
  assertSupportedCurrency(input.fromCurrency);
  assertSupportedCurrency(input.toCurrency);

  const provider = getConfiguredExchangeProvider();

  try {
    return await provider.fetchRate({
      fromCurrency: input.fromCurrency,
      toCurrency: input.toCurrency,
      apiKey: process.env.EXCHANGE_RATE_API_KEY
    });
  } catch (error) {
    if (provider.name === openExchangeRateApiProvider.name) {
      throw error;
    }

    return openExchangeRateApiProvider.fetchRate({
      fromCurrency: input.fromCurrency,
      toCurrency: input.toCurrency
    });
  }
}
