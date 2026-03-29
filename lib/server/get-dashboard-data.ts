import {
  buildCompositeMomentumSeries,
  getLatestSignalSnapshot,
  normalizeCompositeSeries,
} from "@/lib/domain/gold-regime";
import { toMonthlyAdjustedCloseSeries } from "@/lib/domain/monthly-series";
import { fetchDailyAdjustedCloses } from "@/lib/server/yahoo-finance";
import type { DashboardData } from "@/lib/types";

export async function getDashboardData(
  referenceDate = new Date(),
): Promise<DashboardData> {
  const [gldQuotes, iefQuotes, bilQuotes] = await Promise.all([
    fetchDailyAdjustedCloses("GLD"),
    fetchDailyAdjustedCloses("IEF"),
    fetchDailyAdjustedCloses("BIL"),
  ]);

  const gldMonthly = toMonthlyAdjustedCloseSeries(gldQuotes, { referenceDate });
  const iefMonthly = toMonthlyAdjustedCloseSeries(iefQuotes, { referenceDate });
  const cashMonthly = toMonthlyAdjustedCloseSeries(bilQuotes, { referenceDate });
  const compositeSeries = buildCompositeMomentumSeries(
    gldMonthly,
    iefMonthly,
    cashMonthly,
  );
  const snapshot = getLatestSignalSnapshot(compositeSeries);

  if (!snapshot) {
    throw new Error(
      "12개월 합성 모멘텀 신호를 계산할 만큼의 월별 히스토리가 충분하지 않습니다.",
    );
  }

  const latestCommonQuoteDate = [gldQuotes, iefQuotes, bilQuotes]
    .map((quotes) => quotes.at(-1))
    .reduce((latest, quote) => {
      if (!quote) {
        return latest;
      }

      if (!latest) {
        return quote.date;
      }

      return quote.date.getTime() < latest.getTime() ? quote.date : latest;
    }, null as Date | null);

  if (!latestCommonQuoteDate) {
    throw new Error("최신 시세 기준일을 계산할 수 없습니다.");
  }

  return {
    snapshot,
    series: normalizeCompositeSeries(compositeSeries),
    generatedAt: referenceDate.toISOString(),
    source:
      "Yahoo Finance via yahoo-finance2 · GLD/IEF/BIL daily adjusted close aggregated to month-end.",
    latestCommonQuoteDate: latestCommonQuoteDate.toISOString().slice(0, 10),
  };
}
