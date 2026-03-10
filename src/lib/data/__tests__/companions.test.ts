import { fetchCompanionsByBooking } from "../companions";

function createMockSupabase(companions: unknown[] | null) {
  const chainable = {
    select: vi.fn().mockReturnThis(),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    in: vi.fn().mockResolvedValue({ data: companions, error: null }),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/consistent-type-assertions
  return { from: vi.fn().mockReturnValue(chainable), _chain: chainable } as any;
}

describe("fetchCompanionsByBooking", () => {
  test("groups companions by booking_id", async () => {
    const companions = [
      { booking_id: "b1", full_name: "Alice", qr_code: "qr1" },
      { booking_id: "b1", full_name: "Bob", qr_code: "qr2" },
      { booking_id: "b2", full_name: "Charlie", qr_code: "qr3" },
    ];
    const supabase = createMockSupabase(companions);

    const result = await fetchCompanionsByBooking<{
      booking_id: string;
      full_name: string;
      qr_code: string;
    }>(supabase, ["b1", "b2"], "booking_id, full_name, qr_code");

    expect(Object.keys(result)).toHaveLength(2);
    expect(result.b1).toHaveLength(2);
    expect(result.b2).toHaveLength(1);
    expect(result.b1[0].full_name).toBe("Alice");
  });

  test("returns empty object for empty bookingIds", async () => {
    const supabase = createMockSupabase([]);

    const result = await fetchCompanionsByBooking(supabase, [], "booking_id, full_name");

    expect(result).toEqual({});
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test("returns empty object when supabase returns null", async () => {
    const supabase = createMockSupabase(null);

    const result = await fetchCompanionsByBooking(supabase, ["b1"], "booking_id, full_name");

    expect(result).toEqual({});
  });

  test("passes correct columns to select", async () => {
    const supabase = createMockSupabase([]);

    await fetchCompanionsByBooking(supabase, ["b1"], "id, booking_id, full_name, status");

    expect(supabase._chain.select).toHaveBeenCalledWith("id, booking_id, full_name, status");
  });
});
