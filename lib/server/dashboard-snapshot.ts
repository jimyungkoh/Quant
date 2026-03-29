import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { getDashboardData } from "@/lib/server/get-dashboard-data";
import type {
  DashboardData,
  DashboardFreshness,
  PersistedDashboardData,
} from "@/lib/types";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DEFAULT_SNAPSHOT_FILE = "/data/dashboard-snapshot.json";
const nyseHolidayCache = new Map<number, Set<string>>();

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function fromUtcParts(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function nthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  occurrence: number,
): Date {
  const firstDay = fromUtcParts(year, month, 1);
  const delta = (weekday - firstDay.getUTCDay() + 7) % 7;
  return fromUtcParts(year, month, 1 + delta + (occurrence - 1) * 7);
}

function lastWeekdayOfMonth(year: number, month: number, weekday: number): Date {
  const lastDay = fromUtcParts(year, month + 1, 0);
  const delta = (lastDay.getUTCDay() - weekday + 7) % 7;
  return addUtcDays(lastDay, -delta);
}

function getObservedHoliday(
  year: number,
  month: number,
  day: number,
  options?: { skipSaturdayObservation?: boolean },
): Date | null {
  const holiday = fromUtcParts(year, month, day);
  const weekday = holiday.getUTCDay();

  if (weekday === 6 && options?.skipSaturdayObservation) {
    return null;
  }

  if (weekday === 6) {
    return addUtcDays(holiday, -1);
  }

  if (weekday === 0) {
    return addUtcDays(holiday, 1);
  }

  return holiday;
}

function getEasterSunday(year: number): Date {
  const century = Math.floor(year / 100);
  const yearOfCentury = year % 100;
  const leapCentury = Math.floor(century / 4);
  const centuryRemainder = century % 4;
  const correction = Math.floor((century + 8) / 25);
  const adjustedCorrection = Math.floor((century - correction + 1) / 3);
  const epact =
    (19 * (year % 19) + century - leapCentury - adjustedCorrection + 15) % 30;
  const leapYearOfCentury = Math.floor(yearOfCentury / 4);
  const yearRemainder = yearOfCentury % 4;
  const dayOffset =
    (32 + 2 * centuryRemainder + 2 * leapYearOfCentury - epact - yearRemainder) % 7;
  const moon = Math.floor((year % 19 + 11 * epact + 22 * dayOffset) / 451);
  const month = Math.floor((epact + dayOffset - 7 * moon + 114) / 31);
  const day = ((epact + dayOffset - 7 * moon + 114) % 31) + 1;

  return fromUtcParts(year, month, day);
}

function getNyseHolidaySet(year: number): Set<string> {
  const cached = nyseHolidayCache.get(year);

  if (cached) {
    return cached;
  }

  const holidays = [
    getObservedHoliday(year, 1, 1, { skipSaturdayObservation: true }),
    nthWeekdayOfMonth(year, 1, 1, 3),
    nthWeekdayOfMonth(year, 2, 1, 3),
    addUtcDays(getEasterSunday(year), -2),
    lastWeekdayOfMonth(year, 5, 1),
    year >= 2022 ? getObservedHoliday(year, 6, 19) : null,
    getObservedHoliday(year, 7, 4),
    nthWeekdayOfMonth(year, 9, 1, 1),
    nthWeekdayOfMonth(year, 11, 4, 4),
    getObservedHoliday(year, 12, 25),
  ]
    .filter((date): date is Date => date !== null)
    .map(toIsoDate);

  const holidaySet = new Set(holidays);
  nyseHolidayCache.set(year, holidaySet);
  return holidaySet;
}

function isNyseHoliday(date: Date): boolean {
  return getNyseHolidaySet(date.getUTCFullYear()).has(toIsoDate(date));
}

function toKstCalendarDate(date: Date): Date {
  const kstDate = new Date(date.getTime() + KST_OFFSET_MS);
  return new Date(
    Date.UTC(
      kstDate.getUTCFullYear(),
      kstDate.getUTCMonth(),
      kstDate.getUTCDate(),
    ),
  );
}

function moveToPreviousBusinessDay(date: Date): Date {
  const cursor = new Date(date);
  cursor.setUTCDate(cursor.getUTCDate() - 1);

  while (
    cursor.getUTCDay() === 0 ||
    cursor.getUTCDay() === 6 ||
    isNyseHoliday(cursor)
  ) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return cursor;
}

export function getExpectedLatestQuoteDate(referenceDate = new Date()): string {
  return toIsoDate(moveToPreviousBusinessDay(toKstCalendarDate(referenceDate)));
}

export function buildPersistedDashboardData(
  dashboard: DashboardData,
  referenceDate = new Date(),
): PersistedDashboardData {
  const expectedQuoteDate = getExpectedLatestQuoteDate(referenceDate);
  const freshness: DashboardFreshness =
    dashboard.latestCommonQuoteDate >= expectedQuoteDate ? "fresh" : "stale";

  return {
    ...dashboard,
    expectedQuoteDate,
    freshness,
  };
}

export async function readDashboardSnapshot(
  filePath = process.env.SNAPSHOT_FILE ?? DEFAULT_SNAPSHOT_FILE,
): Promise<PersistedDashboardData | null> {
  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as PersistedDashboardData;
  } catch {
    return null;
  }
}

export async function writeDashboardSnapshot(
  dashboard: PersistedDashboardData,
  filePath = process.env.SNAPSHOT_FILE ?? DEFAULT_SNAPSHOT_FILE,
): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(dashboard, null, 2));
}

type RefreshDashboardSnapshotResult = {
  dashboard: PersistedDashboardData;
  latestComputation: PersistedDashboardData;
  usedPreviousSnapshot: boolean;
  snapshotUpdated: boolean;
};

export async function refreshDashboardSnapshot(
  referenceDate = new Date(),
  filePath = process.env.SNAPSHOT_FILE ?? DEFAULT_SNAPSHOT_FILE,
): Promise<RefreshDashboardSnapshotResult> {
  const latestComputation = buildPersistedDashboardData(
    await getDashboardData(referenceDate),
    referenceDate,
  );

  if (latestComputation.freshness === "fresh") {
    await writeDashboardSnapshot(latestComputation, filePath);

    return {
      dashboard: latestComputation,
      latestComputation,
      usedPreviousSnapshot: false,
      snapshotUpdated: true,
    };
  }

  const previousSnapshot = await readDashboardSnapshot(filePath);

  if (previousSnapshot) {
    return {
      dashboard: previousSnapshot,
      latestComputation,
      usedPreviousSnapshot: true,
      snapshotUpdated: false,
    };
  }

  await writeDashboardSnapshot(latestComputation, filePath);

  return {
    dashboard: latestComputation,
    latestComputation,
    usedPreviousSnapshot: false,
    snapshotUpdated: true,
  };
}

export async function getDashboardDataForPage(): Promise<PersistedDashboardData | null> {
  return readDashboardSnapshot();
}
