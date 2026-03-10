import {
  ACTIVITY_TYPE_BADGE_COLORS,
  ACTIVITY_TYPE_GRADIENT_COLORS,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_TYPE_OPTIONS,
  ACTIVITY_TYPE_PLURAL_LABELS,
  ACTIVITY_TYPE_SHORT_LABELS,
  ACTIVITY_TYPE_SOLID_COLORS,
  ACTIVITY_TYPE_STATS_COLORS,
  ACTIVITY_TYPES,
  DISTANCE_ACTIVITY_TYPES,
} from "../activity-types";

describe("ACTIVITY_TYPES", () => {
  test("contains exactly 5 activity types", () => {
    expect(ACTIVITY_TYPES).toHaveLength(5);
  });

  test("includes all expected types", () => {
    expect(ACTIVITY_TYPES).toContain("hiking");
    expect(ACTIVITY_TYPES).toContain("mtb");
    expect(ACTIVITY_TYPES).toContain("road_bike");
    expect(ACTIVITY_TYPES).toContain("running");
    expect(ACTIVITY_TYPES).toContain("trail_run");
  });
});

describe("label maps cover all types", () => {
  test("ACTIVITY_TYPE_LABELS has all types", () => {
    for (const type of ACTIVITY_TYPES) {
      expect(ACTIVITY_TYPE_LABELS[type]).toBeDefined();
      expect(typeof ACTIVITY_TYPE_LABELS[type]).toBe("string");
    }
  });

  test("ACTIVITY_TYPE_SHORT_LABELS has all types", () => {
    for (const type of ACTIVITY_TYPES) {
      expect(ACTIVITY_TYPE_SHORT_LABELS[type]).toBeDefined();
    }
  });

  test("ACTIVITY_TYPE_PLURAL_LABELS has all types", () => {
    for (const type of ACTIVITY_TYPES) {
      expect(ACTIVITY_TYPE_PLURAL_LABELS[type]).toBeDefined();
    }
  });
});

describe("color maps cover all types", () => {
  test("ACTIVITY_TYPE_SOLID_COLORS has all types", () => {
    for (const type of ACTIVITY_TYPES) {
      expect(ACTIVITY_TYPE_SOLID_COLORS[type]).toBeDefined();
    }
  });

  test("ACTIVITY_TYPE_BADGE_COLORS has all types", () => {
    for (const type of ACTIVITY_TYPES) {
      expect(ACTIVITY_TYPE_BADGE_COLORS[type]).toBeDefined();
    }
  });

  test("ACTIVITY_TYPE_STATS_COLORS has all types", () => {
    for (const type of ACTIVITY_TYPES) {
      expect(ACTIVITY_TYPE_STATS_COLORS[type]).toBeDefined();
    }
  });

  test("ACTIVITY_TYPE_GRADIENT_COLORS has all types", () => {
    for (const type of ACTIVITY_TYPES) {
      expect(ACTIVITY_TYPE_GRADIENT_COLORS[type]).toBeDefined();
    }
  });
});

describe("ACTIVITY_TYPE_OPTIONS", () => {
  test("has one option per activity type", () => {
    expect(ACTIVITY_TYPE_OPTIONS).toHaveLength(ACTIVITY_TYPES.length);
  });

  test("each option has key, label, and color", () => {
    for (const opt of ACTIVITY_TYPE_OPTIONS) {
      expect(ACTIVITY_TYPES).toContain(opt.key);
      expect(opt.label).toBeTruthy();
      expect(opt.color).toBeTruthy();
    }
  });
});

describe("DISTANCE_ACTIVITY_TYPES", () => {
  test("includes running, trail_run, and road_bike", () => {
    expect(DISTANCE_ACTIVITY_TYPES.has("running")).toBe(true);
    expect(DISTANCE_ACTIVITY_TYPES.has("trail_run")).toBe(true);
    expect(DISTANCE_ACTIVITY_TYPES.has("road_bike")).toBe(true);
  });

  test("does not include hiking or mtb", () => {
    expect(DISTANCE_ACTIVITY_TYPES.has("hiking")).toBe(false);
    expect(DISTANCE_ACTIVITY_TYPES.has("mtb")).toBe(false);
  });
});

describe("label consistency", () => {
  test("road_bike uses 'Road Biking' not 'Road Cycling'", () => {
    expect(ACTIVITY_TYPE_LABELS.road_bike).toBe("Road Biking");
  });

  test("full labels use proper capitalization", () => {
    expect(ACTIVITY_TYPE_LABELS.hiking).toBe("Hiking");
    expect(ACTIVITY_TYPE_LABELS.mtb).toBe("Mountain Biking");
    expect(ACTIVITY_TYPE_LABELS.running).toBe("Running");
    expect(ACTIVITY_TYPE_LABELS.trail_run).toBe("Trail Running");
  });
});
