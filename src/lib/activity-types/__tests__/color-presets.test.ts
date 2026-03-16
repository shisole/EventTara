import { describe, expect, test } from "vitest";

import { COLOR_PRESET_KEYS, COLOR_PRESETS, getColorPreset } from "../color-presets";

describe("COLOR_PRESETS", () => {
  test("every preset has all required roles", () => {
    const requiredKeys = ["dot", "solid", "badge", "stats", "gradient"];
    for (const key of COLOR_PRESET_KEYS) {
      const preset = COLOR_PRESETS[key];
      for (const role of requiredKeys) {
        expect(preset).toHaveProperty(role);
        expect(typeof preset[role as keyof typeof preset]).toBe("string");
        expect(preset[role as keyof typeof preset].length).toBeGreaterThan(0);
      }
    }
  });

  test("includes the original 5 activity type presets", () => {
    const original = ["emerald", "amber", "blue", "orange", "yellow"];
    for (const key of original) {
      expect(COLOR_PRESETS).toHaveProperty(key);
    }
  });

  test("includes gray fallback preset", () => {
    expect(COLOR_PRESETS).toHaveProperty("gray");
  });

  test("has at least 11 presets", () => {
    expect(COLOR_PRESET_KEYS.length).toBeGreaterThanOrEqual(11);
  });
});

describe("getColorPreset", () => {
  test("returns the correct preset for a known key", () => {
    expect(getColorPreset("emerald")).toBe(COLOR_PRESETS.emerald);
    expect(getColorPreset("blue")).toBe(COLOR_PRESETS.blue);
  });

  test("returns gray for an unknown key", () => {
    expect(getColorPreset("nonexistent")).toBe(COLOR_PRESETS.gray);
    expect(getColorPreset("")).toBe(COLOR_PRESETS.gray);
  });
});
