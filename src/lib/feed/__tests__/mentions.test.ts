import { extractMentions } from "@/lib/feed/mentions";

describe("extractMentions", () => {
  test("extracts multiple mentions", () => {
    expect(extractMentions("@alice and @bob")).toEqual(["alice", "bob"]);
  });

  test("returns empty array when no mentions", () => {
    expect(extractMentions("no mentions here")).toEqual([]);
  });

  test("deduplicates repeated mentions", () => {
    expect(extractMentions("@alice @alice @bob")).toEqual(["alice", "bob"]);
  });

  test("extracts mention mid-sentence", () => {
    expect(extractMentions("Hello @world! How are you?")).toEqual(["world"]);
  });

  test("handles underscores in usernames", () => {
    expect(extractMentions("@under_score")).toEqual(["under_score"]);
  });

  test("returns empty array for empty string", () => {
    expect(extractMentions("")).toEqual([]);
  });
});
