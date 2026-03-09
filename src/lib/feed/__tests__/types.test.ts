import { EMOJI_ICON, type ActivityType, type FeedItem } from "../types";

describe("ActivityType", () => {
  test("includes all expected activity types", () => {
    const types: ActivityType[] = ["booking", "checkin", "badge", "border", "review"];

    // Verify each is assignable to ActivityType (compile-time check enforced by TS)
    for (const t of types) {
      expect(typeof t).toBe("string");
    }
    expect(types).toHaveLength(5);
  });
});

describe("FeedItem", () => {
  test("review fields are present on FeedItem shape", () => {
    const item: Pick<FeedItem, "reviewRating" | "reviewText" | "activityType"> = {
      activityType: "review",
      reviewRating: 5,
      reviewText: "Great event!",
    };

    expect(item.reviewRating).toBe(5);
    expect(item.reviewText).toBe("Great event!");
    expect(item.activityType).toBe("review");
  });

  test("review fields can be null for non-review activities", () => {
    const item: Pick<FeedItem, "reviewRating" | "reviewText" | "activityType"> = {
      activityType: "booking",
      reviewRating: null,
      reviewText: null,
    };

    expect(item.reviewRating).toBeNull();
    expect(item.reviewText).toBeNull();
  });
});

describe("EMOJI_ICON", () => {
  test("is green heart emoji", () => {
    expect(EMOJI_ICON).toBe("\u{1F49A}");
  });
});
