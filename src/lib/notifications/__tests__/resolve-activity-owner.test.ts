import { resolveActivityOwner } from "../resolve-activity-owner";

function createMockSupabase(overrides: Record<string, unknown> = {}) {
  const chainable = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    ...overrides,
  };
  return { from: vi.fn().mockReturnValue(chainable), _chain: chainable } as any;
}

describe("resolveActivityOwner", () => {
  test("resolves booking owner", async () => {
    const supabase = createMockSupabase();
    supabase._chain.single.mockResolvedValue({ data: { user_id: "user-1" } });

    const result = await resolveActivityOwner(supabase, "booking", "booking-id");
    expect(supabase.from).toHaveBeenCalledWith("bookings");
    expect(result).toBe("user-1");
  });

  test("resolves checkin owner", async () => {
    const supabase = createMockSupabase();
    supabase._chain.single.mockResolvedValue({ data: { user_id: "user-2" } });

    const result = await resolveActivityOwner(supabase, "checkin", "checkin-id");
    expect(supabase.from).toHaveBeenCalledWith("event_checkins");
    expect(result).toBe("user-2");
  });

  test("resolves badge owner", async () => {
    const supabase = createMockSupabase();
    supabase._chain.single.mockResolvedValue({ data: { user_id: "user-3" } });

    const result = await resolveActivityOwner(supabase, "badge", "badge-id");
    expect(supabase.from).toHaveBeenCalledWith("user_badges");
    expect(result).toBe("user-3");
  });

  test("resolves border owner", async () => {
    const supabase = createMockSupabase();
    supabase._chain.single.mockResolvedValue({ data: { user_id: "user-4" } });

    const result = await resolveActivityOwner(supabase, "border", "border-id");
    expect(supabase.from).toHaveBeenCalledWith("user_avatar_borders");
    expect(result).toBe("user-4");
  });

  test("resolves review owner", async () => {
    const supabase = createMockSupabase();
    supabase._chain.single.mockResolvedValue({ data: { user_id: "user-5" } });

    const result = await resolveActivityOwner(supabase, "review", "review-id");
    expect(supabase.from).toHaveBeenCalledWith("event_reviews");
    expect(result).toBe("user-5");
  });

  test("resolves new_club owner via club_members", async () => {
    const supabase = createMockSupabase();
    supabase._chain.maybeSingle.mockResolvedValue({ data: { user_id: "owner-1" } });

    const result = await resolveActivityOwner(supabase, "new_club", "club-id");
    expect(supabase.from).toHaveBeenCalledWith("club_members");
    expect(result).toBe("owner-1");
  });

  test("resolves new_event owner via event → club_members", async () => {
    const eventChainable = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { club_id: "club-1" } }),
    };
    const memberChainable = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { user_id: "owner-2" } }),
    };
    let callCount = 0;
    const supabase = {
      from: vi.fn().mockImplementation(() => {
        callCount++;
        return callCount === 1 ? eventChainable : memberChainable;
      }),
    } as any;

    const result = await resolveActivityOwner(supabase, "new_event", "event-id");
    expect(supabase.from).toHaveBeenCalledWith("events");
    expect(supabase.from).toHaveBeenCalledWith("club_members");
    expect(result).toBe("owner-2");
  });

  test("returns null when no data found", async () => {
    const supabase = createMockSupabase();
    supabase._chain.single.mockResolvedValue({ data: null });

    const result = await resolveActivityOwner(supabase, "booking", "missing-id");
    expect(result).toBeNull();
  });
});
