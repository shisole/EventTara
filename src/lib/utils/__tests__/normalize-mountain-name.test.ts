import { normalizeMountainName, stripMountainPrefix } from "@/lib/utils/normalize-mountain-name";

describe("normalizeMountainName", () => {
  test("normalizes 'Mt Apo' to 'Mt. Apo'", () => {
    expect(normalizeMountainName("Mt Apo")).toBe("Mt. Apo");
  });

  test("normalizes 'Mount Apo' to 'Mt. Apo'", () => {
    expect(normalizeMountainName("Mount Apo")).toBe("Mt. Apo");
  });

  test("only normalizes prefix case, not the rest", () => {
    expect(normalizeMountainName("mt. apo")).toBe("Mt. apo");
  });

  test("inserts space when prefix has no space", () => {
    expect(normalizeMountainName("Mt.Apo")).toBe("Mt. Apo");
  });

  test("collapses extra whitespace", () => {
    expect(normalizeMountainName("  Mt   Apo  ")).toBe("Mt. Apo");
  });

  test("returns name unchanged when there is no mountain prefix", () => {
    expect(normalizeMountainName("Chocolate Hills")).toBe("Chocolate Hills");
  });
});

describe("stripMountainPrefix", () => {
  test("strips 'Mt.' prefix and lowercases", () => {
    expect(stripMountainPrefix("Mt. Loboc")).toBe("loboc");
  });

  test("strips 'Mount' prefix and lowercases", () => {
    expect(stripMountainPrefix("Mount Apo")).toBe("apo");
  });

  test("lowercases name without prefix", () => {
    expect(stripMountainPrefix("Chocolate Hills")).toBe("chocolate hills");
  });
});
