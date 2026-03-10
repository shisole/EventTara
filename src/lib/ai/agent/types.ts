import { type SupabaseClient } from "@supabase/supabase-js";

import { type Database } from "@/lib/supabase/types";

/** Authenticated Supabase client passed to tools via closure */
export type AgentSupabaseClient = SupabaseClient<Database>;

/** Context passed to the agent factory — includes auth state and optional location */
export interface AgentContext {
  supabase: AgentSupabaseClient;
  userId: string | null;
  userName: string | null;
  userLocation: { lat: number; lng: number } | null;
}

/** SSE event types sent to the client */
export type SSEEvent =
  | { type: "token"; content: string }
  | { type: "tool_start"; name: string }
  | { type: "tool_result"; name: string; data: unknown }
  | { type: "done" }
  | { type: "error"; message: string };

/** Mini event for tool results (same shape as existing ChatEventCard) */
export interface MiniEventResult {
  id: string;
  title: string;
  type: string;
  date: string;
  location: string;
  price: number;
  cover_image_url: string | null;
}
