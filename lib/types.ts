export type AssetSymbol = "GLD" | "IEF" | "BIL";

export type DailyAdjustedQuote = {
  symbol: AssetSymbol;
  date: Date;
  adjClose: number;
  close: number | null;
};

export type MonthlyAdjustedPoint = {
  month: string;
  monthEndDate: string;
  adjClose: number;
};

export type MonthlyPoint = {
  month: string;
  monthEndDate: string;
  gldAdjClose: number;
  iefAdjClose: number;
  cashAdjClose: number;
  gld12mReturn: number | null;
  ief12mReturn: number | null;
  buySignal: boolean | null;
};

export type ChartPoint = MonthlyPoint & {
  strategyNormalized: number;
  benchmarkNormalized: number;
  strategyMonthlyReturn: number | null;
  benchmarkMonthlyReturn: number | null;
  cashMonthlyReturn: number | null;
  strategyExposure: 0 | 1;
};

export type ReturnCalculation = {
  currentMonth: string;
  lookbackMonth: string;
  currentAdjClose: number;
  lookbackAdjClose: number;
  returnValue: number;
};

export type SignalSnapshot = {
  asOfMonth: string;
  buySignal: boolean;
  gld12mReturn: number;
  ief12mReturn: number;
  rationale: string;
  gldCalculation: ReturnCalculation;
  iefCalculation: ReturnCalculation;
};

export type DashboardData = {
  snapshot: SignalSnapshot;
  series: ChartPoint[];
  generatedAt: string;
  source: string;
  latestCommonQuoteDate: string;
};

export type DashboardFreshness = "fresh" | "stale";

export type PersistedDashboardData = DashboardData & {
  expectedQuoteDate: string;
  freshness: DashboardFreshness;
};
