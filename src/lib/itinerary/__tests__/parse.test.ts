import { parseItinerary } from "@/lib/itinerary/parse";

describe("parseItinerary", () => {
  // === Inline format (time - title on same line) ===

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

  // === Block format (time on one line, description on next) ===

  test("parses time range as single time with description on next line", () => {
    const input = "6:00 AM – 8:00 AM\n\nMeet-up at plaza";
    const result = parseItinerary(input);
    expect(result).toEqual([
      {
        time: "6:00 AM – 8:00 AM",
        title: "Meet-up at plaza",
        raw: "6:00 AM – 8:00 AM\nMeet-up at plaza",
      },
    ]);
  });

  test("parses single time with description on next line", () => {
    const input = "11:00 AM\n\nArrival at campsite";
    const result = parseItinerary(input);
    expect(result).toEqual([
      { time: "11:00 AM", title: "Arrival at campsite", raw: "11:00 AM\nArrival at campsite" },
    ]);
  });

  test("collects multiple description lines under one time", () => {
    const input = "11:00 AM\n\nArrival at jump-off\n\nBrief orientation";
    const result = parseItinerary(input);
    expect(result).toEqual([
      {
        time: "11:00 AM",
        title: "Arrival at jump-off; Brief orientation",
        raw: "11:00 AM\nArrival at jump-off\nBrief orientation",
      },
    ]);
  });

  test("handles Day N headers as time prefix", () => {
    const input = "Day 1\n6:00 AM\n\nAssembly";
    const result = parseItinerary(input);
    expect(result).toEqual([
      { time: "Day 1 — 6:00 AM", title: "Assembly", raw: "6:00 AM\nAssembly" },
    ]);
  });

  test("handles day prefix across multiple entries", () => {
    const input = `Day 1
6:00 AM

Assembly

Day 2
5:00 AM

Wake-up call`;
    const result = parseItinerary(input);
    expect(result).toHaveLength(2);
    expect(result[0].time).toBe("Day 1 — 6:00 AM");
    expect(result[0].title).toBe("Assembly");
    expect(result[1].time).toBe("Day 2 — 5:00 AM");
    expect(result[1].title).toBe("Wake-up call");
  });

  test("handles Evening as time label", () => {
    const input = "Evening\n\nDinner and socials";
    const result = parseItinerary(input);
    expect(result).toEqual([
      { time: "Evening", title: "Dinner and socials", raw: "Evening\nDinner and socials" },
    ]);
  });

  test("handles Around prefix", () => {
    const input = "Around 2:00 PM\n\nPack up and prepare";
    const result = parseItinerary(input);
    expect(result).toEqual([
      {
        time: "Around 2:00 PM",
        title: "Pack up and prepare",
        raw: "Around 2:00 PM\nPack up and prepare",
      },
    ]);
  });

  test("handles onwards suffix", () => {
    const input = "3:00 PM onwards\n\nClean-up activity";
    const result = parseItinerary(input);
    expect(result).toEqual([
      {
        time: "3:00 PM onwards",
        title: "Clean-up activity",
        raw: "3:00 PM onwards\nClean-up activity",
      },
    ]);
  });

  test("skips Itinerary header line", () => {
    const input = "Itinerary\n4:00 AM - Assembly";
    const result = parseItinerary(input);
    expect(result).toHaveLength(1);
    expect(result[0].time).toBe("4:00 AM");
    expect(result[0].title).toBe("Assembly");
  });

  test("time-only line with no description uses time as title", () => {
    const result = parseItinerary("6:00 AM");
    expect(result).toEqual([{ time: "6:00 AM", title: "6:00 AM", raw: "6:00 AM" }]);
  });

  test("parses real-world multi-day itinerary", () => {
    const input = `Itinerary
Day 1
6:00 AM – 8:00 AM

Meet-up and registration at Alimodian Plaza


8:00 AM – 11:00 AM

Travel from Alimodian Plaza to Brgy. Lico


11:00 AM

Arrival at Brgy. Lico Jump-off Point

Brief orientation and preparation


11:30 AM – 1:00 PM

Start trek to the campsite


1:00 PM – 2:00 PM

Arrival at campsite and set-up of tents


3:00 PM onwards

Clean-up activity around the campsite and nearby areas

Community activities / fellowship


Evening

Dinner and socials

Lights out



Day 2
5:00 AM

Wake-up call and breakfast


6:00 AM

Start morning trek and trail clean-up activity


Around 2:00 PM

Return to campsite, pack-up, and prepare for descent


3:00 PM

Arrival at Brgy. Lico Jump-off Point


4:00 PM

Travel back to Alimodian Plaza


6:00 PM

Arrival at Alimodian Plaza

End of program / travel back to Iloilo`;

    const result = parseItinerary(input);
    expect(result).toHaveLength(13);

    expect(result[0].time).toBe("Day 1 — 6:00 AM – 8:00 AM");
    expect(result[0].title).toBe("Meet-up and registration at Alimodian Plaza");

    expect(result[1].time).toBe("Day 1 — 8:00 AM – 11:00 AM");
    expect(result[1].title).toBe("Travel from Alimodian Plaza to Brgy. Lico");

    expect(result[2].time).toBe("Day 1 — 11:00 AM");
    expect(result[2].title).toBe(
      "Arrival at Brgy. Lico Jump-off Point; Brief orientation and preparation",
    );

    expect(result[3].time).toBe("Day 1 — 11:30 AM – 1:00 PM");
    expect(result[3].title).toBe("Start trek to the campsite");

    expect(result[4].time).toBe("Day 1 — 1:00 PM – 2:00 PM");
    expect(result[4].title).toBe("Arrival at campsite and set-up of tents");

    expect(result[5].time).toBe("Day 1 — 3:00 PM onwards");
    expect(result[5].title).toBe(
      "Clean-up activity around the campsite and nearby areas; Community activities / fellowship",
    );

    expect(result[6].time).toBe("Day 1 — Evening");
    expect(result[6].title).toBe("Dinner and socials; Lights out");

    expect(result[7].time).toBe("Day 2 — 5:00 AM");
    expect(result[7].title).toBe("Wake-up call and breakfast");

    expect(result[8].time).toBe("Day 2 — 6:00 AM");
    expect(result[8].title).toBe("Start morning trek and trail clean-up activity");

    expect(result[9].time).toBe("Day 2 — Around 2:00 PM");
    expect(result[9].title).toBe("Return to campsite, pack-up, and prepare for descent");

    expect(result[10].time).toBe("Day 2 — 3:00 PM");
    expect(result[10].title).toBe("Arrival at Brgy. Lico Jump-off Point");

    expect(result[11].time).toBe("Day 2 — 4:00 PM");
    expect(result[11].title).toBe("Travel back to Alimodian Plaza");

    expect(result[12].time).toBe("Day 2 — 6:00 PM");
    expect(result[12].title).toBe(
      "Arrival at Alimodian Plaza; End of program / travel back to Iloilo",
    );
  });
});
