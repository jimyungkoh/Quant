import { MethodologyNote } from "@/components/methodology-note";
import { PageShell } from "@/components/page-shell";
import { SignalCard } from "@/components/signal-card";
import {
  coerceTimeRange,
  TimeSeriesChart,
} from "@/components/time-series-chart";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { getDashboardDataForPage } from "@/lib/server/dashboard-snapshot";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const selectedRange = coerceTimeRange(params?.range);
  const dashboard = await getDashboardDataForPage();

  return (
    <PageShell>
      <section className="space-y-6">
        <Card>
          <CardHeader className="space-y-5 p-7 lg:p-8">
            <Badge variant="outline" className="w-fit">Quantpedia 기반 레짐 뷰</Badge>
            <div className="space-y-4">
              <h1 className="max-w-5xl text-[clamp(2rem,4.6vw,4.4rem)] font-semibold leading-[1.04] tracking-[-0.045em]">
                금과 국채의 12개월 추세로
                <br className="hidden sm:block" />
                금 매수 타이밍을 읽습니다.
              </h1>
              <CardDescription className="max-w-4xl text-[15px] leading-8 text-[var(--muted)] lg:text-base">
                GLD·IEF 12개월 수익률을 결합해 금 매수 조건을 판단합니다. 신호는 최근 완료 월말 기준입니다.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 px-7 pb-7 lg:px-8 lg:pb-8">
            <div className="grid gap-4 sm:grid-cols-3">
              <HeroMetric label="전략 규칙" value="GLD↑ + IEF↑" description="둘 다 12개월 상승" />
              <HeroMetric label="리밸런싱" value="월 1회" description="월말 확정 값 사용" />
              <HeroMetric label="데이터 소스" value="Yahoo" description="Adjusted Close 기반" />
            </div>
            <hr className="shrink-0 border-none bg-[color:var(--border)] h-px w-full" />
            <div className="grid gap-3 text-sm leading-7 text-[var(--muted)] sm:grid-cols-2">
              <p>GLD와 IEF가 동시에 강하면 실질금리 하락과 완화적 매크로 환경을 시사한다고 해석합니다.</p>
              <p>ETF 구현판이므로 원문 장기 백테스트와 시계열 범위는 다를 수 있습니다.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {dashboard ? (
        <>
          <SignalCard snapshot={dashboard.snapshot} />
          <TimeSeriesChart points={dashboard.series} selectedRange={selectedRange} />
          <MethodologyNote generatedAt={dashboard.generatedAt} source={dashboard.source} />
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardDescription>데이터 준비 중</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm leading-7 text-[var(--muted)]">
            <p>최신 기준 데이터를 준비하고 있습니다.</p>
            <p>잠시 후 다시 확인해 주세요.</p>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}

function HeroMetric({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[var(--soft-surface)] px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-lg font-semibold leading-none tracking-[-0.03em] text-[var(--foreground)]">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p>
    </div>
  );
}
