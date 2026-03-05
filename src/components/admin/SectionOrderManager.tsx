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
import { useCallback, useEffect, useState } from "react";

import { DragHandle } from "@/components/icons";
import { Toggle } from "@/components/ui";
import { type CmsHomepageSection } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

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

export default function SectionOrderManager() {
  const [sections, setSections] = useState<CmsHomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/homepage-sections");
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        const sectionsArray: CmsHomepageSection[] = Array.isArray(data.sections)
          ? data.sections
          : [];
        const parsed = sectionsArray
          .filter((s) => s.key && s.label != null)
          .sort((a, b) => a.order - b.order);
        setSections(parsed);
      } catch {
        setError("Failed to load homepage sections.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const save = useCallback(async (updated: CmsHomepageSection[]) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/homepage-sections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: updated }),
      });
      if (!res.ok) throw new Error("Failed to save");
    } catch {
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }, []);

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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const toggleSection = useCallback(
    (index: number, enabled: boolean) => {
      const updated = sections.map((s, i) => (i === index ? { ...s, enabled } : s));
      setSections(updated);
      void save(updated);
    },
    [sections, save],
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

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

      {sections.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
          No sections configured. Run the database migration to seed default sections.
        </p>
      )}
    </div>
  );
}
