# Drag-and-Drop Admin Panel Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace up/down arrow buttons with drag-and-drop reordering in admin panel (sections + hero banners)

**Architecture:** Use @dnd-kit library with `<DndContext>` and `<SortableContext>` wrappers. Extract sortable item components with `useSortable` hook. Replace `moveSection()`/`moveSlide()` with `handleDragEnd()` using `arrayMove` utility.

**Tech Stack:** @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, React 19, TypeScript, Tailwind CSS

---

## Task 1: Install @dnd-kit dependencies

**Files:**

- Modify: `package.json` (dependencies section)

**Step 1: Install the three @dnd-kit packages**

Run:

```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Expected output:

```
dependencies:
+ @dnd-kit/core <version>
+ @dnd-kit/sortable <version>
+ @dnd-kit/utilities <version>
```

**Step 2: Verify installation**

Run: `pnpm list @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
Expected: All three packages listed with versions

**Step 3: Verify typecheck still passes**

Run: `pnpm typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add @dnd-kit dependencies for drag-and-drop admin UI"
```

---

## Task 2: Create reusable DragHandle icon component

**Files:**

- Create: `src/components/icons/DragHandle.tsx`
- Modify: `src/components/icons/index.ts`

**Step 1: Create the DragHandle icon component**

Create `src/components/icons/DragHandle.tsx`:

```tsx
interface DragHandleProps {
  className?: string;
}

export default function DragHandle({ className = "w-4 h-4" }: DragHandleProps) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 16 16" aria-label="Drag to reorder">
      <circle cx="4" cy="3" r="1.5" />
      <circle cx="4" cy="8" r="1.5" />
      <circle cx="4" cy="13" r="1.5" />
      <circle cx="10" cy="3" r="1.5" />
      <circle cx="10" cy="8" r="1.5" />
      <circle cx="10" cy="13" r="1.5" />
    </svg>
  );
}
```

**Step 2: Export from icons barrel**

Add to `src/components/icons/index.ts`:

```typescript
export { default as DragHandle } from "./DragHandle";
```

**Step 3: Verify typecheck**

Run: `pnpm typecheck`
Expected: PASS (no errors)

**Step 4: Verify lint**

Run: `pnpm lint`
Expected: PASS (no errors)

**Step 5: Commit**

```bash
git add src/components/icons/DragHandle.tsx src/components/icons/index.ts
git commit -m "feat: add DragHandle icon component for drag-and-drop UI"
```

---

## Task 3: Refactor SectionOrderManager with drag-and-drop

**Files:**

- Modify: `src/components/admin/SectionOrderManager.tsx`

**Step 1: Add imports at top of file**

Add these imports after existing imports:

```tsx
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { DragHandle } from "@/components/icons";
```

**Step 2: Extract SortableItem component (add before main component)**

Add this new component before `export default function SectionOrderManager()`:

```tsx
interface SortableItemProps {
  section: CmsHomepageSection;
  index: number;
  onToggle: (index: number, enabled: boolean) => void;
  disabled: boolean;
}

function SortableItem({ section, index, onToggle, disabled }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.key,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between rounded-xl border px-4 py-3 transition-all duration-200",
        isDragging && "opacity-50 scale-105 shadow-lg z-50",
        section.enabled
          ? "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
          : "border-gray-100 bg-gray-50 dark:border-gray-800/50 dark:bg-gray-900/50",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
          aria-label="Drag to reorder"
        >
          <DragHandle className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono text-gray-400 dark:text-gray-500 w-5 text-right shrink-0">
          {index + 1}
        </span>
        <span
          className={cn(
            "font-medium text-sm",
            section.enabled ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500",
          )}
        >
          {section.label}
        </span>
      </div>

      <Toggle checked={section.enabled} onChange={(v) => onToggle(index, v)} />
    </div>
  );
}
```

**Step 3: Replace moveSection with handleDragEnd**

Inside `SectionOrderManager`, remove the `moveSection` function and replace with:

```tsx
const handleDragEnd = useCallback(
  (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.key === active.id);
    const newIndex = sections.findIndex((s) => s.key === over.id);

    const reordered = arrayMove(sections, oldIndex, newIndex);
    const withUpdatedOrder = reordered.map((s, i) => ({ ...s, order: i }));

    setSections(withUpdatedOrder);
    void save(withUpdatedOrder);
  },
  [sections, save],
);
```

**Step 4: Add sensor configuration**

Add after the `handleDragEnd` function:

```tsx
const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  }),
);
```

**Step 5: Replace the render section**

Replace the existing `<div className={cn("space-y-2", ...)}>` section with:

```tsx
<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  <SortableContext items={sections.map((s) => s.key)} strategy={verticalListSortingStrategy}>
    <div className="space-y-2">
      {sections.map((section, index) => (
        <SortableItem
          key={section.key}
          section={section}
          index={index}
          onToggle={toggleSection}
          disabled={saving}
        />
      ))}
    </div>
  </SortableContext>
</DndContext>
```

**Step 6: Verify typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 7: Verify lint**

Run: `pnpm lint`
Expected: PASS

**Step 8: Visual test - drag sections**

Run: `pnpm dev`
Navigate to: `http://localhost:3001/admin/sections`

Test:

- [ ] Drag handle visible (six-dot icon)
- [ ] Cursor changes to grab on hover
- [ ] Drag section up/down works
- [ ] Item becomes semi-transparent while dragging
- [ ] Smooth drop animation
- [ ] Order saves automatically
- [ ] Toggle still works

**Step 9: Commit**

```bash
git add src/components/admin/SectionOrderManager.tsx
git commit -m "feat: replace arrows with drag-and-drop in SectionOrderManager

- Add DndContext and SortableContext wrappers
- Extract SortableItem component with useSortable hook
- Replace moveSection with handleDragEnd using arrayMove
- Add keyboard sensor for accessibility
- Smooth animations with CSS transforms"
```

---

## Task 4: Refactor HeroBannerManager with drag-and-drop

**Files:**

- Modify: `src/components/admin/HeroBannerManager.tsx`

**Step 1: Add imports at top of file**

Add these imports after existing imports:

```tsx
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { DragHandle } from "@/components/icons";
```

**Step 2: Extract SortableSlide component (add before main component)**

Add this new component before `export default function HeroBannerManager()`:

```tsx
interface Slide {
  url: string;
  alt: string;
}

interface SortableSlideProps {
  slide: Slide;
  index: number;
  onRemove: (index: number) => void;
  disabled: boolean;
}

function SortableSlide({ slide, index, onRemove, disabled }: SortableSlideProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `${slide.url}-${index}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 transition-all duration-200",
        isDragging && "opacity-50 scale-105 shadow-lg z-50",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 shrink-0"
        aria-label="Drag to reorder"
      >
        <DragHandle className="w-4 h-4" />
      </button>

      <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
        <Image src={slide.url} alt={slide.alt} fill className="object-cover" sizes="112px" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{slide.alt}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{slide.url}</p>
      </div>

      <button
        type="button"
        onClick={() => onRemove(index)}
        className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
        title="Remove slide"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
```

**Step 3: Replace moveSlide with handleDragEnd**

Inside `HeroBannerManager`, remove the `moveSlide` function and replace with:

```tsx
const handleDragEnd = useCallback(
  (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = slides.findIndex((s, i) => `${s.url}-${i}` === active.id);
    const newIndex = slides.findIndex((s, i) => `${s.url}-${i}` === over.id);

    const reordered = arrayMove(slides, oldIndex, newIndex);
    setSlides(reordered);
    void save(reordered);
  },
  [slides, save],
);
```

**Step 4: Add sensor configuration**

Add after the `handleDragEnd` function:

```tsx
const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  }),
);
```

**Step 5: Replace the render section**

Replace the existing `<div className={cn("space-y-3", ...)}>` section with:

```tsx
<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  <SortableContext
    items={slides.map((s, i) => `${s.url}-${i}`)}
    strategy={verticalListSortingStrategy}
  >
    <div className="space-y-3">
      {slides.map((slide, index) => (
        <SortableSlide
          key={`${slide.url}-${index}`}
          slide={slide}
          index={index}
          onRemove={removeSlide}
          disabled={saving}
        />
      ))}
    </div>
  </SortableContext>
</DndContext>
```

**Step 6: Verify typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 7: Verify lint**

Run: `pnpm lint`
Expected: PASS

**Step 8: Visual test - drag hero slides**

Run: `pnpm dev`
Navigate to: `http://localhost:3001/admin/hero`

Test:

- [ ] Drag handle visible (six-dot icon)
- [ ] Cursor changes to grab on hover
- [ ] Drag slide up/down works
- [ ] Item becomes semi-transparent while dragging
- [ ] Smooth drop animation
- [ ] Order saves automatically
- [ ] Delete button still works
- [ ] Image thumbnails display correctly

**Step 9: Commit**

```bash
git add src/components/admin/HeroBannerManager.tsx
git commit -m "feat: replace arrows with drag-and-drop in HeroBannerManager

- Add DndContext and SortableContext wrappers
- Extract SortableSlide component with useSortable hook
- Replace moveSlide with handleDragEnd using arrayMove
- Add keyboard sensor for accessibility
- Maintain delete button and image thumbnails"
```

---

## Task 5: Manual testing and verification

**Files:** None (testing only)

**Step 1: Test keyboard accessibility**

Navigate to: `http://localhost:3001/admin/sections`

Keyboard test:

- [ ] Tab to a section row
- [ ] Press Space to "grab" (focus should indicate active)
- [ ] Press Arrow Down to move down
- [ ] Press Arrow Up to move up
- [ ] Press Space to "drop"
- [ ] Order should save automatically

Repeat for: `http://localhost:3001/admin/hero`

**Step 2: Test touch on mobile simulator**

Open Chrome DevTools → Toggle device toolbar (mobile view)

Navigate to: `http://localhost:3001/admin/sections`

Touch test:

- [ ] Tap and hold drag handle
- [ ] Drag finger up/down
- [ ] Release to drop
- [ ] No accidental scrolling during drag

Repeat for: `http://localhost:3001/admin/hero`

**Step 3: Test animations**

Watch for these during drag operations:

- [ ] Drag start is instant (no delay)
- [ ] Item scales up slightly (5%) while dragging
- [ ] Item has semi-transparent opacity while dragging
- [ ] Drop animation is smooth (200ms)
- [ ] No layout shift or jank
- [ ] Other items shift smoothly to show drop position

**Step 4: Test error handling**

1. Open Network tab in DevTools
2. Set throttling to "Offline"
3. Drag a section/slide
4. Should see error banner: "Failed to save changes."
5. Order should revert to previous state
6. Turn network back online
7. Retry drag - should work

**Step 5: Test concurrent operations**

- [ ] Toggle a section while NOT dragging - works
- [ ] Try to drag while save is in progress - disabled
- [ ] Delete a hero slide while NOT dragging - works

**Step 6: Cross-browser test**

Test in these browsers (if available):

- [ ] Chrome/Edge (primary)
- [ ] Safari
- [ ] Firefox

**Step 7: Run full lint and typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: Both PASS

**Step 8: Final commit (if any fixes needed)**

If you made any adjustments during testing:

```bash
git add <changed-files>
git commit -m "fix: address edge cases found in drag-and-drop testing"
```

---

## Task 6: Create feature branch and prepare for PR

**Files:** None (git operations only)

**Step 1: Verify current branch**

Run: `git status`
Expected: On branch `main` (or feature branch)

If on `main`, create feature branch:

```bash
git checkout -b feat/drag-drop-admin
```

**Step 2: Review commit history**

Run: `git log --oneline -6`
Expected: See all 4-5 commits from this implementation

**Step 3: Run final verification**

Run: `pnpm typecheck && pnpm lint`
Expected: Both PASS

**Step 4: Push to remote**

```bash
git push -u origin feat/drag-drop-admin
```

**Step 5: Create pull request**

Run:

```bash
gh pr create --title "feat: drag-and-drop reordering in admin panel" --body "$(cat <<'EOF'
## Summary

Replace up/down arrow buttons with drag-and-drop reordering in admin panel:
- **Sections Manager**: Drag to reorder homepage sections
- **Hero Banners**: Drag to reorder carousel slides
- **Animations**: Smooth 200ms transitions with visual feedback
- **Accessibility**: Keyboard navigation (Space to grab, arrows to move)
- **Touch Support**: Works on mobile/tablet devices

## Library

- `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` (~15kb gzipped)
- Modern, actively maintained, React 19 compatible

## Test Plan

- [x] Drag sections up/down
- [x] Drag hero slides up/down
- [x] Keyboard navigation (Space + arrows)
- [x] Touch drag on mobile simulator
- [x] Smooth animations (200ms transitions)
- [x] Auto-save on drop
- [x] Error handling (network failure)
- [x] Toggle/delete still work independently
- [x] No layout shift or jank

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**Step 6: Verify PR created**

Expected: PR URL returned from `gh pr create`

---

## Success Criteria

**Functional:**

- ✅ Drag-and-drop works in both SectionOrderManager and HeroBannerManager
- ✅ Auto-save triggers on drop
- ✅ Error handling reverts order on save failure
- ✅ Toggle and delete buttons still work

**UX:**

- ✅ Smooth animations (no jank)
- ✅ Visual feedback during drag (opacity, scale, shadow)
- ✅ Cursor changes (grab → grabbing)

**Accessibility:**

- ✅ Keyboard navigation works (Space + arrows)
- ✅ Focus indicators visible
- ✅ ARIA labels present

**Technical:**

- ✅ `pnpm typecheck` passes
- ✅ `pnpm lint` passes
- ✅ No console errors
- ✅ Works on Chrome, Safari, Firefox

**Mobile:**

- ✅ Touch drag works on mobile simulator
- ✅ No accidental scrolling during drag

---

## Notes

- **No tests written:** Project doesn't have component test infrastructure. Rely on manual testing and TypeScript for safety.
- **Reusable pattern:** The DndContext + SortableContext pattern can be reused for future drag-and-drop features.
- **Performance:** @dnd-kit uses CSS transforms (no re-renders during drag) for smooth 60fps animations.
- **Future:** Could add multi-select drag, undo/redo, or drag-to-delete in follow-up PRs.
