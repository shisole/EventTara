import { createServerClient } from "@supabase/ssr";
import { createClient as createBrowserClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { type Database } from "./types";

/**
 * Service-role client for server-only background jobs (cron, webhooks).
 * Bypasses RLS — no cookies/session needed.
 */
export function createServiceClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet)
              cookieStore.set(name, value, options);
          } catch {
            // setAll called from Server Component - ignored, middleware handles it
          }
        },
      },
    },
  );
}
