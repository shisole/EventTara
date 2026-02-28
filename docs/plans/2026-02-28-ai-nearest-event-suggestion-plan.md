# AI Nearest Event Suggestion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** When the AI chat returns 0 results for a query like "lf hike next weekend", run a fallback query to find the nearest upcoming events of that activity type and have Claude suggest them naturally.

**Architecture:** Modify only the `/api/chat` route. When the primary query returns 0 events, run a broader fallback query (keep type + search, drop date/distance/difficulty filters), then make a second Claude call with those events as context to generate a natural suggestion. The response shape stays identical — no frontend changes.

**Tech Stack:** TypeScript, Next.js API route, Anthropic Claude Haiku, Supabase

---

### Task 1: Add the suggestion prompt builder

**Files:**

- Modify: `src/lib/ai/search-prompt.ts`

**Step 1: Add the suggestion prompt function**

At the bottom of `src/lib/ai/search-prompt.ts` (after `buildSearchSystemPrompt`), add:

```typescript
interface SuggestionEvent {
  title: string;
  date: string;
  location: string;
  price: number;
}

export function buildSuggestionPrompt(
  userQuery: string,
  activityType: string | undefined,
  events: SuggestionEvent[],
): string {
  const eventList = events
    .map((e) => {
      const date = new Date(e.date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const price = e.price === 0 ? "Free" : `₱${e.price}`;
      return `- "${e.title}" on ${date} in ${e.location} (${price})`;
    })
    .join("\n");

  const typeLabel = activityType?.replace("_", " ") ?? "outdoor";

  return `You are EventTara's search assistant. The user searched for ${typeLabel} events but nothing matched their specific criteria.

User's original query: "${userQuery}"

Here are the nearest upcoming ${typeLabel} events available:
${eventList}

Write a short, friendly 1-2 sentence response that:
1. Acknowledges nothing matched their specific request
2. Suggests the nearest event(s) from the list above — mention the event name, date, and location
3. Sounds natural and helpful, not robotic

Return ONLY valid JSON: { "reply": "your response here" }
Do not use markdown code blocks.`;
}
```

**Step 2: Verify the file compiles**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/ai/search-prompt.ts
git commit -m "feat: add AI suggestion prompt builder for empty search results"
```

---

### Task 2: Add fallback query and second Claude call to chat route

**Files:**

- Modify: `src/app/(frontend)/api/chat/route.ts`

**Step 1: Add the import**

At line 6 of the file, update the import to also include `buildSuggestionPrompt`:

Change:

```typescript
import { buildSearchSystemPrompt } from "@/lib/ai/search-prompt";
import type { ParsedSearchParams } from "@/lib/ai/search-prompt";
```

To:

```typescript
import { buildSearchSystemPrompt, buildSuggestionPrompt } from "@/lib/ai/search-prompt";
import type { ParsedSearchParams } from "@/lib/ai/search-prompt";
```

**Step 2: Replace the no-results handling**

In the chat route, find the section at lines 292-297 that handles no results:

```typescript
// Adjust reply when no results found
const searchTerm = parsed.search ?? message.trim();
const reply =
  count === 0
    ? `Sorry, but there are no results for "${searchTerm}". Try a different search or browse all events!`
    : parsed.reply;
```

Replace it with the fallback logic. The entire block from line 292 to line 304 (`return NextResponse.json(...)`) should be replaced with:

````typescript
// When no results found, run fallback query and suggest nearest events
if (count === 0) {
  // Fallback: keep type + search, drop date/distance/difficulty, find nearest upcoming
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
    // Second Claude call to generate a natural suggestion
    try {
      const suggestionCompletion = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        system: buildSuggestionPrompt(message.trim(), parsed.type, fallbackEvents),
        messages: [{ role: "user", content: "Suggest the nearest events." }],
      });

      const suggestionText =
        suggestionCompletion.content[0].type === "text" ? suggestionCompletion.content[0].text : "";
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

      // Build broader filter URL for "View all results"
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
      // If suggestion call fails, fall through to generic empty response
    }
  }

  // No fallback events found either, or suggestion call failed
  const searchTerm = parsed.search ?? message.trim();
  return NextResponse.json({
    reply: `Sorry, but there are no results for "${searchTerm}". Try a different search or browse all events!`,
    events: [],
    totalCount: 0,
    filterUrl,
  });
}

return NextResponse.json({
  reply: parsed.reply,
  events: miniEvents,
  totalCount: count,
  filterUrl,
});
````

**Step 3: Also handle the early return for empty distance results**

Find the early return at lines 194-200 (inside the `distanceEventIds.length === 0` block):

```typescript
const searchTerm = parsed.search ?? message.trim();
return NextResponse.json({
  reply: `Sorry, but there are no results for "${searchTerm}". Try a different search or browse all events!`,
  events: [],
  totalCount: 0,
  filterUrl: emptyFilterUrl,
});
```

This is a separate early return that also produces 0 results. For now, leave it as-is — the distance filter is very specific and a fallback suggestion here would be confusing (suggesting events with different distances). We can add fallback for distance filters later if needed.

**Step 4: Verify the file compiles**

Run: `pnpm typecheck`
Expected: PASS

**Step 5: Run lint**

Run: `pnpm lint`
Expected: PASS

**Step 6: Commit**

```bash
git add src/app/(frontend)/api/chat/route.ts
git commit -m "feat: suggest nearest events when AI search returns no results"
```

---

### Task 3: Build and final verification

**Step 1: Run full type check**

Run: `pnpm typecheck`
Expected: PASS

**Step 2: Run full lint**

Run: `pnpm lint`
Expected: PASS

**Step 3: Run production build**

Run: `pnpm build`
Expected: PASS

**Step 4: Commit any remaining changes**

If format/lint auto-fixed anything:

```bash
git add -A
git commit -m "chore: lint/format fixes"
```
