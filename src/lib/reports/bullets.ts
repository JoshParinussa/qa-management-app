function cleanItem(value: string) {
  return value.trim();
}

export function parseBulletItems(value?: string | null): string[] {
  if (!value) return [];

  const trimmed = value.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => cleanItem(String(item))).filter(Boolean);
      }
    } catch {
      // Fall through to legacy newline parsing.
    }
  }

  return trimmed
    .split("\n")
    .map((row) => row.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean);
}

export function serializeBulletItems(items: string[]) {
  const cleaned = items.map(cleanItem).filter(Boolean);
  return cleaned.length > 0 ? JSON.stringify(cleaned) : "";
}

export function formatMarkdownBullet(item: string) {
  const lines = item.split("\n");
  const [first = "", ...rest] = lines;
  return [`- ${first}`, ...rest.map((line) => `  ${line}`)].join("\n");
}
