import YahooFinance from "yahoo-finance2";

import type { AssetSymbol, DailyAdjustedQuote } from "@/lib/types";

const yahooFinance = new YahooFinance();
const DEFAULT_PERIOD_START = "2000-01-01";

export async function fetchDailyAdjustedCloses(
  symbol: AssetSymbol,
): Promise<DailyAdjustedQuote[]> {
  try {
    const result = await yahooFinance.chart(symbol, {
      period1: DEFAULT_PERIOD_START,
      interval: "1d",
    }, {
      fetchOptions: { signal: AbortSignal.timeout(10_000) },
    });

    if (!result.quotes.length) {
      throw new Error(`Yahoo Finance returned no quotes for ${symbol}.`);
    }

    return result.quotes
      .map((quote) => {
        const adjClose = quote.adjclose ?? quote.close;

        if (adjClose == null) {
          return null;
        }

        return {
          symbol,
          date: quote.date,
          adjClose,
          close: quote.close ?? null,
        } satisfies DailyAdjustedQuote;
      })
      .filter((quote): quote is DailyAdjustedQuote => quote !== null)
      .sort((left, right) => left.date.getTime() - right.date.getTime());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Yahoo Finance error";

    throw new Error(`Failed to fetch ${symbol} quotes: ${message}`);
  }
}
