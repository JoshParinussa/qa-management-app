export type IncidentItem = { title: string; description: string };

export function parseIncidents(value?: string | null): IncidentItem[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => ({
          title: String(item?.title ?? "").trim(),
          description: String(item?.description ?? "").trim(),
        }))
        .filter((item) => item.title || item.description);
    }
  } catch {
    const text = value.trim();
    if (text) return [{ title: "", description: text }];
  }
  return [];
}
