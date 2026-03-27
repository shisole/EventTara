import { nextSortOrder } from "@/lib/itinerary/sort";

describe("nextSortOrder", () => {
  test("returns 0 for an empty list", () => {
    expect(nextSortOrder([])).toBe(0);
  });

  test("returns max + 1 for a contiguous list", () => {
    expect(nextSortOrder([{ sort_order: 0 }, { sort_order: 1 }, { sort_order: 2 }])).toBe(3);
  });

  test("returns max + 1 for a non-contiguous list", () => {
    expect(nextSortOrder([{ sort_order: 0 }, { sort_order: 5 }, { sort_order: 3 }])).toBe(6);
  });

  test("returns max + 1 for a single entry", () => {
    expect(nextSortOrder([{ sort_order: 7 }])).toBe(8);
  });
});
