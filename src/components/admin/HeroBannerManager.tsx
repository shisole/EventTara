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
import { useCallback, useEffect, useRef, useState } from "react";

import { DragHandle } from "@/components/icons";
import { cn } from "@/lib/utils";

interface Slide {
  url: string;
  mobileUrl?: string;
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
  const [newAlt, setNewAlt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [stagedPreview, setStagedPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const stageFile = useCallback(
    (file: File) => {
      if (stagedPreview) URL.revokeObjectURL(stagedPreview);
      setStagedFile(file);
      setStagedPreview(URL.createObjectURL(file));
      setError(null);
    },
    [stagedPreview],
  );

  const clearStaged = useCallback(() => {
    if (stagedPreview) URL.revokeObjectURL(stagedPreview);
    setStagedFile(null);
    setStagedPreview(null);
    setNewAlt("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [stagedPreview]);

  const uploadAndAdd = useCallback(async () => {
    if (!stagedFile || !newAlt.trim()) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", stagedFile);
      formData.append("folder", "hero");
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }
      const { url, mobileUrl } = await res.json();
      const updated = [...slides, { url, mobileUrl, alt: newAlt.trim() }];
      setSlides(updated);
      clearStaged();
      void save(updated);
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [stagedFile, slides, newAlt, save, clearStaged]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file?.type.startsWith("image/")) {
        stageFile(file);
      }
    },
    [stageFile],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        stageFile(file);
      }
    },
    [stageFile],
  );

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

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "rounded-xl border-2 border-dashed p-6 text-center transition-colors",
          dragOver
            ? "border-lime-500 bg-lime-50 dark:border-lime-400 dark:bg-lime-950/20"
            : "border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50",
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {stagedPreview ? (
          <div className="space-y-4">
            <div className="relative mx-auto h-40 w-72 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={stagedPreview} alt="Preview" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={clearStaged}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                title="Remove"
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

            <div className="mx-auto flex max-w-md items-center gap-3">
              <input
                type="text"
                placeholder="Alt text (required)"
                value={newAlt}
                onChange={(e) => setNewAlt(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <button
                type="button"
                onClick={() => void uploadAndAdd()}
                disabled={!newAlt.trim() || uploading}
                className="rounded-lg bg-lime-500 px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-lime-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Add slide"}
              </button>
            </div>

            {uploading && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Processing and uploading to R2...
              </div>
            )}
          </div>
        ) : (
          <div>
            <svg
              className="mx-auto h-10 w-10 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 16v-8m0 0l-3 3m3-3l3 3M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Drag and drop an image, or{" "}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="font-medium text-lime-600 hover:text-lime-500 dark:text-lime-400"
              >
                browse
              </button>
            </p>
            <p className="mt-1 text-xs text-gray-400">Max 10 MB. Will be converted to WebP.</p>
          </div>
        )}
      </div>
    </div>
  );
}
