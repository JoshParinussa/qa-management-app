export type PaginationItem = number | "...";

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/**
 * Build a compact pagination range with ellipses.
 * Always shows the first and last page, an edge block of (siblings + 2) pages,
 * and a window of current +/- siblings in the middle.
 */
export function getPaginationRange(current: number, total: number, siblings = 1): PaginationItem[] {
  if (total <= 0) return [1];

  const totalNumbers = siblings * 2 + 5;
  if (total <= totalNumbers) {
    return range(1, total);
  }

  const leftSibling = Math.max(current - siblings, 1);
  const rightSibling = Math.min(current + siblings, total);

  const showLeftDots = leftSibling > 2;
  const showRightDots = rightSibling < total - 1;

  const edgeCount = siblings + 2;

  if (!showLeftDots && showRightDots) {
    return [...range(1, edgeCount), "...", total];
  }

  if (showLeftDots && !showRightDots) {
    return [1, "...", ...range(total - edgeCount + 1, total)];
  }

  return [1, "...", ...range(leftSibling, rightSibling), "...", total];
}
