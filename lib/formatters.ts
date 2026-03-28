const percentFormatter = new Intl.NumberFormat("ko-KR", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const monthFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  timeZone: "UTC",
});

const shortMonthFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  timeZone: "UTC",
});

const priceFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Seoul",
});

export function formatPercent(value: number) {
  return percentFormatter.format(value);
}

export function formatPrice(value: number) {
  return priceFormatter.format(value);
}

export function formatNullablePercent(value: number | null) {
  if (value == null) {
    return "N/A";
  }

  return formatPercent(value);
}

export function formatMonthLabel(month: string): string {
  const [year, rawMonth] = month.split("-").map(Number);
  if (isNaN(year) || isNaN(rawMonth)) return month;
  return monthFormatter.format(new Date(Date.UTC(year, rawMonth - 1, 1)));
}

export function formatShortMonthLabel(month: string): string {
  const [year, rawMonth] = month.split("-").map(Number);
  if (isNaN(year) || isNaN(rawMonth)) return month;
  return shortMonthFormatter.format(new Date(Date.UTC(year, rawMonth - 1, 1)));
}

export function formatDateTime(isoDate: string) {
  return dateTimeFormatter.format(new Date(isoDate));
}
