import { type UnclaimedBooking, matchBookingByName } from "../match-booking";

const booking = (id: string, name: string | null): UnclaimedBooking => ({
  id,
  manual_name: name,
  event_distance_id: null,
});

describe("matchBookingByName", () => {
  const bookings: UnclaimedBooking[] = [
    booking("b1", "Juan Dela Cruz"),
    booking("b2", "Maria Santos"),
    booking("b3", "Pedro Garcia"),
  ];

  test("exact match", () => {
    expect(matchBookingByName(bookings, "Juan Dela Cruz")).toEqual(bookings[0]);
  });

  test("case-insensitive match", () => {
    expect(matchBookingByName(bookings, "maria santos")).toEqual(bookings[1]);
    expect(matchBookingByName(bookings, "PEDRO GARCIA")).toEqual(bookings[2]);
  });

  test("trims whitespace", () => {
    expect(matchBookingByName(bookings, "  Juan Dela Cruz  ")).toEqual(bookings[0]);
  });

  test("matches when booking name has extra whitespace", () => {
    const withSpaces = [booking("b1", "  Juan Dela Cruz  ")];
    expect(matchBookingByName(withSpaces, "Juan Dela Cruz")).toEqual(withSpaces[0]);
  });

  test("returns null for no match", () => {
    expect(matchBookingByName(bookings, "Unknown Person")).toBeNull();
  });

  test("returns null for duplicate names (ambiguous)", () => {
    const dupes = [booking("b1", "Juan Dela Cruz"), booking("b2", "Juan Dela Cruz")];
    expect(matchBookingByName(dupes, "Juan Dela Cruz")).toBeNull();
  });

  test("returns null for null/undefined/empty name", () => {
    expect(matchBookingByName(bookings, null)).toBeNull();
    // eslint-disable-next-line unicorn/no-useless-undefined
    expect(matchBookingByName(bookings, undefined)).toBeNull();
    expect(matchBookingByName(bookings, "")).toBeNull();
    expect(matchBookingByName(bookings, "   ")).toBeNull();
  });

  test("returns null for empty bookings array", () => {
    expect(matchBookingByName([], "Juan Dela Cruz")).toBeNull();
  });

  test("skips bookings with null manual_name", () => {
    const mixed = [booking("b1", null), booking("b2", "Juan Dela Cruz")];
    expect(matchBookingByName(mixed, "Juan Dela Cruz")).toEqual(mixed[1]);
  });
});
