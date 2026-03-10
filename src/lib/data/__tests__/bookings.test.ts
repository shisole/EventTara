import { splitBookingsByDate } from "../bookings";

describe("splitBookingsByDate", () => {
  const futureDate = new Date(Date.now() + 86400000).toISOString();
  const pastDate = new Date(Date.now() - 86400000).toISOString();

  test("splits bookings into upcoming and past", () => {
    const bookings = [
      { id: "1", events: { date: futureDate } },
      { id: "2", events: { date: pastDate } },
      { id: "3", events: { date: futureDate } },
    ];

    const { upcoming, past } = splitBookingsByDate(bookings);

    expect(upcoming).toHaveLength(2);
    expect(past).toHaveLength(1);
    expect(upcoming.map((b) => b.id)).toEqual(["1", "3"]);
    expect(past.map((b) => b.id)).toEqual(["2"]);
  });

  test("excludes bookings without events", () => {
    const bookings = [
      { id: "1", events: { date: futureDate } },
      { id: "2", events: null },
      { id: "3" },
    ];

    const { upcoming, past } = splitBookingsByDate(bookings as any);

    expect(upcoming).toHaveLength(1);
    expect(past).toHaveLength(0);
  });

  test("returns empty arrays for empty input", () => {
    const { upcoming, past } = splitBookingsByDate([]);

    expect(upcoming).toEqual([]);
    expect(past).toEqual([]);
  });

  test("today's date is considered upcoming", () => {
    const now = new Date().toISOString();
    const bookings = [{ id: "1", events: { date: now } }];

    const { upcoming } = splitBookingsByDate(bookings);

    expect(upcoming).toHaveLength(1);
  });
});
