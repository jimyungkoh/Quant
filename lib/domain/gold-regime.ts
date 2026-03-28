import { calculateRollingReturn } from "@/lib/domain/monthly-series";
import { round } from "@/lib/utils";
import type {
  ChartPoint,
  MonthlyAdjustedPoint,
  MonthlyPoint,
  ReturnCalculation,
  SignalSnapshot,
} from "@/lib/types";

export function buildCompositeMomentumSeries(
  gldSeries: MonthlyAdjustedPoint[],
  iefSeries: MonthlyAdjustedPoint[],
  cashSeries: MonthlyAdjustedPoint[],
  lookbackMonths = 12,
): MonthlyPoint[] {
  const iefByMonth = new Map(iefSeries.map((point) => [point.month, point]));
  const cashByMonth = new Map(cashSeries.map((point) => [point.month, point]));

  const alignedGld = gldSeries.filter(
    (point) => iefByMonth.has(point.month) && cashByMonth.has(point.month),
  );
  const alignedIef = alignedGld.map((point) => {
    const iefPoint = iefByMonth.get(point.month);

    if (!iefPoint) {
      throw new Error(`Missing IEF monthly point for ${point.month}.`);
    }

    return iefPoint;
  });
  const alignedCash = alignedGld.map((point) => {
    const cashPoint = cashByMonth.get(point.month);

    if (!cashPoint) {
      throw new Error(`Missing cash monthly point for ${point.month}.`);
    }

    return cashPoint;
  });

  const gldReturns = calculateRollingReturn(alignedGld, lookbackMonths);
  const iefReturns = calculateRollingReturn(alignedIef, lookbackMonths);

  return alignedGld.map((gldPoint, index) => {
    const iefPoint = alignedIef[index];
    const cashPoint = alignedCash[index];
    const gld12mReturn = gldReturns[index];
    const ief12mReturn = iefReturns[index];

    return {
      month: gldPoint.month,
      monthEndDate: gldPoint.monthEndDate,
      gldAdjClose: gldPoint.adjClose,
      iefAdjClose: iefPoint.adjClose,
      cashAdjClose: cashPoint.adjClose,
      gld12mReturn,
      ief12mReturn,
      buySignal:
        gld12mReturn == null || ief12mReturn == null
          ? null
          : gld12mReturn > 0 && ief12mReturn > 0,
    };
  });
}

export function getLatestSignalSnapshot(
  series: MonthlyPoint[],
  lookbackMonths = 12,
): SignalSnapshot | null {
  for (let index = series.length - 1; index >= 0; index -= 1) {
    const point = series[index];

    if (
      index >= lookbackMonths &&
      point.gld12mReturn != null &&
      point.ief12mReturn != null &&
      point.buySignal != null
    ) {
      const lookbackPoint = series[index - lookbackMonths];

      return {
        asOfMonth: point.month,
        buySignal: point.buySignal,
        gld12mReturn: point.gld12mReturn,
        ief12mReturn: point.ief12mReturn,
        gldCalculation: buildReturnCalculation({
          currentMonth: point.month,
          lookbackMonth: lookbackPoint.month,
          currentAdjClose: point.gldAdjClose,
          lookbackAdjClose: lookbackPoint.gldAdjClose,
          returnValue: point.gld12mReturn,
        }),
        iefCalculation: buildReturnCalculation({
          currentMonth: point.month,
          lookbackMonth: lookbackPoint.month,
          currentAdjClose: point.iefAdjClose,
          lookbackAdjClose: lookbackPoint.iefAdjClose,
          returnValue: point.ief12mReturn,
        }),
        rationale: point.buySignal
          ? "GLD와 IEF가 모두 12개월 상승 추세라 완화적 매크로 환경의 금 매수 조건이 충족되었습니다."
          : "GLD 또는 IEF 중 하나 이상이 12개월 상승 추세를 유지하지 못해 금 매수 조건이 아직 충족되지 않았습니다.",
      };
    }
  }

  return null;
}

function buildReturnCalculation(
  calculation: ReturnCalculation,
): ReturnCalculation {
  return {
    ...calculation,
    returnValue: round(calculation.returnValue),
  };
}

export function normalizeCompositeSeries(series: MonthlyPoint[]): ChartPoint[] {
  if (series.length === 0) {
    return [];
  }

  const initial: ChartPoint = {
    ...series[0],
    strategyNormalized: 100,
    benchmarkNormalized: 100,
    strategyMonthlyReturn: null,
    benchmarkMonthlyReturn: null,
    cashMonthlyReturn: null,
    strategyExposure: 0,
  };

  return series.slice(1).reduce<ChartPoint[]>((acc, point) => {
    const prev = acc[acc.length - 1];
    const benchmarkMonthlyReturn = round(point.gldAdjClose / prev.gldAdjClose - 1);
    const cashMonthlyReturn = round(point.cashAdjClose / prev.cashAdjClose - 1);
    const strategyExposure = prev.buySignal ? 1 : 0;
    const strategyMonthlyReturn = strategyExposure ? benchmarkMonthlyReturn : cashMonthlyReturn;

    acc.push({
      ...point,
      strategyNormalized: round(prev.strategyNormalized * (1 + strategyMonthlyReturn)),
      benchmarkNormalized: round(prev.benchmarkNormalized * (1 + benchmarkMonthlyReturn)),
      strategyMonthlyReturn,
      benchmarkMonthlyReturn,
      cashMonthlyReturn,
      strategyExposure,
    });

    return acc;
  }, [initial]);
}
