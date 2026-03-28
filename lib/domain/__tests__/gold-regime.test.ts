import { describe, expect, it } from "vitest";

import {
  buildCompositeMomentumSeries,
  getLatestSignalSnapshot,
  normalizeCompositeSeries,
} from "@/lib/domain/gold-regime";
import type { MonthlyAdjustedPoint } from "@/lib/types";

function monthlySeries(values: number[], startYear = 2023): MonthlyAdjustedPoint[] {
  return values.map((value, index) => {
    const month = String((index % 12) + 1).padStart(2, "0");
    const year = startYear + Math.floor(index / 12);
    const day = ["04", "06", "09", "11"].includes(month) ? "30" : month === "02" ? "28" : "31";

    return {
      month: `${year}-${month}`,
      monthEndDate: `${year}-${month}-${day}`,
      adjClose: value,
    };
  });
}

describe("buildCompositeMomentumSeries", () => {
  it("flags buy signal only when both 12m returns are positive", () => {
    const gld = monthlySeries([100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 120]);
    const ief = monthlySeries([100, 99, 98, 97, 96, 95, 94, 93, 92, 91, 90, 89, 88]);
    const cash = monthlySeries([100, 100.2, 100.4, 100.6, 100.8, 101, 101.2, 101.4, 101.6, 101.8, 102, 102.2, 102.4]);

    const result = buildCompositeMomentumSeries(gld, ief, cash);
    const latest = result.at(-1);

    expect(latest?.gld12mReturn).toBeCloseTo(0.2, 8);
    expect(latest?.ief12mReturn).toBeCloseTo(-0.12, 8);
    expect(latest?.buySignal).toBe(false);
  });

  it("builds a bullish snapshot when both assets are up over 12 months", () => {
    const gld = monthlySeries([100, 101, 103, 104, 105, 107, 109, 112, 114, 117, 119, 122, 126]);
    const ief = monthlySeries([100, 100, 101, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110]);
    const cash = monthlySeries([100, 100.1, 100.2, 100.3, 100.4, 100.5, 100.6, 100.7, 100.8, 100.9, 101, 101.1, 101.2]);
    const result = buildCompositeMomentumSeries(gld, ief, cash);
    const snapshot = getLatestSignalSnapshot(result);

    expect(snapshot).toMatchObject({
      asOfMonth: "2024-01",
      buySignal: true,
      gldCalculation: {
        currentMonth: "2024-01",
        lookbackMonth: "2023-01",
        currentAdjClose: 126,
        lookbackAdjClose: 100,
      },
      iefCalculation: {
        currentMonth: "2024-01",
        lookbackMonth: "2023-01",
        currentAdjClose: 110,
        lookbackAdjClose: 100,
      },
    });
    expect(snapshot?.gld12mReturn).toBeGreaterThan(0);
    expect(snapshot?.ief12mReturn).toBeGreaterThan(0);
    expect(snapshot?.gldCalculation.returnValue).toBeCloseTo(0.26, 8);
    expect(snapshot?.iefCalculation.returnValue).toBeCloseTo(0.1, 8);
  });
});

describe("normalizeCompositeSeries", () => {
  it("builds strategy and benchmark indices with lagged monthly execution", () => {
    const normalized = normalizeCompositeSeries([
      {
        month: "2024-01",
        monthEndDate: "2024-01-31",
        gldAdjClose: 200,
        iefAdjClose: 50,
        cashAdjClose: 100,
        gld12mReturn: null,
        ief12mReturn: null,
        buySignal: false,
      },
      {
        month: "2024-02",
        monthEndDate: "2024-02-29",
        gldAdjClose: 220,
        iefAdjClose: 55,
        cashAdjClose: 101,
        gld12mReturn: null,
        ief12mReturn: null,
        buySignal: true,
      },
      {
        month: "2024-03",
        monthEndDate: "2024-03-31",
        gldAdjClose: 242,
        iefAdjClose: 56,
        cashAdjClose: 102.01,
        gld12mReturn: null,
        ief12mReturn: null,
        buySignal: false,
      },
    ]);

    expect(normalized[0]).toMatchObject({
      strategyNormalized: 100,
      benchmarkNormalized: 100,
      strategyExposure: 0,
      strategyMonthlyReturn: null,
      benchmarkMonthlyReturn: null,
      cashMonthlyReturn: null,
    });
    expect(normalized[1]).toMatchObject({
      strategyNormalized: 101,
      benchmarkNormalized: 110,
      strategyExposure: 0,
      strategyMonthlyReturn: 0.01,
      cashMonthlyReturn: 0.01,
    });
    expect(normalized[1]?.benchmarkMonthlyReturn).toBeCloseTo(0.1, 8);
    expect(normalized[2]).toMatchObject({
      strategyNormalized: 111.1,
      benchmarkNormalized: 121,
      strategyExposure: 1,
    });
    expect(normalized[2]?.strategyMonthlyReturn).toBeCloseTo(0.1, 8);
  });
});
