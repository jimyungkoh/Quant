import { round } from "@/lib/utils";
import type { DailyAdjustedQuote, MonthlyAdjustedPoint } from "@/lib/types";

function toMonthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function isSameUtcMonth(date: Date, referenceDate: Date): boolean {
  return (
    date.getUTCFullYear() === referenceDate.getUTCFullYear() &&
    date.getUTCMonth() === referenceDate.getUTCMonth()
  );
}

function hasRemainingWeekdaysInMonth(date: Date): boolean {
  const cursor = new Date(date);
  cursor.setUTCDate(cursor.getUTCDate() + 1);

  while (cursor.getUTCMonth() === date.getUTCMonth()) {
    const day = cursor.getUTCDay();

    if (day >= 1 && day <= 5) {
      return true;
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return false;
}

function monthDifference(startMonth: string, endMonth: string): number {
  const [startYear, startMonthNumber] = startMonth.split("-").map(Number);
  const [endYear, endMonthNumber] = endMonth.split("-").map(Number);

  return (endYear - startYear) * 12 + (endMonthNumber - startMonthNumber);
}

export function toMonthlyAdjustedCloseSeries(
  quotes: DailyAdjustedQuote[],
  options?: {
    referenceDate?: Date;
    dropIncompleteCurrentMonth?: boolean;
  },
): MonthlyAdjustedPoint[] {
  const referenceDate = options?.referenceDate ?? new Date();
  const dropIncompleteCurrentMonth = options?.dropIncompleteCurrentMonth ?? true;

  const sortedQuotes = [...quotes].sort(
    (left, right) => left.date.getTime() - right.date.getTime(),
  );

  const latestByMonth = new Map<string, DailyAdjustedQuote>();

  for (const quote of sortedQuotes) {
    latestByMonth.set(toMonthKey(quote.date), quote);
  }

  const monthlySeries = [...latestByMonth.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([, quote]) => ({
      month: toMonthKey(quote.date),
      monthEndDate: quote.date.toISOString().slice(0, 10),
      adjClose: quote.adjClose,
    }));

  if (!dropIncompleteCurrentMonth || monthlySeries.length === 0) {
    return monthlySeries;
  }

  const lastPoint = monthlySeries.at(-1);

  if (!lastPoint) {
    return monthlySeries;
  }

  const lastPointDate = new Date(`${lastPoint.monthEndDate}T00:00:00.000Z`);

  if (
    isSameUtcMonth(lastPointDate, referenceDate) &&
    hasRemainingWeekdaysInMonth(lastPointDate)
  ) {
    return monthlySeries.slice(0, -1);
  }

  return monthlySeries;
}

export function calculateRollingReturn(
  series: MonthlyAdjustedPoint[],
  lookbackMonths: number,
): Array<number | null> {
  return series.map((point, index) => {
    if (index < lookbackMonths) {
      return null;
    }

    const basePoint = series[index - lookbackMonths];

    if (monthDifference(basePoint.month, point.month) !== lookbackMonths) {
      return null;
    }

    return round(point.adjClose / basePoint.adjClose - 1);
  });
}
