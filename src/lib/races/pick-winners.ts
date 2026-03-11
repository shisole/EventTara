/**
 * Randomly pick `count` winners from an array of IDs using Fisher-Yates shuffle.
 */
export function pickWinners(ids: string[], count: number): string[] {
  if (count <= 0 || ids.length === 0) return [];
  const shuffled = [...ids];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
