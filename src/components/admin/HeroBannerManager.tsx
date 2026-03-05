"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface Slide {
  url: string;
  alt: string;
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

  const moveSlide = useCallback(
    (index: number, direction: "up" | "down") => {
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= slides.length) return;
      const updated = [...slides];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      setSlides(updated);
      void save(updated);
    },
    [slides, save],
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

      <div className={cn("space-y-3", saving && "opacity-60 pointer-events-none")}>
        {slides.map((slide, index) => (
          <div
            key={`${slide.url}-${index}`}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
              <Image src={slide.url} alt={slide.alt} fill className="object-cover" sizes="112px" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {slide.alt}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{slide.url}</p>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => moveSlide(index, "up")}
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
                onClick={() => moveSlide(index, "down")}
                disabled={index === slides.length - 1}
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
              <button
                type="button"
                onClick={() => removeSlide(index)}
                className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                title="Remove"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}

        {slides.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            No slides yet. Add one below.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Add new slide</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            placeholder="Image URL"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white placeholder:text-gray-400"
          />
          <input
            type="text"
            placeholder="Alt text"
            value={newAlt}
            onChange={(e) => setNewAlt(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white placeholder:text-gray-400"
          />
          <button
            type="button"
            onClick={addSlide}
            disabled={!newUrl.trim() || !newAlt.trim() || saving}
            className="rounded-lg bg-lime-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-lime-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
