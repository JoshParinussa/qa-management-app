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
