import { sanitizeName } from "../sanitize-name";

describe("sanitizeName", () => {
  test("returns plain text unchanged", () => {
    expect(sanitizeName("James Soo")).toBe("James Soo");
  });

  test("strips script tags", () => {
    expect(sanitizeName('"><script>alert(1)</script>')).toBe('"alert(1)');
  });

  test("strips img onerror payloads", () => {
    expect(sanitizeName('"><img src="x" onerror=alert(1)>')).toBe('"');
  });

  test("removes stray angle brackets", () => {
    expect(sanitizeName("name<>test")).toBe("nametest");
  });

  test("trims whitespace", () => {
    expect(sanitizeName("  John Doe  ")).toBe("John Doe");
  });

  test("returns empty string for tag-only input", () => {
    expect(sanitizeName("<script>alert(1)</script>")).toBe("alert(1)");
  });

  test("handles empty string", () => {
    expect(sanitizeName("")).toBe("");
  });
});
