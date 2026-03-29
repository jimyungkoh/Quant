import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { afterEach, describe, expect, it } from "vitest";

import {
  buildPersistedDashboardData,
  getExpectedLatestQuoteDate,
  readDashboardSnapshot,
  writeDashboardSnapshot,
} from "@/lib/server/dashboard-snapshot";
import type { DashboardData } from "@/lib/types";

const baseDashboardData: DashboardData = {
  snapshot: {
    asOfMonth: "2026-02",
    buySignal: true,
    gld12mReturn: 0.12,
    ief12mReturn: 0.03,
    rationale: "test rationale",
    gldCalculation: {
      currentMonth: "2026-02",
      lookbackMonth: "2025-02",
      currentAdjClose: 120,
      lookbackAdjClose: 100,
      returnValue: 0.2,
    },
    iefCalculation: {
      currentMonth: "2026-02",
      lookbackMonth: "2025-02",
      currentAdjClose: 103,
      lookbackAdjClose: 100,
      returnValue: 0.03,
    },
  },
  series: [],
  generatedAt: "2026-03-31T00:00:00.000Z",
  source: "test source",
  latestCommonQuoteDate: "2026-03-31",
};

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((path) => rm(path, { recursive: true, force: true })),
  );
});

describe("getExpectedLatestQuoteDate", () => {
  it("maps Monday 09:00 KST to the previous Friday", () => {
    expect(getExpectedLatestQuoteDate(new Date("2026-03-30T00:00:00.000Z"))).toBe(
      "2026-03-27",
    );
  });

  it("maps Wednesday 09:00 KST to the previous day", () => {
    expect(getExpectedLatestQuoteDate(new Date("2026-04-01T00:00:00.000Z"))).toBe(
      "2026-03-31",
    );
  });

  it("skips Good Friday when looking up the previous NYSE trading day", () => {
    expect(getExpectedLatestQuoteDate(new Date("2026-04-06T00:00:00.000Z"))).toBe(
      "2026-04-02",
    );
  });

  it("skips observed Independence Day closures", () => {
    expect(getExpectedLatestQuoteDate(new Date("2026-07-06T00:00:00.000Z"))).toBe(
      "2026-07-02",
    );
  });

  it("skips observed Juneteenth closures", () => {
    expect(getExpectedLatestQuoteDate(new Date("2027-06-21T00:00:00.000Z"))).toBe(
      "2027-06-17",
    );
  });
});

describe("buildPersistedDashboardData", () => {
  it("marks data as fresh when the latest quote date matches the expected business day", () => {
    const result = buildPersistedDashboardData(
      baseDashboardData,
      new Date("2026-04-01T00:00:00.000Z"),
    );

    expect(result.freshness).toBe("fresh");
    expect(result.expectedQuoteDate).toBe("2026-03-31");
  });

  it("marks data as stale when the latest quote date lags the expected business day", () => {
    const result = buildPersistedDashboardData(
      {
        ...baseDashboardData,
        latestCommonQuoteDate: "2026-03-30",
      },
      new Date("2026-04-01T00:00:00.000Z"),
    );

    expect(result.freshness).toBe("stale");
    expect(result.expectedQuoteDate).toBe("2026-03-31");
  });
});

describe("dashboard snapshot persistence", () => {
  it("round-trips persisted dashboard data through disk", async () => {
    const dir = await mkdtemp(join(tmpdir(), "quant-dashboard-snapshot-"));
    tempDirs.push(dir);

    const filePath = join(dir, "dashboard-snapshot.json");
    const snapshot = buildPersistedDashboardData(
      baseDashboardData,
      new Date("2026-04-01T00:00:00.000Z"),
    );

    await writeDashboardSnapshot(snapshot, filePath);

    await expect(readDashboardSnapshot(filePath)).resolves.toEqual(snapshot);
  });
});
