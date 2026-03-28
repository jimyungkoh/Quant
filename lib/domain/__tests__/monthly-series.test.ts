import { describe, expect, it } from "vitest";

import { calculateRollingReturn, toMonthlyAdjustedCloseSeries } from "@/lib/domain/monthly-series";
import type { DailyAdjustedQuote } from "@/lib/types";

function quote(date: string, adjClose: number): DailyAdjustedQuote {
  return {
    symbol: "GLD",
    date: new Date(`${date}T00:00:00.000Z`),
    adjClose,
    close: adjClose,
  };
}

describe("toMonthlyAdjustedCloseSeries", () => {
  it("keeps the last trading day for each month", () => {
    const result = toMonthlyAdjustedCloseSeries(
      [
        quote("2024-01-02", 100),
        quote("2024-01-31", 110),
        quote("2024-02-01", 111),
        quote("2024-02-28", 120),
      ],
      {
        referenceDate: new Date("2024-03-03T00:00:00.000Z"),
      },
    );

    expect(result).toEqual([
      { month: "2024-01", monthEndDate: "2024-01-31", adjClose: 110 },
      { month: "2024-02", monthEndDate: "2024-02-28", adjClose: 120 },
    ]);
  });

  it("drops the current in-progress month by default", () => {
    const result = toMonthlyAdjustedCloseSeries(
      [
        quote("2024-02-29", 100),
        quote("2024-03-04", 105),
        quote("2024-03-27", 106),
      ],
      {
        referenceDate: new Date("2024-03-28T00:00:00.000Z"),
      },
    );

    expect(result).toEqual([
      { month: "2024-02", monthEndDate: "2024-02-29", adjClose: 100 },
    ]);
  });
});

describe("calculateRollingReturn", () => {
  it("calculates month-over-lookback cumulative returns", () => {
    const result = calculateRollingReturn(
      [
        { month: "2023-01", monthEndDate: "2023-01-31", adjClose: 100 },
        { month: "2023-02", monthEndDate: "2023-02-28", adjClose: 110 },
        { month: "2023-03", monthEndDate: "2023-03-31", adjClose: 121 },
      ],
      2,
    );

    expect(result[0]).toBeNull();
    expect(result[1]).toBeNull();
    expect(result[2]).toBeCloseTo(0.21, 8);
  });
});
