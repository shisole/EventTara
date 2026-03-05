import { cn } from "@/lib/utils";

describe("cn", () => {
  test("merges simple classes", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  test("handles conditional (false)", () => {
    expect(cn("foo", false && "bar")).toBe("foo");
  });

  test("handles undefined values", () => {
    expect(cn("foo", undefined, "bar")).toBe("foo bar");
  });

  test("merges conflicting Tailwind padding classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  test("merges conflicting Tailwind background classes", () => {
    expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
  });

  test("returns empty string for no arguments", () => {
    expect(cn()).toBe("");
  });

  test("accepts array input", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });
});
