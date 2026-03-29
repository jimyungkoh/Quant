import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTime } from "@/lib/formatters";

type MethodologyNoteProps = {
  generatedAt: string;
  source: string;
};

export function MethodologyNote({ generatedAt, source }: MethodologyNoteProps) {
  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">방법론</p>
          <CardTitle>계산 기준과 제약</CardTitle>
          <CardDescription>
            연구 원문의 매크로 해석은 유지하되, 실제 서비스 데이터는 Yahoo Finance ETF 시계열로 구현합니다.
          </CardDescription>
        </div>
        <Badge variant="blue">월말 신호</Badge>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-7 text-[var(--muted)]">
        <ul className="grid gap-3 pl-5 marker:text-[var(--muted)]">
          <li>일별 Adjusted Close를 월말로 집계해 12개월 수익률을 계산합니다.</li>
          <li>공식 신호는 항상 최근 완료된 월말 기준입니다. 진행 중인 이번 달은 참고용으로도 포함하지 않습니다.</li>
          <li>전략 추이선은 월말 신호를 다음 달 수익률에 반영하며, 현금 대기 구간은 BIL 월수익률로 대체합니다.</li>
          <li>원문 백테스트와 달리 ETF 데이터(GLD, IEF, BIL)로 구현하므로 시계열 범위는 세 ETF 공통 구간으로 제한됩니다.</li>
          <li>Yahoo Finance Adjusted Close는 총수익의 근사치이며, 원문 지수와 완전히 동일하지 않을 수 있습니다.</li>
        </ul>
        <div className="space-y-1 text-xs text-[var(--muted)]">
          <p className="uppercase tracking-[0.08em]">마지막 배치 갱신 · {formatDateTime(generatedAt)}</p>
          <p>데이터 · {source}</p>
        </div>
        <div className="border-t border-[color:var(--border)] pt-3 text-xs leading-6 text-[var(--muted)]">
          원문 출처 ·{" "}
          <a
            href="https://quantpedia.com/cross-asset-price-based-regimes-for-gold/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-[var(--foreground)] transition-colors"
          >
            Quantpedia – Cross-Asset Price-Based Regimes for Gold
          </a>
          {" "}· 이 구현은 원문 아이디어를 ETF(GLD/IEF/BIL)로 재현한 것으로, Quantpedia의 공식 서비스와 무관합니다.
        </div>
      </CardContent>
    </Card>
  );
}
