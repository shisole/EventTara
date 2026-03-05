# Drag-and-Drop Admin Panel Design

**Date:** 2026-03-05
**Feature:** Replace up/down arrow buttons with drag-and-drop reordering in admin panel
**Scope:** SectionOrderManager and HeroBannerManager components
**Library:** @dnd-kit (core + sortable + utilities)

---

## Overview

Replace the up/down arrow button controls in the admin panel with drag-and-drop reordering. This applies to both the homepage sections manager and the hero banner carousel manager for consistent UX across the admin interface.

---

## Architecture

### Dependencies

```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Package details:**

- `@dnd-kit/core` - Core drag-and-drop primitives
- `@dnd-kit/sortable` - Sortable list preset with animations
- `@dnd-kit/utilities` - Helper functions (arrayMove, CSS utilities)
- Bundle size: ~15kb gzipped
- React 19 compatible, actively maintained

### Components Affected

1. **SectionOrderManager.tsx** - Homepage sections reordering
2. **HeroBannerManager.tsx** - Hero carousel slide reordering

### What Changes

**Removed:**

- Up/down arrow `<button>` elements
- `moveSection()` and `moveSlide()` functions

**Added:**

- `<DndContext>` wrapper (dnd-kit provider)
- `<SortableContext>` wrapper (sortable list context)
- `useSortable` hook (per-item drag behavior)
- `handleDragEnd()` function (reorder on drop)
- Six-dot drag handle icon (⋮⋮)

**Preserved:**

- Toggle switches (enable/disable)
- Delete buttons (hero banners)
- Auto-save on change behavior
- Loading skeletons
- Error handling

### State Management

- Sections/slides remain in local `useState`
- Reorder happens optimistically (instant UI update)
- Auto-save API call triggers on drop
- If save fails: error message + revert to previous order

---

## Visual Design & Animations

### Drag States

**1. Idle State (before drag)**

- Six-dot grip icon in `text-gray-400`
- Normal row border and background
- Cursor: `cursor-grab` on handle hover
- Handle lightens on hover (`hover:text-gray-600`)

**2. Active Drag State (while dragging)**

Dragged item:

- Opacity: `opacity-50` (semi-transparent)
- Scale: `scale-105` (5% larger)
- Shadow: `shadow-lg` (elevated)
- Cursor: `cursor-grabbing`
- Z-index: Automatically elevated by dnd-kit

Drop zone placeholder:

- Border: `border-2 border-dashed border-lime-500`
- Background: `bg-lime-50/30 dark:bg-lime-950/20`
- Height: Matches dragged item (no layout shift)

**3. Drop Animation**

- Transition: `transition-all duration-200 ease-out`
- Item slides smoothly into final position
- Opacity fades to 100%
- Scale returns to 1.0
- Shadow fades out

### Animation Timing

| Action             | Duration | Easing      |
| ------------------ | -------- | ----------- |
| Drag start         | Instant  | -           |
| Reorder transition | 200ms    | ease-out    |
| Drop settle        | 150ms    | ease-in-out |

### Touch Support

- Works on mobile/tablet with native touch events
- No long-press required (immediate drag on touch-hold)
- Same visual feedback as desktop
- Smooth animations on iOS/Android

---

## Component Implementation

### SectionOrderManager.tsx Structure

```tsx
<DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  <SortableContext items={sections.map((s) => s.key)}>
    {sections.map((section, index) => (
      <SortableItem key={section.key} section={section} index={index} onToggle={toggleSection} />
    ))}
  </SortableContext>
</DndContext>
```

**SortableItem component:**

- Uses `useSortable({ id: section.key })` hook
- Applies transform/transition styles from hook
- Renders six-dot drag handle icon
- Keeps Toggle component in same position
- Handles disabled state during save

**handleDragEnd function:**

```tsx
const handleDragEnd = (event) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  const oldIndex = sections.findIndex((s) => s.key === active.id);
  const newIndex = sections.findIndex((s) => s.key === over.id);

  const reordered = arrayMove(sections, oldIndex, newIndex);
  const withUpdatedOrder = reordered.map((s, i) => ({ ...s, order: i }));

  setSections(withUpdatedOrder);
  save(withUpdatedOrder);
};
```

### HeroBannerManager.tsx Structure

Identical pattern:

- Wrap slides in `<DndContext>` + `<SortableContext>`
- Extract `SortableSlide` component with drag handle
- Replace `moveSlide()` with `handleDragEnd()`
- Keep delete button and image thumbnail

### Drag Handle Icon

```tsx
<svg
  className="w-4 h-4 text-gray-400 cursor-grab hover:text-gray-600"
  fill="currentColor"
  viewBox="0 0 16 16"
>
  <circle cx="4" cy="3" r="1.5" />
  <circle cx="4" cy="8" r="1.5" />
  <circle cx="4" cy="13" r="1.5" />
  <circle cx="10" cy="3" r="1.5" />
  <circle cx="10" cy="8" r="1.5" />
  <circle cx="10" cy="13" r="1.5" />
</svg>
```

Six-dot vertical grip pattern (⋮⋮)

---

## Interaction Flow

### Mouse/Trackpad Flow

1. **Hover over drag handle**
   - Cursor: `grab`
   - Icon lightens (hover state)

2. **Click and hold handle**
   - Cursor: `grabbing`
   - Row scales up 5%
   - Row becomes semi-transparent
   - Shadow appears

3. **Drag up or down**
   - Item follows cursor
   - Other items shift to show drop position
   - Placeholder with lime border appears
   - No scroll interference

4. **Release mouse**
   - Item animates to position (200ms)
   - Opacity/scale/shadow normalize
   - Array reorders instantly
   - Save API call triggers
   - If save fails: error banner + revert

### Keyboard Flow (Accessibility)

1. **Tab to row** - Focus on section/slide
2. **Press Space** - "Grab" item (announces to screen reader)
3. **Arrow keys (↑↓)** - Move position (announces new position)
4. **Press Space** - "Drop" item
5. **Auto-save** - Same as mouse flow

### Touch Flow (Mobile/Tablet)

1. **Touch and hold handle** - Item lifts (same visual feedback)
2. **Drag finger** - Item follows, others shift
3. **Release** - Drop and save

---

## Edge Cases & Error Handling

### Boundary Conditions

- **First item drag up:** No-op (can't move above 0)
- **Last item drag down:** No-op (can't move below last)
- **Drag over non-droppable area:** Returns to original position

### During Save

- `saving={true}` state: `opacity-60 pointer-events-none`
- User cannot drag while save is in progress
- Prevents race conditions

### Save Failures

- Red error banner appears at top
- Order reverts to last known good state
- User can retry drag operation
- Error message: "Failed to save changes."

### Concurrent Operations

- Only one drag operation allowed at a time
- Toggle/delete still work when not dragging
- Save queue (one at a time, no conflicts)

---

## Technical Details

### Collision Detection

- Algorithm: `closestCenter` from `@dnd-kit/core`
- Best for vertical lists (predictable drop targeting)
- No custom collision logic needed

### Performance

- Zero re-renders during drag (CSS transform-based)
- Optimistic updates (instant UI feedback)
- Single API call per drag operation
- No scroll jank or layout thrashing

### CSS Strategy

- Use existing Tailwind utilities only
- No custom CSS files needed
- Leverage `cn()` helper for conditional classes
- Transition classes: `transition-all duration-200 ease-out`

### Type Safety

```typescript
// Properly typed sortable hook
const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
  id: section.key,
});

// Type-safe array reordering
const reordered = arrayMove<CmsHomepageSection>(sections, oldIndex, newIndex);
```

---

## Testing Checklist

### Functional Tests

- [ ] Drag section/slide up
- [ ] Drag section/slide down
- [ ] Drop in first position
- [ ] Drop in last position
- [ ] Drop in middle position
- [ ] Drag same item multiple times
- [ ] Save triggers automatically on drop
- [ ] Error handling if save fails (network error)
- [ ] Toggle switch works independently
- [ ] Delete button works (hero banners)
- [ ] Loading skeleton on initial load

### Keyboard Accessibility

- [ ] Tab navigation works
- [ ] Space to grab/drop
- [ ] Arrow keys to reorder
- [ ] Screen reader announces positions
- [ ] Focus visible on active item

### Touch Devices

- [ ] Works on iOS Safari
- [ ] Works on Android Chrome
- [ ] Drag feels responsive (no lag)
- [ ] No accidental scrolling during drag

### Animations

- [ ] Smooth drag start (no jank)
- [ ] Items shift smoothly during drag
- [ ] Drop animation is smooth
- [ ] No flicker or layout shift
- [ ] Placeholder appears correctly

### Browser Compatibility

- [ ] Chrome (desktop + mobile)
- [ ] Safari (desktop + iOS)
- [ ] Firefox
- [ ] Edge

---

## Success Criteria

1. **UX:** Drag feels smooth and responsive (no lag/jank)
2. **Visual:** Animations match design (200ms transitions)
3. **Accessibility:** Keyboard users can reorder items
4. **Mobile:** Touch drag works on phones/tablets
5. **Reliability:** Save triggers correctly, errors handled gracefully
6. **Consistency:** Both sections and hero banners use same pattern

---

## Future Enhancements (Out of Scope)

- Multi-select drag (select multiple items, drag together)
- Undo/redo for reordering
- Drag-to-delete (drag to trash icon)
- Copy/duplicate via drag
- Nested sortable lists (sections with sub-sections)

---

## References

- [@dnd-kit Documentation](https://docs.dndkit.com/)
- [Sortable preset guide](https://docs.dndkit.com/presets/sortable)
- [Accessibility features](https://docs.dndkit.com/guides/accessibility)
