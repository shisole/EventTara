import {
  findOverlappingEvent,
  getEffectiveEnd,
  type OverlappingEvent,
  rangesOverlap,
} from "@/lib/events/overlap";

describe("getEffectiveEnd", () => {
  test("with endDate returns that date", () => {
    const result = getEffectiveEnd("2026-03-15T08:00:00Z", "2026-03-17T18:00:00Z");
    expect(result).toEqual(new Date("2026-03-17T18:00:00Z"));
  });

  test("without endDate returns 23:59:59.999 of same day", () => {
    const result = getEffectiveEnd("2026-03-15T08:00:00Z", null);
    const expected = new Date("2026-03-15T08:00:00Z");
    expected.setHours(23, 59, 59, 999);
    expect(result).toEqual(expected);
  });
});

describe("rangesOverlap", () => {
  test("overlapping ranges returns true", () => {
    const startA = new Date("2026-03-15T08:00:00Z");
    const endA = new Date("2026-03-17T18:00:00Z");
    const startB = new Date("2026-03-16T10:00:00Z");
    const endB = new Date("2026-03-18T12:00:00Z");
    expect(rangesOverlap(startA, endA, startB, endB)).toBe(true);
  });

  test("non-overlapping ranges returns false", () => {
    const startA = new Date("2026-03-15T08:00:00Z");
    const endA = new Date("2026-03-16T18:00:00Z");
    const startB = new Date("2026-03-20T10:00:00Z");
    const endB = new Date("2026-03-22T12:00:00Z");
    expect(rangesOverlap(startA, endA, startB, endB)).toBe(false);
  });

  test("touching boundaries (A end === B start) returns false", () => {
    const startA = new Date("2026-03-15T08:00:00Z");
    const endA = new Date("2026-03-17T18:00:00Z");
    const startB = new Date("2026-03-17T18:00:00Z");
    const endB = new Date("2026-03-19T12:00:00Z");
    expect(rangesOverlap(startA, endA, startB, endB)).toBe(false);
  });
});

describe("findOverlappingEvent", () => {
  const events: OverlappingEvent[] = [
    { id: "evt-1", title: "Mt. Opao Hike", date: "2026-03-15T06:00:00Z", end_date: null },
    {
      id: "evt-2",
      title: "Mt. Lingguhob Trek",
      date: "2026-03-20T07:00:00Z",
      end_date: "2026-03-21T17:00:00Z",
    },
    {
      id: "evt-3",
      title: "Trail Run",
      date: "2026-03-25T05:00:00Z",
      end_date: "2026-03-25T12:00:00Z",
    },
  ];

  test("finds first overlap in list", () => {
    const result = findOverlappingEvent("2026-03-20T10:00:00Z", "2026-03-20T15:00:00Z", events);
    expect(result).not.toBeNull();
    expect(result!.id).toBe("evt-2");
  });

  test("returns null when no overlap", () => {
    const result = findOverlappingEvent("2026-03-28T08:00:00Z", "2026-03-28T16:00:00Z", events);
    expect(result).toBeNull();
  });

  test("skips event with excludeEventId", () => {
    const result = findOverlappingEvent(
      "2026-03-20T10:00:00Z",
      "2026-03-20T15:00:00Z",
      events,
      "evt-2",
    );
    expect(result).toBeNull();
  });

  test("empty list returns null", () => {
    const result = findOverlappingEvent("2026-03-15T08:00:00Z", "2026-03-16T18:00:00Z", []);
    expect(result).toBeNull();
  });
});
