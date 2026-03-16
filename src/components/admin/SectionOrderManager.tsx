"use client";

import { useCallback, useEffect, useState } from "react";

import { DragHandleButton, SortableList, Toggle } from "@/components/ui";
import { type SortableRowProps } from "@/components/ui/SortableList";
import { type CmsHomepageSection } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

type SortableSection = CmsHomepageSection & { id: string };

function SectionRow({
  item,
  index,
  dragHandleProps,
  onToggle,
}: SortableRowProps<SortableSection> & {
  onToggle: (index: number, enabled: boolean) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl border px-4 py-3 transition-all duration-200",
        item.enabled
          ? "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
          : "border-gray-100 bg-gray-50 dark:border-gray-800/50 dark:bg-gray-900/50",
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <DragHandleButton dragHandleProps={dragHandleProps} />
        <span className="text-xs font-mono text-gray-400 dark:text-gray-500 w-5 text-right shrink-0">
          {index + 1}
        </span>
        <span
          className={cn(
            "font-medium text-sm",
            item.enabled ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500",
          )}
        >
          {item.label}
        </span>
      </div>

      <Toggle checked={item.enabled} onChange={(v) => onToggle(index, v)} />
    </div>
  );
}

export default function SectionOrderManager() {
  const [sections, setSections] = useState<SortableSection[]>([]);
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
        const parsed: SortableSection[] = sectionsArray
          .filter((s) => s.key && s.label != null)
          .sort((a, b) => a.order - b.order)
          .map((s) => ({ ...s, id: s.key }));
        setSections(parsed);
      } catch {
        setError("Failed to load homepage sections.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const save = useCallback(async (updated: SortableSection[]) => {
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

  const handleReorder = useCallback(
    (reordered: SortableSection[]) => {
      const withUpdatedOrder = reordered.map((s, i) => ({ ...s, order: i }));
      setSections(withUpdatedOrder);
      void save(withUpdatedOrder);
    },
    [save],
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

      <SortableList
        items={sections}
        onReorder={handleReorder}
        disabled={saving}
        renderRow={(props) => <SectionRow {...props} onToggle={toggleSection} />}
      />

      {sections.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
          No sections configured. Run the database migration to seed default sections.
        </p>
      )}
    </div>
  );
}
