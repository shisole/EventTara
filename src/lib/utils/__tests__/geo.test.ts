import { formatDistance, haversineDistance } from "@/lib/utils/geo";

describe("haversineDistance", () => {
  test("Cebu City to Manila is approximately 571km", () => {
    const distance = haversineDistance(10.3157, 123.8854, 14.5995, 120.9842);
    expect(distance).toBeCloseTo(571, -1);
  });

  test("same point returns 0", () => {
    const distance = haversineDistance(10.3157, 123.8854, 10.3157, 123.8854);
    expect(distance).toBe(0);
  });

  test("large distance: Tokyo to New York is approximately 10,852km", () => {
    // Tokyo: 35.6762, 139.6503
    // New York: 40.7128, -74.006
    const distance = haversineDistance(35.6762, 139.6503, 40.7128, -74.006);
    expect(distance).toBeCloseTo(10852, -1);
  });
});

describe("formatDistance", () => {
  test("0.5km returns '<1km'", () => {
    expect(formatDistance(0.5)).toBe("<1km");
  });

  test("0.001km returns '<1km'", () => {
    expect(formatDistance(0.001)).toBe("<1km");
  });

  test("15.3km returns '~15km'", () => {
    expect(formatDistance(15.3)).toBe("~15km");
  });

  test("1.5km rounds up to '~2km'", () => {
    expect(formatDistance(1.5)).toBe("~2km");
  });
});
