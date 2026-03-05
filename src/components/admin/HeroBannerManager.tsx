"use client";

import {
  closestCenter,
  DndContext,
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
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { DragHandle } from "@/components/icons";
import { cn } from "@/lib/utils";

interface Slide {
  url: string;
  alt: string;
}

interface SortableSlideProps {
  slide: Slide;
  onRemove: (index: number) => void;
  index: number;
  disabled: boolean;
}

function SortableSlide({ slide, onRemove, index, disabled }: SortableSlideProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slide.url,
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
        <DragHandle className="h-4 w-4" />
      </button>

      <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
        <Image src={slide.url} alt={slide.alt} fill className="object-cover" sizes="112px" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{slide.alt}</p>
        <p className="truncate text-xs text-gray-400 dark:text-gray-500">{slide.url}</p>
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

export default function HeroBannerManager() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState("");
  const [newAlt, setNewAlt] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/hero-carousel");
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        const slidesArray: Slide[] = Array.isArray(data.slides) ? data.slides : [];
        const parsed = slidesArray.filter((s: Slide) => s.url && s.alt);
        setSlides(parsed);
      } catch {
        setError("Failed to load hero carousel.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const save = useCallback(async (updated: Slide[]) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/hero-carousel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides: updated }),
      });
      if (!res.ok) throw new Error("Failed to save");
    } catch {
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }, []);

  const addSlide = useCallback(() => {
    if (!newUrl.trim() || !newAlt.trim()) return;
    const updated = [...slides, { url: newUrl.trim(), alt: newAlt.trim() }];
    setSlides(updated);
    setNewUrl("");
    setNewAlt("");
    void save(updated);
  }, [slides, newUrl, newAlt, save]);

  const removeSlide = useCallback(
    (index: number) => {
      const updated = slides.filter((_, i) => i !== index);
      setSlides(updated);
      void save(updated);
    },
    [slides, save],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = slides.findIndex((s) => s.url === active.id);
      const newIndex = slides.findIndex((s) => s.url === over.id);

      const reordered = arrayMove(slides, oldIndex, newIndex);
      setSlides(reordered);
      void save(reordered);
    },
    [slides, save],
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={slides.map((s) => s.url)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {slides.map((slide, index) => (
              <SortableSlide
                key={slide.url}
                slide={slide}
                index={index}
                onRemove={removeSlide}
                disabled={saving}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {slides.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          No slides yet. Add one below.
        </p>
      )}

      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
        <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Add new slide</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="url"
            placeholder="Image URL"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <input
            type="text"
            placeholder="Alt text"
            value={newAlt}
            onChange={(e) => setNewAlt(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <button
            type="button"
            onClick={addSlide}
            disabled={!newUrl.trim() || !newAlt.trim() || saving}
            className="rounded-lg bg-lime-500 px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-lime-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
