import { parseItinerary } from "@/lib/itinerary/parse";

describe("parseItinerary", () => {
  test("parses standard 12h format with dash", () => {
    const result = parseItinerary("4:00 AM - Assembly at trailhead");
    expect(result).toEqual([
      { time: "4:00 AM", title: "Assembly at trailhead", raw: "4:00 AM - Assembly at trailhead" },
    ]);
  });

  test("parses 24h format", () => {
    const result = parseItinerary("16:00 - Dinner at campsite");
    expect(result).toEqual([
      { time: "16:00", title: "Dinner at campsite", raw: "16:00 - Dinner at campsite" },
    ]);
  });

  test("parses time without space before AM/PM", () => {
    const result = parseItinerary("4:00AM - Assembly");
    expect(result).toEqual([{ time: "4:00AM", title: "Assembly", raw: "4:00AM - Assembly" }]);
  });

  test("parses em dash separator", () => {
    const result = parseItinerary("4:00 AM — Assembly");
    expect(result).toEqual([{ time: "4:00 AM", title: "Assembly", raw: "4:00 AM — Assembly" }]);
  });

  test("parses en dash separator", () => {
    const result = parseItinerary("4:00 AM – Assembly");
    expect(result).toEqual([{ time: "4:00 AM", title: "Assembly", raw: "4:00 AM – Assembly" }]);
  });

  test("parses double dash separator", () => {
    const result = parseItinerary("4:00 AM -- Assembly");
    expect(result).toEqual([{ time: "4:00 AM", title: "Assembly", raw: "4:00 AM -- Assembly" }]);
  });

  test("handles no space around dash", () => {
    const result = parseItinerary("4:00AM-Assembly");
    expect(result).toEqual([{ time: "4:00AM", title: "Assembly", raw: "4:00AM-Assembly" }]);
  });

  test("returns unparseable lines with empty time", () => {
    const result = parseItinerary("Just some random text");
    expect(result).toEqual([
      { time: "", title: "Just some random text", raw: "Just some random text" },
    ]);
  });

  test("returns empty array for empty input", () => {
    expect(parseItinerary("")).toEqual([]);
  });

  test("returns empty array for whitespace-only input", () => {
    expect(parseItinerary("   \n  \n  ")).toEqual([]);
  });

  test("filters blank lines and trims whitespace", () => {
    const input = `
      4:00 AM - Assembly

      5:00 AM - Start hike
    `;
    const result = parseItinerary(input);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      time: "4:00 AM",
      title: "Assembly",
      raw: "4:00 AM - Assembly",
    });
    expect(result[1]).toEqual({
      time: "5:00 AM",
      title: "Start hike",
      raw: "5:00 AM - Start hike",
    });
  });

  test("parses multi-line mixed valid and invalid", () => {
    const input = `4:00 AM - Assembly
Day header
5:30 AM - Start hike`;
    const result = parseItinerary(input);
    expect(result).toHaveLength(3);
    expect(result[0].time).toBe("4:00 AM");
    expect(result[1]).toEqual({ time: "", title: "Day header", raw: "Day header" });
    expect(result[2].time).toBe("5:30 AM");
  });

  test("parses time with minutes like 10:30 PM", () => {
    const result = parseItinerary("10:30 PM - Night hike");
    expect(result).toEqual([
      { time: "10:30 PM", title: "Night hike", raw: "10:30 PM - Night hike" },
    ]);
  });

  test("handles lowercase am/pm", () => {
    const result = parseItinerary("4:00 am - Assembly");
    expect(result).toEqual([{ time: "4:00 am", title: "Assembly", raw: "4:00 am - Assembly" }]);
  });
});
