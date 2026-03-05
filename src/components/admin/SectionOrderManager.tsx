"use client";

import { useCallback, useEffect, useState } from "react";

import { Toggle } from "@/components/ui";
import { type CmsHomepageSection } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

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

  const moveSection = useCallback(
    (index: number, direction: "up" | "down") => {
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= sections.length) return;
      const updated = [...sections];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      const reordered = updated.map((s, i) => ({ ...s, order: i }));
      setSections(reordered);
      void save(reordered);
    },
    [sections, save],
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

      <div className={cn("space-y-2", saving && "opacity-60 pointer-events-none")}>
        {sections.map((section, index) => (
          <div
            key={section.key}
            className={cn(
              "flex items-center justify-between rounded-xl border px-4 py-3 transition-colors",
              section.enabled
                ? "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
                : "border-gray-100 bg-gray-50 dark:border-gray-800/50 dark:bg-gray-900/50",
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs font-mono text-gray-400 dark:text-gray-500 w-5 text-right shrink-0">
                {index + 1}
              </span>
              <span
                className={cn(
                  "font-medium text-sm",
                  section.enabled
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-400 dark:text-gray-500",
                )}
              >
                {section.label}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Toggle checked={section.enabled} onChange={(v) => toggleSection(index, v)} />
              <div className="flex items-center gap-0.5 ml-2">
                <button
                  type="button"
                  onClick={() => moveSection(index, "up")}
                  disabled={index === 0}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-gray-800 dark:hover:text-gray-300"
                  title="Move up"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => moveSection(index, "down")}
                  disabled={index === sections.length - 1}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-gray-800 dark:hover:text-gray-300"
                  title="Move down"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sections.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
          No sections configured. Run the database migration to seed default sections.
        </p>
      )}
    </div>
  );
}
