const DATE_VALUE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type DashboardDateRange = {
  from: string;
  to: string;
  start: Date;
  end: Date;
};

export function parseDashboardDateRange(
  from?: string,
  to?: string,
  now = new Date(),
): DashboardDateRange {
  const fallback = defaultDashboardDateValues(now);
  const fromValue = isValidDateValue(from) ? from : fallback.from;
  const toValue = isValidDateValue(to) ? to : fallback.to;
  const normalized = fromValue <= toValue
    ? { from: fromValue, to: toValue }
    : { from: toValue, to: fromValue };

  return {
    ...normalized,
    start: new Date(`${normalized.from}T00:00:00.000Z`),
    end: new Date(`${normalized.to}T23:59:59.999Z`),
  };
}

export function defaultDashboardDateValues(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const to = `${values.year}-${values.month}-${values.day}`;

  return {
    from: `${values.year}-${values.month}-01`,
    to,
  };
}

function isValidDateValue(value?: string): value is string {
  if (!value || !DATE_VALUE_PATTERN.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
