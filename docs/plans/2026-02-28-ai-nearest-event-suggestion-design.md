# AI Nearest Event Suggestion Design

## Problem

When a user searches "lf hike next weekend" and no events match, the chat returns a generic "no results" message. Instead, the AI should suggest the nearest upcoming event for that activity type.

## Approach

Fallback query + second Claude call. Only triggers when the primary query returns 0 results — the happy path is unchanged.

## Flow

1. User sends query (e.g., "lf hike next weekend")
2. Claude parses into structured filters (type: hiking, dateFrom/dateTo: next weekend)
3. Primary query runs against events — returns 0 results
4. **Fallback query** runs:
   - Keep: activity type + location search term (if present in original query)
   - Drop: date range, distance, difficulty
   - Add: `when: "upcoming"` (future events only)
   - Order: `date ASC` (nearest first)
   - Limit: 3 events
5. If fallback also returns 0: respond with "no events of that type available"
6. If fallback returns events: **second Claude call** with suggestion prompt
7. Return fallback events + Claude's suggestion as the chat response

## Second Claude Call

Prompt context:

- Original user query
- What filters were applied (and found nothing)
- The 3 nearest upcoming events (title, date, location, price)

Claude crafts a natural reply like: "No hiking events next weekend, but there's Mt. Pulag Dayhike on March 22 in Benguet!"

## Response Shape

Same structure as normal responses — no frontend changes needed:

```typescript
{
  reply: string,          // Claude's suggestion message
  events: MiniEvent[],    // Fallback events (up to 3)
  totalCount: number,
  filterUrl: string       // Broader filter URL (type + upcoming)
}
```

## Location Handling

- If the user mentions a location ("hike in Cebu"), it's kept in the fallback query
- If no location mentioned, fallback searches all locations
- No browser geolocation

## Out of Scope

- Frontend/chat UI changes (existing components handle it)
- Changes to ParsedSearchParams interface
- Additional rate limiting (same request, not a new one)
- Caching suggestions
- Browser geolocation
