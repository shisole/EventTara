import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    String.raw`/((?!_next/static|_next/image|favicon.ico|admin|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)`,
  ],
};
