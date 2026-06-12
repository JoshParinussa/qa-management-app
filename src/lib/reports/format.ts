/**
 * Indonesian short timestamp used across report-detail UI sections
 * (feedback history, activity timeline). Renders as e.g. "12 Jun 2026 09.12".
 */
export function formatReportTimestamp(value: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

/**
 * Indonesian date-only format used for week ranges and similar contexts
 * where time-of-day is irrelevant. Renders as e.g. "12 Jun 2026".
 *
 * `timeZone: "UTC"` keeps the output stable for stored dates that were
 * intended to represent a calendar day rather than a moment in time.
 */
export function formatReportDate(value: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
