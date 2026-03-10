import { buildBorderLookupByUserId, enrichReviewsWithBorders } from "../enrich-borders";

function createMockSupabase(overrides: Record<string, unknown> = {}) {
  const chainable = {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue({ data: [], error: null }),
    ...overrides,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/consistent-type-assertions
  return { from: vi.fn().mockReturnValue(chainable), _chain: chainable } as any;
}

describe("enrichReviewsWithBorders", () => {
  test("enriches reviews with border tier and color", async () => {
    const reviews = [
      { id: "r1", users: { full_name: "Alice", active_border_id: "border1" } },
      { id: "r2", users: { full_name: "Bob", active_border_id: null } },
    ];
    const borders = [{ id: "border1", tier: "epic", border_color: "#gold" }];
    const supabase = createMockSupabase({
      in: vi.fn().mockResolvedValue({ data: borders, error: null }),
    });

    const result = await enrichReviewsWithBorders(supabase, reviews);

    expect(result[0].users.active_border_tier).toBe("epic");
    expect(result[0].users.active_border_color).toBe("#gold");
    expect(result[1].users.active_border_tier).toBeNull();
    expect(result[1].users.active_border_color).toBeNull();
  });

  test("skips fetch when no reviews have border IDs", async () => {
    const reviews = [{ id: "r1", users: { full_name: "Alice", active_border_id: null } }];
    const supabase = createMockSupabase();

    const result = await enrichReviewsWithBorders(supabase, reviews);

    expect(supabase.from).not.toHaveBeenCalled();
    expect(result[0].users.active_border_tier).toBeNull();
  });

  test("returns empty array for empty input", async () => {
    const supabase = createMockSupabase();

    const result = await enrichReviewsWithBorders(supabase, []);

    expect(result).toEqual([]);
  });
});

describe("buildBorderLookupByUserId", () => {
  test("builds lookup keyed by user_id", async () => {
    const records = [
      { user_id: "u1", users: { active_border_id: "border1" } },
      { user_id: "u2", users: { active_border_id: "border2" } },
      { user_id: "u3", users: { active_border_id: null } },
    ];
    const borders = [
      { id: "border1", tier: "rare", border_color: "#blue" },
      { id: "border2", tier: "legendary", border_color: "#purple" },
    ];
    const supabase = createMockSupabase({
      in: vi.fn().mockResolvedValue({ data: borders, error: null }),
    });

    const result = await buildBorderLookupByUserId(supabase, records);

    expect(result.u1).toEqual({ tier: "rare", color: "#blue" });
    expect(result.u2).toEqual({ tier: "legendary", color: "#purple" });
    expect(result.u3).toBeUndefined();
  });

  test("returns empty object when no border IDs", async () => {
    const records = [{ user_id: "u1", users: { active_border_id: null } }];
    const supabase = createMockSupabase();

    const result = await buildBorderLookupByUserId(supabase, records);

    expect(result).toEqual({});
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test("returns empty object for empty input", async () => {
    const supabase = createMockSupabase();

    const result = await buildBorderLookupByUserId(supabase, []);

    expect(result).toEqual({});
  });
});
