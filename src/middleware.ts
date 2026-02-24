import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // eslint-disable-next-line unicorn/prefer-string-raw -- Next.js config.matcher requires plain string literals for static analysis
    "/((?!_next/static|_next/image|favicon.ico|admin|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
