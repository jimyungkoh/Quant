# Gold Composite Momentum Dashboard

> 운영 주소: https://quant.jichive.com

GLD와 IEF의 월말 adjusted close를 이용해 12개월 합성 모멘텀 신호를 계산하는 Next.js 대시보드입니다.

## 핵심 아이디어

- **GLD 12개월 수익률 > 0**
- **IEF 12개월 수익률 > 0**

두 조건이 동시에 만족될 때만 금 매수 신호를 `매수 유효`로 표시합니다.  
현재 신호는 항상 **최근 완료된 월말 기준**으로 계산되며, 진행 중인 현재 달 데이터는 공식 판단에서 제외합니다.

## 기술 스택

- Next.js App Router
- React 19
- TypeScript
- yahoo-finance2
- Vitest

## 로컬 실행

```bash
pnpm install
pnpm dev
```

브라우저에서 `http://localhost:3000`을 열면 대시보드를 볼 수 있습니다.

## 검증 명령

```bash
pnpm test
pnpm lint
pnpm build
```

## Docker 배포

경량 배포를 위해 Next.js standalone 출력 기반 멀티 스테이지 이미지를 사용합니다.

```bash
docker compose up -d --build
docker compose logs -f
docker compose down
```

- 기본 공개 포트: `3000`
- 다른 호스트 포트를 쓰려면 `HOST_PORT=8080 docker compose up -d --build`

## 데이터 메모

- 데이터 소스: Yahoo Finance
- 서버 측에서 GLD/IEF 일별 데이터를 가져온 뒤 월말 adjusted close로 집계합니다.
- 원문 연구의 1969년 장기 데이터가 아니라 ETF 가용 시점 이후 데이터만 표시합니다.

## 주요 파일

- `app/page.tsx` - 메인 대시보드 페이지
- `lib/server/yahoo-finance.ts` - Yahoo Finance 데이터 수집
- `lib/domain/monthly-series.ts` - 월말 집계 및 롤링 수익률 계산
- `lib/domain/gold-regime.ts` - 합성 모멘텀 시그널 계산
- `components/*` - 신호 카드, 차트, 방법론 UI
