import { pickWinners } from "../pick-winners";

describe("pickWinners", () => {
  const ids = ["a", "b", "c", "d", "e"];

  test("returns correct number of winners", () => {
    expect(pickWinners(ids, 2)).toHaveLength(2);
  });

  test("returns all when count exceeds length", () => {
    const result = pickWinners(ids, 10);
    expect(result).toHaveLength(ids.length);
    expect(result.sort()).toEqual([...ids].sort());
  });

  test("returns no duplicates", () => {
    const result = pickWinners(ids, 3);
    expect(new Set(result).size).toBe(result.length);
  });

  test("winners are a subset of input", () => {
    const result = pickWinners(ids, 3);
    for (const id of result) {
      expect(ids).toContain(id);
    }
  });

  test("returns empty array for empty input", () => {
    expect(pickWinners([], 3)).toEqual([]);
  });

  test("returns empty array for zero count", () => {
    expect(pickWinners(ids, 0)).toEqual([]);
  });
});
