/**
 * 금 매수 신호 체크 스크립트
 * - 매월 신호가 갱신되면 Telegram으로 알림
 * - 신호 방향이 바뀌면 강조 표시
 *
 * 환경변수:
 *   TELEGRAM_BOT_TOKEN  — @BotFather 에서 발급
 *   TELEGRAM_CHAT_ID    — @userinfobot 에서 확인
 *   STATE_FILE          — 상태 저장 경로 (기본: /data/last-signal.json)
 *   SNAPSHOT_FILE       — 대시보드 스냅샷 경로 (기본: /data/dashboard-snapshot.json)
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { refreshDashboardSnapshot } from "@/lib/server/dashboard-snapshot";
import { formatMonthLabel, formatPercent } from "@/lib/formatters";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const STATE_FILE = process.env.STATE_FILE ?? "/data/last-signal.json";
const FORCE_NOTIFY = process.env.FORCE_NOTIFY === "true";

if (!BOT_TOKEN || !CHAT_ID) {
  console.error("TELEGRAM_BOT_TOKEN 과 TELEGRAM_CHAT_ID 환경변수가 필요합니다.");
  process.exit(1);
}

type SavedState = {
  month: string;
  buySignal: boolean;
};

function readState(): SavedState | null {
  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf-8")) as SavedState;
  } catch {
    return null;
  }
}

function writeState(state: SavedState): void {
  mkdirSync(dirname(STATE_FILE), { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function sendTelegram(text: string): Promise<void> {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: "HTML" }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    throw new Error(`Telegram API ${res.status}: ${await res.text()}`);
  }
}

async function main(): Promise<void> {
  const {
    dashboard,
    latestComputation,
    snapshotUpdated,
    usedPreviousSnapshot,
  } = await refreshDashboardSnapshot();
  const { snapshot } = dashboard;

  if (latestComputation.freshness === "stale") {
    console.warn(
      `[데이터 지연] latest=${latestComputation.latestCommonQuoteDate} expected=${latestComputation.expectedQuoteDate}`,
    );

    if (usedPreviousSnapshot) {
      console.warn(
        `[이전 스냅샷 유지] generatedAt=${dashboard.generatedAt} / asOfMonth=${dashboard.snapshot.asOfMonth}`,
      );
    }
  } else if (snapshotUpdated) {
    console.log(
      `[스냅샷 갱신] generatedAt=${dashboard.generatedAt} / latest=${dashboard.latestCommonQuoteDate}`,
    );
  }

  if (latestComputation.freshness === "stale" && !FORCE_NOTIFY) {
    console.log("[알림 보류] 최신 일봉 반영 전으로 판단되어 Telegram 전송을 건너뜁니다.");
    return;
  }

  const current: SavedState = {
    month: snapshot.asOfMonth,
    buySignal: snapshot.buySignal,
  };

  const previous = readState();

  // 첫 실행 — 상태 저장만 하고 종료 (FORCE_NOTIFY 시 제외)
  if (!previous && !FORCE_NOTIFY) {
    writeState(current);
    console.log(`[초기 실행] ${current.month} / ${current.buySignal ? "매수 유효" : "현금 대기"} 저장 완료`);
    return;
  }

  // 같은 달이면 신규 신호 없음 (FORCE_NOTIFY 시 제외)
  if (previous?.month === current.month && !FORCE_NOTIFY) {
    console.log(`[변경 없음] ${current.month} / ${current.buySignal ? "매수 유효" : "현금 대기"}`);
    return;
  }

  // 새 달 신호 — Telegram 발송
  const signalFlipped = previous ? previous.buySignal !== current.buySignal : false;
  const icon = current.buySignal ? "🟢" : "🟡";
  const currLabel = current.buySignal ? "매수 유효" : "현금 대기";
  const prevLabel = previous?.buySignal === true ? "매수 유효" : "현금 대기";

  let text = FORCE_NOTIFY
    ? `${icon} <b>금 매수 신호 (수동 확인)</b>\n\n`
    : `${icon} <b>금 매수 신호 업데이트</b>\n\n`;
  text += `📅 기준월: <b>${formatMonthLabel(current.month)}</b>\n`;
  text += `신호: <b>${currLabel}</b>\n\n`;
  text += `GLD 12개월 수익률: ${formatPercent(snapshot.gld12mReturn)}\n`;
  text += `IEF 12개월 수익률: ${formatPercent(snapshot.ief12mReturn)}\n`;

  if (signalFlipped) {
    text += `\n⚡ <b>방향 전환:</b> ${prevLabel} → ${currLabel}`;
  } else {
    text += `\n↩ 전월과 동일 방향 유지`;
  }

  await sendTelegram(text);
  writeState(current);
  console.log(`[알림 전송] ${current.month} / ${currLabel}${signalFlipped ? " (방향 전환)" : ""}`);
}

main().catch((err: unknown) => {
  console.error("[오류]", err);
  process.exit(1);
});
