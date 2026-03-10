import { generateSlug } from "../slug";

describe("generateSlug", () => {
  test("converts to lowercase", () => {
    expect(generateSlug("Manila Trail Runners")).toBe("manila-trail-runners");
  });

  test("replaces spaces with hyphens", () => {
    expect(generateSlug("my club name")).toBe("my-club-name");
  });

  test("removes special characters", () => {
    expect(generateSlug("Club #1 (Best!)")).toBe("club-1-best");
  });

  test("collapses consecutive hyphens", () => {
    expect(generateSlug("club---name")).toBe("club-name");
  });

  test("trims leading and trailing hyphens", () => {
    expect(generateSlug("-club-name-")).toBe("club-name");
    expect(generateSlug("  club  ")).toBe("club");
  });

  test("limits to 60 characters", () => {
    const longName = "a".repeat(100);
    expect(generateSlug(longName).length).toBeLessThanOrEqual(60);
  });

  test("handles empty string", () => {
    expect(generateSlug("")).toBe("");
  });

  test("handles numbers", () => {
    expect(generateSlug("Club 2024")).toBe("club-2024");
  });

  test("handles unicode characters", () => {
    expect(generateSlug("Café Riders")).toBe("caf-riders");
  });

  test("handles multiple spaces between words", () => {
    expect(generateSlug("Manila    Trail    Runners")).toBe("manila-trail-runners");
  });
});
