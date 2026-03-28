export function nextSortOrder(entries: { sort_order: number }[]): number {
  if (entries.length === 0) return 0;
  return Math.max(...entries.map((e) => e.sort_order)) + 1;
}
