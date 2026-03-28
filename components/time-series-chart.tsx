import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatMonthLabel,
  formatNullablePercent,
  formatPercent,
  formatShortMonthLabel,
} from "@/lib/formatters";
import type { ChartPoint } from "@/lib/types";
import { round } from "@/lib/utils";

type TimeRange = "YTD" | "6M" | "1Y" | "3Y" | "5Y" | "MAX";

const RANGE_OPTIONS: TimeRange[] = ["YTD", "6M", "1Y", "3Y", "5Y", "MAX"];

export function coerceTimeRange(value?: string): TimeRange {
  return RANGE_OPTIONS.includes(value as TimeRange) ? (value as TimeRange) : "5Y";
}

function filterPoints(points: ChartPoint[], range: TimeRange): ChartPoint[] {
  if (range === "MAX" || points.length === 0) {
    return points;
  }

  const latest = points.at(-1);

  if (!latest) {
    return points;
  }

  if (range === "YTD") {
    const [year] = latest.month.split("-");
    return points.filter((point) => point.month.startsWith(`${year}-`));
  }

  const monthLookup: Record<Exclude<TimeRange, "YTD" | "MAX">, number> = {
    "6M": 6,
    "1Y": 12,
    "3Y": 36,
    "5Y": 60,
  };

  return points.slice(-monthLookup[range]);
}

function averageExposureRate(points: ChartPoint[]): number {
  if (points.length === 0) {
    return 0;
  }

  const active = points.filter((point) => point.strategyExposure).length;
  return active / points.length;
}

export function TimeSeriesChart({
  points,
  selectedRange,
}: {
  points: ChartPoint[];
  selectedRange: TimeRange;
}) {
  const filteredPoints = filterPoints(points, selectedRange);
  const firstFilteredPoint = filteredPoints[0];
  const displayPoints = !firstFilteredPoint
    ? []
    : filteredPoints.map((point) => ({
        ...point,
        strategyDisplayNormalized: round(
          (point.strategyNormalized / firstFilteredPoint.strategyNormalized) * 100,
        ),
        benchmarkDisplayNormalized: round(
          (point.benchmarkNormalized / firstFilteredPoint.benchmarkNormalized) * 100,
        ),
      }));
  const selectedSignalRate = averageExposureRate(displayPoints);
  const firstPoint = displayPoints[0];
  const lastPoint = displayPoints.at(-1);
  const strategyReturn = lastPoint
    ? lastPoint.strategyDisplayNormalized / 100 - 1
    : 0;
  const benchmarkReturn = lastPoint
    ? lastPoint.benchmarkDisplayNormalized / 100 - 1
    : 0;

  if (!displayPoints.length) {
    return null;
  }

  const chartHeight = 360;
  const chartWidth = Math.max(720, displayPoints.length * 18);
  const padding = { top: 20, right: 24, bottom: 40, left: 48 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const allValues = displayPoints.flatMap((point) => [
    point.strategyDisplayNormalized,
    point.benchmarkDisplayNormalized,
  ]);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const paddedMin = Math.max(0, minValue * 0.96);
  const paddedMax = maxValue * 1.04;
  const valueRange = Math.max(paddedMax - paddedMin, 1);
  const stepX = displayPoints.length > 1 ? plotWidth / (displayPoints.length - 1) : plotWidth;
  const labelEvery = Math.max(1, Math.floor(displayPoints.length / 6));

  const getX = (index: number) => padding.left + index * stepX;
  const getY = (value: number) =>
    padding.top + plotHeight - ((value - paddedMin) / valueRange) * plotHeight;

  const strategyPath = displayPoints
    .map((point, index) => `${getX(index)},${getY(point.strategyDisplayNormalized)}`)
    .join(" ");
  const benchmarkPath = displayPoints
    .map((point, index) => `${getX(index)},${getY(point.benchmarkDisplayNormalized)}`)
    .join(" ");

  const yTicks = Array.from({ length: 5 }, (_, index) => {
    const value = paddedMin + (valueRange / 4) * index;
    return { value, y: getY(value) };
  });

  return (
    <Card>
      <CardHeader className="gap-5 p-7 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">기간 선택 차트</p>
            <CardTitle>전략 vs GLD 단순 보유 비교</CardTitle>
            <CardDescription className="max-w-[42rem] text-[15px] leading-7">
              월말 신호를 다음 달에 반영한 전략 지수와 GLD 단순 보유 지수를 같은 기준선에서 비교합니다.
              신호가 꺼진 달은 현금 대신 BIL 월수익으로 이어 붙입니다.
            </CardDescription>
          </div>
          <div
            className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--border)] bg-[var(--soft-surface)] p-1"
            role="tablist"
            aria-label="차트 기간 선택"
          >
            {RANGE_OPTIONS.map((option) => (
              <Link
                key={option}
                href={option === "5Y" ? "/" : `/?range=${option}`}
                role="tab"
                aria-selected={selectedRange === option}
                aria-label={`${option} view`}
                className={`inline-flex h-9 min-w-10 items-center justify-center rounded-md border px-3 text-xs font-medium tracking-[0.01em] transition-colors ${
                  selectedRange === option
                    ? "border-[color:var(--border)] bg-white text-[var(--foreground)] shadow-none"
                    : "border-transparent bg-transparent text-[var(--muted)] hover:bg-white/80"
                }`}
                prefetch={false}
              >
                {option}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Summary
            label="표시 구간"
            value={
              firstPoint && lastPoint
                ? `${formatMonthLabel(firstPoint.month)} → ${formatMonthLabel(lastPoint.month)}`
                : "N/A"
            }
          />
          <Summary label="전략 누적 수익" value={formatPercent(strategyReturn)} />
          <Summary label="GLD 누적 수익" value={formatPercent(benchmarkReturn)} />
          <Summary label="전략 노출 비중" value={new Intl.NumberFormat("ko-KR", { style: "percent", maximumFractionDigits: 1 }).format(selectedSignalRate)} />
        </div>
      </CardHeader>
      <CardContent className="space-y-5 px-7 pb-7 lg:px-8 lg:pb-8">
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
          <Badge variant="outline">기본 보기 = 5Y</Badge>
          <Badge variant="outline">정규화 기준 = 첫 표시 월 100</Badge>
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[var(--gold-line)]" /> 퀀트 전략 지수(GLD/BIL)</div>
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[var(--blue-line)]" /> GLD 단순 보유</div>
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[var(--soft-green)]" /> 전략 보유 구간</div>
        </div>
        <hr className="shrink-0 border-none bg-[color:var(--border)] h-px w-full" />
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="min-w-[720px] lg:min-w-full"
            role="img"
            aria-label="Quant strategy versus GLD buy-and-hold chart with exposure overlay"
          >
            <rect x="0" y="0" width={chartWidth} height={chartHeight} rx="14" fill="white" stroke="var(--border)" />
            {displayPoints.map((point, index) => {
              if (!point.strategyExposure) {
                return null;
              }

              const x = getX(index) - stepX / 2;
              const width = index === 0 ? stepX / 2 : stepX;

              return (
                <rect
                  key={`${point.month}-signal`}
                  x={Math.max(padding.left, x)}
                  y={padding.top}
                  width={width}
                  height={plotHeight}
                  fill="rgba(237, 243, 236, 0.95)"
                >
                  <title>{`${point.month}: strategy allocated to GLD`}</title>
                </rect>
              );
            })}

            {yTicks.map((tick) => (
              <g key={tick.y}>
                <line
                  x1={padding.left}
                  y1={tick.y}
                  x2={chartWidth - padding.right}
                  y2={tick.y}
                  stroke="rgba(0,0,0,0.06)"
                />
                <text x={padding.left - 10} y={tick.y + 4} fill="var(--muted)" fontSize="11" textAnchor="end">
                  {tick.value.toFixed(0)}
                </text>
              </g>
            ))}

            <polyline points={strategyPath} fill="none" stroke="var(--gold-line)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            <polyline points={benchmarkPath} fill="none" stroke="var(--blue-line)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

            {displayPoints.map((point, index) => {
              const x = getX(index);
              const showLabel = index === 0 || index === displayPoints.length - 1 || index % labelEvery === 0;
              const tooltip = `${point.month}\n전략 지수: ${point.strategyDisplayNormalized.toFixed(2)}\nGLD 지수: ${point.benchmarkDisplayNormalized.toFixed(2)}\n전략 월수익: ${formatNullablePercent(point.strategyMonthlyReturn)}\nGLD 월수익: ${formatNullablePercent(point.benchmarkMonthlyReturn)}\nBIL 월수익: ${formatNullablePercent(point.cashMonthlyReturn)}\nGLD 12m: ${formatNullablePercent(point.gld12mReturn)}\nIEF 12m: ${formatNullablePercent(point.ief12mReturn)}\n전략 보유: ${point.strategyExposure ? "GLD" : "BIL"}`;

              return (
                <g key={point.month}>
                  <circle cx={x} cy={getY(point.strategyDisplayNormalized)} r="2.75" fill="var(--gold-line)">
                    <title>{tooltip}</title>
                  </circle>
                  <circle cx={x} cy={getY(point.benchmarkDisplayNormalized)} r="2.75" fill="var(--blue-line)">
                    <title>{tooltip}</title>
                  </circle>
                  {showLabel ? (
                    <text x={x} y={chartHeight - 12} fill="var(--muted)" fontSize="11" textAnchor="middle">
                      {formatShortMonthLabel(point.month)}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[var(--soft-surface)] px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">{value}</p>
    </div>
  );
}
