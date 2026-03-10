import { type Page, test as setup, expect } from "@playwright/test";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const ORGANIZER = {
  email: "organizer1@test.eventtara.com",
  password: "TestPass123!",
  storageState: "e2e/.auth/organizer.json",
};

const PARTICIPANT = {
  email: "participant1@test.eventtara.com",
  password: "TestPass123!",
  storageState: "e2e/.auth/participant.json",
};

/**
 * Sign in via the Supabase GoTrue API directly, then set session cookies
 * on the browser context. This bypasses the login UI for reliable CI auth.
 */
async function login(page: Page, email: string, password: string) {
  // Sign in via Supabase auth API
  const response = await page.request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    data: { email, password },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Supabase auth failed for ${email}: ${String(response.status())} ${body}`);
  }

  const session: Record<string, unknown> = await response.json();

  // Build cookies matching @supabase/ssr format (raw JSON, chunked at 3180 chars)
  const projectRef = new URL(SUPABASE_URL).hostname.split(".")[0];
  const cookieName = `sb-${projectRef}-auth-token`;
  const sessionJson = JSON.stringify(session);
  const CHUNK_SIZE = 3180;

  const cookies: {
    name: string;
    value: string;
    domain: string;
    path: string;
    sameSite: "Lax";
  }[] = [];

  if (sessionJson.length <= CHUNK_SIZE) {
    cookies.push({
      name: cookieName,
      value: sessionJson,
      domain: "localhost",
      path: "/",
      sameSite: "Lax",
    });
  } else {
    for (let i = 0; i * CHUNK_SIZE < sessionJson.length; i++) {
      cookies.push({
        name: `${cookieName}.${String(i)}`,
        value: sessionJson.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
        domain: "localhost",
        path: "/",
        sameSite: "Lax",
      });
    }
  }

  await page.context().addCookies(cookies);

  // Dismiss the onboarding quiz modal
  await page.addInitScript(() => localStorage.setItem("quiz_completed", "true"));

  // Verify auth works by navigating to a protected-ish page
  await page.goto("/events");
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
}

setup("authenticate organizer", async ({ page }) => {
  await login(page, ORGANIZER.email, ORGANIZER.password);
  await page.context().storageState({ path: ORGANIZER.storageState });
});

setup("authenticate participant", async ({ page }) => {
  await login(page, PARTICIPANT.email, PARTICIPANT.password);
  await page.context().storageState({ path: PARTICIPANT.storageState });
});
