import { describe, expect, test, vi } from "vitest";

import { calculateBadgeProgress } from "@/lib/badges/calculate-progress";

function createMockSupabase(overrides: Record<string, unknown> = {}) {
  const chainable = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    ...overrides,
  };
  return {
    from: vi.fn().mockReturnValue(chainable),
    _chain: chainable,
  } as any;
}

describe("calculateBadgeProgress", () => {
  test("returns null for first_hike (binary criteria)", async () => {
    const supabase = createMockSupabase();
    const badge = { criteria_key: "first_hike" } as any;

    const result = await calculateBadgeProgress("user-123", badge, supabase);
    expect(result).toBeNull();
  });

  test("returns null for strava_connected (binary criteria)", async () => {
    const supabase = createMockSupabase();
    const badge = { criteria_key: "strava_connected" } as any;

    const result = await calculateBadgeProgress("user-123", badge, supabase);
    expect(result).toBeNull();
  });

  test("returns null when criteria_key is null", async () => {
    const supabase = createMockSupabase();
    const badge = { criteria_key: null } as any;

    const result = await calculateBadgeProgress("user-123", badge, supabase);
    expect(result).toBeNull();
  });

  test("calculates progress for events_10 badge", async () => {
    const supabase = createMockSupabase();
    // The chain ends with .eq("user_id", ...) which resolves to { count: 7 }
    supabase._chain.eq.mockResolvedValue({ count: 7 });

    const badge = { criteria_key: "events_10" } as any;
    const result = await calculateBadgeProgress("user-123", badge, supabase);

    expect(result).toEqual({
      current: 7,
      target: 10,
      percent: 70,
      progressText: "7/10 events",
    });
  });

  test("caps progress percent at 99", async () => {
    const supabase = createMockSupabase();
    supabase._chain.eq.mockResolvedValue({ count: 9 });

    const badge = { criteria_key: "events_5" } as any;
    const result = await calculateBadgeProgress("user-123", badge, supabase);

    expect(result).toEqual({
      current: 9,
      target: 5,
      percent: 99,
      progressText: "9/5 events",
    });
  });

  test("calculates progress for all_rounder badge with no checkins", async () => {
    const supabase = createMockSupabase();
    // First call: event_checkins query returns empty
    supabase._chain.eq.mockResolvedValueOnce({ data: [] });

    const badge = { criteria_key: "all_rounder" } as any;
    const result = await calculateBadgeProgress("user-123", badge, supabase);

    expect(result).toEqual({
      current: 0,
      target: 5,
      percent: 0,
      progressText: "0/5 activity types",
    });
  });

  test("returns null for unknown criteria_key", async () => {
    const supabase = createMockSupabase();
    const badge = { criteria_key: "unknown_badge_type" } as any;

    const result = await calculateBadgeProgress("user-123", badge, supabase);
    expect(result).toBeNull();
  });
});
