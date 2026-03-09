import { isReservedUsername, RESERVED_USERNAMES } from "../reserved-usernames";

describe("RESERVED_USERNAMES", () => {
  test("contains platform roles", () => {
    expect(RESERVED_USERNAMES.has("admin")).toBe(true);
    expect(RESERVED_USERNAMES.has("moderator")).toBe(true);
    expect(RESERVED_USERNAMES.has("superadmin")).toBe(true);
  });

  test("contains brand names", () => {
    expect(RESERVED_USERNAMES.has("eventtara")).toBe(true);
    expect(RESERVED_USERNAMES.has("tara")).toBe(true);
  });

  test("contains route-colliding paths", () => {
    expect(RESERVED_USERNAMES.has("login")).toBe(true);
    expect(RESERVED_USERNAMES.has("signup")).toBe(true);
    expect(RESERVED_USERNAMES.has("dashboard")).toBe(true);
    expect(RESERVED_USERNAMES.has("events")).toBe(true);
    expect(RESERVED_USERNAMES.has("feed")).toBe(true);
    expect(RESERVED_USERNAMES.has("clubs")).toBe(true);
  });

  test("does not contain normal usernames", () => {
    expect(RESERVED_USERNAMES.has("maria")).toBe(false);
    expect(RESERVED_USERNAMES.has("trailrunner42")).toBe(false);
    expect(RESERVED_USERNAMES.has("hiking_fan")).toBe(false);
  });
});

describe("isReservedUsername", () => {
  test("returns true for reserved usernames", () => {
    expect(isReservedUsername("admin")).toBe(true);
    expect(isReservedUsername("eventtara")).toBe(true);
    expect(isReservedUsername("dashboard")).toBe(true);
  });

  test("is case-insensitive", () => {
    expect(isReservedUsername("Admin")).toBe(true);
    expect(isReservedUsername("ADMIN")).toBe(true);
    expect(isReservedUsername("EventTara")).toBe(true);
  });

  test("trims whitespace", () => {
    expect(isReservedUsername("  admin  ")).toBe(true);
    expect(isReservedUsername("admin ")).toBe(true);
  });

  test("returns false for normal usernames", () => {
    expect(isReservedUsername("maria")).toBe(false);
    expect(isReservedUsername("trail_runner")).toBe(false);
    expect(isReservedUsername("hiker2024")).toBe(false);
  });

  test("returns false for empty string", () => {
    expect(isReservedUsername("")).toBe(false);
  });
});
