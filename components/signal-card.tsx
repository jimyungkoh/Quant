import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatMonthLabel,
  formatPercent,
  formatPrice,
} from "@/lib/formatters";
import type { ReturnCalculation, SignalSnapshot } from "@/lib/types";

type SignalCardProps = {
  snapshot: SignalSnapshot;
};

export function SignalCard({ snapshot }: SignalCardProps) {
  const isBuy = snapshot.buySignal;

  return (
    <Card className="overflow-hidden">
      {/* 대형 신호 배너 */}
      <div
        className={`flex items-center justify-between px-7 py-5 lg:px-8 ${
          isBuy
            ? "bg-[var(--soft-green)] text-[var(--soft-green-foreground)]"
            : "bg-[var(--soft-yellow)] text-[var(--soft-yellow-foreground)]"
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`h-3 w-3 rounded-full ${isBuy ? "bg-[#3a7d44]" : "bg-[#9a6b00]"}`}
            aria-hidden="true"
          />
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] opacity-70">
            {formatMonthLabel(snapshot.asOfMonth)} 기준
          </span>
        </div>
        <p className="text-[1.6rem] font-semibold leading-none tracking-[-0.04em] sm:text-[2rem]">
          {isBuy ? "매수 유효" : "현금 대기"}
        </p>
      </div>

      <CardHeader className="gap-5 p-7 lg:p-8">
        <div className="space-y-2">
          <CardTitle className="text-[1.4rem] sm:text-[1.6rem]">금 매수 신호</CardTitle>
          <CardDescription className="max-w-[32rem] text-[15px] leading-7">
            월말 기준 GLD와 IEF가 모두 12개월 상승 추세일 때만 신호가 켜집니다.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 px-7 pb-7 lg:px-8 lg:pb-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <Metric label="GLD 12개월 수익률" value={formatPercent(snapshot.gld12mReturn)} />
          <Metric label="IEF 12개월 수익률" value={formatPercent(snapshot.ief12mReturn)} />
        </div>
        <hr className="shrink-0 border-none bg-[color:var(--border)] h-px w-full" />
        <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">{snapshot.rationale}</p>
        <hr className="shrink-0 border-none bg-[color:var(--border)] h-px w-full" />
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
              수익률 산식
            </p>
            <p className="text-sm leading-7 text-[var(--muted)]">
              12개월 수익률 = (최근 완료 월말 Adjusted Close ÷ 12개월 전 월말 Adjusted Close) - 1
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <CalculationPanel
              assetLabel="GLD"
              accentClassName="bg-[var(--soft-yellow)]"
              calculation={snapshot.gldCalculation}
            />
            <CalculationPanel
              assetLabel="IEF"
              accentClassName="bg-[var(--soft-blue)]"
              calculation={snapshot.iefCalculation}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[var(--soft-surface)] px-4 py-4">
      <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function CalculationPanel({
  assetLabel,
  accentClassName,
  calculation,
}: {
  assetLabel: string;
  accentClassName: string;
  calculation: ReturnCalculation;
}) {
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[var(--soft-surface)] p-4">
      <div className="flex items-center gap-2">
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${accentClassName}`}
          aria-hidden="true"
        />
        <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
          {assetLabel} 적용 숫자
        </p>
      </div>
      <div className="mt-4 space-y-2 text-sm leading-7 text-[var(--muted)]">
        <p>
          기준 월: <span className="text-[var(--foreground)]">{formatMonthLabel(calculation.currentMonth)}</span>
        </p>
        <p>
          비교 월: <span className="text-[var(--foreground)]">{formatMonthLabel(calculation.lookbackMonth)}</span>
        </p>
        <p className="rounded-lg border border-[color:var(--border)] bg-white px-3 py-2 font-medium text-[var(--foreground)] [font-family:var(--font-geist-mono)]">
          ({formatPrice(calculation.currentAdjClose)} ÷ {formatPrice(calculation.lookbackAdjClose)}) - 1
          {" = "}
          {calculation.returnValue.toFixed(4)}
        </p>
        <p>
          표시 수익률: <span className="text-[var(--foreground)]">{formatPercent(calculation.returnValue)}</span>
        </p>
      </div>
    </div>
  );
}
