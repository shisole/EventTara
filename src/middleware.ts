import { type NextRequest, NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Redirect logged-in users from landing page to home feed
  if (request.nextUrl.pathname === "/") {
    const hasSession = request.cookies.getAll().some((c) => c.name.includes("-auth-token"));
    if (hasSession) {
      return NextResponse.redirect(new URL("/home", request.url));
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    // eslint-disable-next-line unicorn/prefer-string-raw -- Next.js config.matcher requires plain string literals for static analysis
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
