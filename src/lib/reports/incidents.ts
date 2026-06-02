export type IncidentItem = { title: string; description: string; relatedTestCaseId: string };
const emptyIncident: IncidentItem = { title: "", description: "", relatedTestCaseId: "" };

export function parseIncidentCountInput(value: string) {
  const count = Math.floor(Number(value));
  return Number.isFinite(count) && count > 0 ? count : 0;
}

export function syncIncidentItemsToCount(items: IncidentItem[], count: number): IncidentItem[] {
  if (count <= 0) return [];

  if (items.length >= count) {
    return items.slice(0, count);
  }

  return [...items, ...Array.from({ length: count - items.length }, () => ({ ...emptyIncident }))];
}

export function parseIncidents(value?: string | null): IncidentItem[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => ({
          title: String(item?.title ?? "").trim(),
          description: String(item?.description ?? "").trim(),
          relatedTestCaseId: String(item?.relatedTestCaseId ?? "").trim(),
        }))
        .filter((item) => item.title || item.description || item.relatedTestCaseId);
    }
  } catch {
    const text = value.trim();
    if (text) return [{ title: "", description: text, relatedTestCaseId: "" }];
  }
  return [];
}
