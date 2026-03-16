import { test, expect } from "@playwright/test";

const ORGANIZER_STATE = "e2e/.auth/organizer.json";
const PARTICIPANT_STATE = "e2e/.auth/participant.json";

test.describe("Organizer + Participant booking flow", () => {
  let eventId: string;
  let eventTitle: string;
  let clubId: string;
  let clubSlug: string;

  test("full happy path: create → book → check-in → verify", async ({ browser }) => {
    test.setTimeout(90_000);

    const organizerContext = await browser.newContext({ storageState: ORGANIZER_STATE });
    const participantContext = await browser.newContext({ storageState: PARTICIPANT_STATE });

    // ── Step 1: Create club (events require a club) ─────────────────
    await test.step("Organizer creates club via API", async () => {
      const response = await organizerContext.request.post("/api/clubs", {
        data: {
          name: `E2E Test Club ${String(Date.now())}`,
          description: "Automated E2E test club — safe to delete.",
        },
      });

      expect(response.ok()).toBeTruthy();
      const body = (await response.json()) as { club: { id: string; slug: string } };
      clubId = body.club.id;
      clubSlug = body.club.slug;
      expect(clubId).toBeTruthy();
    });

    // ── Step 2: Create event via API ────────────────────────────────
    await test.step("Organizer creates event via API", async () => {
      const startDate = new Date(Date.now() + 47 * 60 * 60 * 1000);
      eventTitle = `E2E Test Event ${String(Date.now())}`;

      const response = await organizerContext.request.post("/api/events", {
        data: {
          club_id: clubId,
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

    // ── Step 3: Publish event via API ───────────────────────────────
    await test.step("Organizer publishes event", async () => {
      const response = await organizerContext.request.put(`/api/events/${eventId}`, {
        data: { status: "published" },
      });

      expect(response.ok()).toBeTruthy();
    });

    // ── Step 4: Verify event is published and accessible ─────────────
    await test.step("Participant can see published event via API", async () => {
      const response = await participantContext.request.get(`/api/events/${eventId}`);
      expect(response.ok()).toBeTruthy();
      const body = (await response.json()) as { event: { title: string; status: string } };
      expect(body.event.title).toBe(eventTitle);
      expect(body.event.status).toBe("published");
    });

    // ── Step 5: Participant books event via API ──────────────────────
    await test.step("Participant books event", async () => {
      const response = await participantContext.request.post("/api/bookings", {
        data: {
          event_id: eventId,
          payment_method: "free",
        },
      });

      expect(response.ok()).toBeTruthy();
      const body = (await response.json()) as {
        booking: { id: string; status: string; payment_status: string };
      };
      expect(body.booking.status).toBe("confirmed");
      expect(body.booking.payment_status).toBe("paid");
    });

    // ── Step 6: Participant self-checks-in from /my-events ─────────
    await test.step("Participant self-checks-in", async () => {
      const participantPage = await participantContext.newPage();

      await participantPage.goto("/my-events", { waitUntil: "domcontentloaded" });

      // Find the "Check In Online" button for our event
      const checkInButton = participantPage.getByRole("button", { name: /check in online/i });
      await expect(checkInButton).toBeVisible({ timeout: 15_000 });
      await checkInButton.click();

      // Should show "Checked In" status
      await expect(participantPage.getByText(/checked in/i).first()).toBeVisible({
        timeout: 15_000,
      });

      await participantPage.close();
    });

    // ── Step 7: Organizer sees check-in on dashboard ───────────────
    await test.step("Organizer sees check-in on dashboard", async () => {
      const organizerPage = await organizerContext.newPage();

      await organizerPage.goto(`/dashboard/events/${eventId}`, { waitUntil: "domcontentloaded" });

      // Participants table should show "Checked in" for the participant
      await expect(organizerPage.getByText("Checked in").first()).toBeVisible({
        timeout: 15_000,
      });

      await organizerPage.close();
    });

    // Cleanup contexts
    await organizerContext.close();
    await participantContext.close();
  });

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: ORGANIZER_STATE });

    // Delete event first (FK to club), then delete the club
    if (eventId) {
      await context.request.delete(`/api/events/${eventId}`);
    }
    if (clubSlug) {
      await context.request.delete(`/api/clubs/${clubSlug}`);
    }

    await context.close();
  });
});
