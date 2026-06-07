import type { CurrencyCode, ExchangeRateResult } from "@/lib/types";

export type ExchangeRateProvider = {
  name: string;
  fetchRate(input: {
    fromCurrency: CurrencyCode;
    toCurrency: CurrencyCode;
    apiKey?: string;
  }): Promise<ExchangeRateResult>;
};

export type ExchangeRateRequest = {
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
};

export class ExchangeRateError extends Error {
  constructor(message = "لم نتمكن من جلب سعر الصرف الآن") {
    super(message);
    this.name = "ExchangeRateError";
  }
}
