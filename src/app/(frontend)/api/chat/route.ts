import Anthropic from "@anthropic-ai/sdk";
import { type StreamEvent } from "@langchain/core/tracers/log_stream";
import { MemorySaver } from "@langchain/langgraph";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { createCocoAgent } from "@/lib/ai/agent";
import { executeEventSearch } from "@/lib/ai/agent/event-query-builder";
import { type SSEEvent } from "@/lib/ai/agent/types";
import {
  type ParsedSearchParams,
  buildSearchSystemPrompt,
  buildSuggestionPrompt,
} from "@/lib/ai/search-prompt";
import { isChatAgentV2Enabled } from "@/lib/cms/cached";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

// Hard daily cap per user/IP to prevent abuse (session limit is enforced client-side)
const DAILY_HARD_CAP = 30;

// Vercel serverless function timeout
export const maxDuration = 30;

// Shared checkpointer for in-session memory across requests (reset on cold start)
const agentCheckpointer = new MemorySaver();

function formatSSE(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(request: Request) {
  const supabase = await createClient();

  // Auth: get user, fallback to IP
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // Parse request body
  let message: string;
  let userLocation: { lat: number; lng: number } | undefined;
  let threadId: string | undefined;
  try {
    const body = await request.json();
    message = body.message;
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }
    if (message.length > 500) {
      return NextResponse.json({ error: "Message too long (max 500 characters)" }, { status: 400 });
    }
    if (typeof body.lat === "number" && typeof body.lng === "number") {
      userLocation = { lat: body.lat, lng: body.lng };
    }
    if (typeof body.threadId === "string") {
      threadId = body.threadId;
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Hard daily cap check
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();

  let countQuery = supabase
    .from("chat_queries")
    .select("id", { count: "exact", head: true })
    .gte("created_at", todayISO);

  countQuery = user ? countQuery.eq("user_id", user.id) : countQuery.eq("ip_address", ip);

  const { count: queryCount } = await countQuery;

  if ((queryCount ?? 0) >= DAILY_HARD_CAP) {
    return NextResponse.json(
      {
        error: "rate_limit",
        reply:
          "You've reached the maximum number of searches for today. Please try again tomorrow!",
      },
      { status: 429 },
    );
  }

  const apiKey = process.env.ANTHROPIC_CHAT_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Chat service not configured" }, { status: 503 });
  }

  // Feature flag: LangGraph agent v2 vs legacy
  const useAgentV2 = threadId && (await isChatAgentV2Enabled());

  if (useAgentV2) {
    return handleAgentRequest({
      message: message.trim(),
      threadId: threadId!,
      userId: user?.id ?? null,
      userName: user?.user_metadata?.full_name ?? null,
      userLocation: userLocation ?? null,
      supabase,
      ip,
    });
  }

  return handleLegacyRequest({
    message: message.trim(),
    userLocation,
    supabase,
    userId: user?.id ?? null,
    ip,
    apiKey,
  });
}

// ── LangGraph Agent Handler ─────────────────────────────────────────

interface AgentRequestParams {
  message: string;
  threadId: string;
  userId: string | null;
  userName: string | null;
  userLocation: { lat: number; lng: number } | null;
  supabase: Awaited<ReturnType<typeof createClient>>;
  ip: string;
}

async function handleAgentRequest(params: AgentRequestParams) {
  const { message, threadId, userId, userName, userLocation, supabase, ip } = params;

  const agent = createCocoAgent({
    ctx: { supabase, userId, userName, userLocation },
    checkpointer: agentCheckpointer,
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const eventStream = agent.streamEvents(
          { messages: [{ role: "user", content: message }] },
          {
            configurable: { thread_id: threadId },
            recursionLimit: 8,
            version: "v2",
          },
        );

        for await (const event of eventStream as AsyncIterable<StreamEvent>) {
          switch (event.event) {
            case "on_chat_model_stream": {
              const chunk = event.data?.chunk;
              if (chunk?.content && typeof chunk.content === "string") {
                controller.enqueue(
                  encoder.encode(formatSSE({ type: "token", content: chunk.content })),
                );
              }
              break;
            }
            case "on_tool_start": {
              controller.enqueue(
                encoder.encode(formatSSE({ type: "tool_start", name: event.name ?? "unknown" })),
              );
              break;
            }
            case "on_tool_end": {
              let data: unknown = null;
              try {
                data =
                  typeof event.data?.output === "string"
                    ? JSON.parse(event.data.output)
                    : event.data?.output;
              } catch {
                data = event.data?.output;
              }
              controller.enqueue(
                encoder.encode(
                  formatSSE({ type: "tool_result", name: event.name ?? "unknown", data }),
                ),
              );
              break;
            }
          }
        }

        controller.enqueue(encoder.encode(formatSSE({ type: "done" })));
      } catch (error) {
        console.error("[chat] Agent stream error:", error);
        controller.enqueue(
          encoder.encode(
            formatSSE({
              type: "error",
              message: "Sorry, something went wrong. Please try again.",
            }),
          ),
        );
      } finally {
        // Log query for analytics
        await supabase
          .from("chat_queries")
          .insert({
            user_id: userId,
            ip_address: userId ? null : ip,
            query: message,
            parsed_params: { agent: "v2", threadId } as unknown as Json,
            result_count: 0,
          })
          .then(({ error }) => {
            if (error) console.error("[chat] Failed to log query:", error.message);
          });

        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// ── Legacy Handler (unchanged behavior) ─────────────────────────────

interface LegacyRequestParams {
  message: string;
  userLocation?: { lat: number; lng: number };
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string | null;
  ip: string;
  apiKey: string;
}

async function handleLegacyRequest(params: LegacyRequestParams) {
  const { message, userLocation, supabase, userId, ip, apiKey } = params;

  const anthropic = new Anthropic({ apiKey });

  let parsed: ParsedSearchParams;
  try {
    const completion = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: buildSearchSystemPrompt(userLocation),
      messages: [{ role: "user", content: message }],
    });

    const text = completion.content[0].type === "text" ? completion.content[0].text : "";
    const cleaned = text
      .replace(/^```(?:json)?\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "")
      .trim();
    parsed = JSON.parse(cleaned) as ParsedSearchParams;
  } catch (error) {
    console.error("[chat] Haiku call or parse failed:", error);
    return NextResponse.json(
      {
        reply: "Sorry, I had trouble understanding that. Could you try rephrasing your search?",
        events: [],
        totalCount: 0,
        filterUrl: "/events",
      },
      { status: 200 },
    );
  }

  const result = await executeEventSearch({
    supabase,
    parsed,
    userLocation,
  });

  // Log query for rate limiting + analytics
  const { error: insertErr } = await supabase.from("chat_queries").insert({
    user_id: userId,
    ip_address: userId ? null : ip,
    query: message,
    parsed_params: parsed as unknown as Json,
    result_count: result.totalCount,
  });
  if (insertErr) {
    console.error("[chat] Failed to log query:", insertErr.message);
  }

  // When no results found, run fallback query
  if (result.totalCount === 0) {
    const today = new Date().toISOString().split("T")[0];
    let fallbackQ = supabase
      .from("events")
      .select("id, title, type, date, location, price, cover_image_url")
      .eq("status", "published")
      .gt("date", today);

    if (parsed.type) {
      fallbackQ = fallbackQ.eq("type", parsed.type);
    }
    if (parsed.search) {
      const pattern = parsed.search.trim().replaceAll(/\s+/g, "%");
      fallbackQ = fallbackQ.or(`title.ilike.%${pattern}%,location.ilike.%${pattern}%`);
    }

    fallbackQ = fallbackQ.order("date", { ascending: true }).limit(3);
    const { data: fallbackEvents } = await fallbackQ;

    if (fallbackEvents && fallbackEvents.length > 0) {
      try {
        const suggestionCompletion = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 200,
          system: buildSuggestionPrompt(message, parsed.type, fallbackEvents),
          messages: [{ role: "user", content: "Suggest the nearest events." }],
        });

        const suggestionText =
          suggestionCompletion.content[0].type === "text"
            ? suggestionCompletion.content[0].text
            : "";
        const cleanedSuggestion = suggestionText
          .replace(/^```(?:json)?\s*\n?/i, "")
          .replace(/\n?```\s*$/i, "")
          .trim();
        const suggestionParsed = JSON.parse(cleanedSuggestion) as { reply: string };

        const fallbackMini = fallbackEvents.map((e) => ({
          id: e.id,
          title: e.title,
          type: e.type,
          date: e.date,
          location: e.location,
          price: e.price,
          cover_image_url: e.cover_image_url,
        }));

        const fallbackFilterParts: string[] = [];
        if (parsed.type) fallbackFilterParts.push(`type=${parsed.type}`);
        if (parsed.search) fallbackFilterParts.push(`search=${encodeURIComponent(parsed.search)}`);
        fallbackFilterParts.push("when=upcoming");
        const fallbackFilterUrl = `/events?${fallbackFilterParts.join("&")}`;

        return NextResponse.json({
          reply: suggestionParsed.reply,
          events: fallbackMini,
          totalCount: fallbackEvents.length,
          filterUrl: fallbackFilterUrl,
        });
      } catch {
        // Fall through to generic empty response
      }
    }

    const searchTerm = parsed.search ?? message;
    return NextResponse.json({
      reply: `Sorry, but there are no results for "${searchTerm}". Try a different search or browse all events!`,
      events: [],
      totalCount: 0,
      filterUrl: result.filterUrl,
    });
  }

  return NextResponse.json({
    reply: parsed.reply,
    events: result.events,
    totalCount: result.totalCount,
    filterUrl: result.filterUrl,
  });
}
