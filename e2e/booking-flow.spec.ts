import { test, expect } from "@playwright/test";

const ORGANIZER_STATE = "e2e/.auth/organizer.json";
const PARTICIPANT_STATE = "e2e/.auth/participant.json";

test.describe("Organizer + Participant booking flow", () => {
  let eventId: string;
  let eventTitle: string;

  test("full happy path: create → book → check-in → verify", async ({ browser }) => {
    const organizerContext = await browser.newContext({ storageState: ORGANIZER_STATE });
    const participantContext = await browser.newContext({ storageState: PARTICIPANT_STATE });

    // ── Step 1: Create event via API ──────────────────────────────
    await test.step("Organizer creates event via API", async () => {
      const startDate = new Date(Date.now() + 47 * 60 * 60 * 1000);
      eventTitle = `E2E Test Event ${String(Date.now())}`;

      const response = await organizerContext.request.post("/api/events", {
        data: {
          title: eventTitle,
          description: "Automated E2E test event — safe to delete.",
          type: "hiking",
          date: startDate.toISOString(),
          location: "Mt. Pulag, Benguet",
          max_participants: 20,
          price: 0,
          cover_image_url: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800",
        },
      });

      expect(response.ok()).toBeTruthy();
      const body = (await response.json()) as { event: { id: string } };
      eventId = body.event.id;
      expect(eventId).toBeTruthy();
    });

    // ── Step 2: Publish event via API ─────────────────────────────
    await test.step("Organizer publishes event", async () => {
      const response = await organizerContext.request.put(`/api/events/${eventId}`, {
        data: { status: "published" },
      });

      expect(response.ok()).toBeTruthy();
    });

    // ── Step 3: Participant finds event on /events ────────────────
    await test.step("Participant finds event on /events", async () => {
      const participantPage = await participantContext.newPage();

      await participantPage.goto("/events");
      await expect(participantPage.getByRole("heading", { level: 1 })).toBeVisible();

      // Look for our event card by title
      const eventCard = participantPage.getByRole("link", { name: eventTitle });
      await expect(eventCard).toBeVisible({ timeout: 10000 });
      await eventCard.click();

      // Should be on the event detail page
      await expect(participantPage).toHaveURL(new RegExp(`/events/${eventId}`));
      await expect(participantPage.getByRole("heading", { name: eventTitle })).toBeVisible();

      await participantPage.close();
    });

    // ── Step 4: Participant books event ───────────────────────────
    await test.step("Participant books event", async () => {
      const participantPage = await participantContext.newPage();

      await participantPage.goto(`/events/${eventId}/book`);

      // Free event — just click confirm
      const confirmButton = participantPage.getByRole("button", { name: /confirm booking/i });
      await expect(confirmButton).toBeVisible({ timeout: 10000 });
      await confirmButton.click();

      // Booking confirmation shows "You're In!"
      await expect(participantPage.getByText(/you're in/i)).toBeVisible({ timeout: 15000 });

      await participantPage.close();
    });

    // ── Step 5: Participant self-checks-in from /my-events ───────
    await test.step("Participant self-checks-in", async () => {
      const participantPage = await participantContext.newPage();

      await participantPage.goto("/my-events");

      // Find the "Check In Online" button for our event
      const checkInButton = participantPage.getByRole("button", { name: /check in online/i });
      await expect(checkInButton).toBeVisible({ timeout: 10000 });
      await checkInButton.click();

      // Should show "Checked In" status
      await expect(participantPage.getByText(/checked in/i).first()).toBeVisible({
        timeout: 10000,
      });

      await participantPage.close();
    });

    // ── Step 6: Organizer sees check-in on dashboard ─────────────
    await test.step("Organizer sees check-in on dashboard", async () => {
      const organizerPage = await organizerContext.newPage();

      await organizerPage.goto(`/dashboard/events/${eventId}`);

      // Participants table should show "Checked in" for the participant
      await expect(organizerPage.getByText("Checked in").first()).toBeVisible({ timeout: 10000 });

      await organizerPage.close();
    });

    // Cleanup contexts
    await organizerContext.close();
    await participantContext.close();
  });

  test.afterAll(async ({ browser }) => {
    if (!eventId) return;

    const context = await browser.newContext({ storageState: ORGANIZER_STATE });
    await context.request.delete(`/api/events/${eventId}`);
    await context.close();
  });
});
