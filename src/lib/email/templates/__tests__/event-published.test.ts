import { eventPublishedHtml } from "../event-published";

const baseProps = {
  userName: "Juan",
  eventTitle: "Mt. Pulag Sunrise Hike",
  eventDate: "Sat, Mar 15, 2026",
  eventLocation: "Benguet",
  eventType: "hiking",
  clubName: "Trail Blazers PH",
  eventId: "evt-123",
};

describe("eventPublishedHtml", () => {
  test("contains event title", () => {
    const html = eventPublishedHtml(baseProps);
    expect(html).toContain("Mt. Pulag Sunrise Hike");
  });

  test("contains club name", () => {
    const html = eventPublishedHtml(baseProps);
    expect(html).toContain("Trail Blazers PH");
  });

  test("contains CTA link to event page", () => {
    const html = eventPublishedHtml(baseProps);
    expect(html).toContain("/events/evt-123");
  });

  test("contains user name in greeting", () => {
    const html = eventPublishedHtml(baseProps);
    expect(html).toContain("Hey Juan");
  });

  test("maps activity type to label", () => {
    const html = eventPublishedHtml(baseProps);
    expect(html).toContain("Hiking");
  });

  test("contains event date and location", () => {
    const html = eventPublishedHtml(baseProps);
    expect(html).toContain("Sat, Mar 15, 2026");
    expect(html).toContain("Benguet");
  });
});
