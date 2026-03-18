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

import { getVideoUploadUrlAction } from "@/app/(admin)/admin/hero/actions";
import { DragHandle } from "@/components/icons";
import { cn } from "@/lib/utils";

interface Slide {
  url?: string;
  mobileUrl?: string;
  videoUrl?: string;
  alt?: string;
}

/** Unique key for sortable — use videoUrl or url */
function slideKey(slide: Slide): string {
  return slide.videoUrl || slide.url || "";
}

function isVideoSlide(slide: Slide): boolean {
  return !!slide.videoUrl;
}

/** Convert full R2 public URLs to local /r2/ proxy (avoids CORS for video) */
function toProxyUrl(url: string): string {
  if (url.startsWith("/r2/")) return url;
  const match = /^https:\/\/pub-[^/]+\.r2\.dev\/(.+)$/.exec(url);
  return match ? `/r2/${match[1]}` : url;
}

interface SortableSlideProps {
  slide: Slide;
  onRemove: (index: number) => void;
  index: number;
  disabled: boolean;
}

function SortableSlide({ slide, onRemove, index, disabled }: SortableSlideProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slideKey(slide),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isVideo = isVideoSlide(slide);

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
        {isVideo ? (
          <>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              src={toProxyUrl(slide.videoUrl!)}
              muted
              className="h-full w-full object-cover"
              preload="metadata"
            />
            <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              Video
            </span>
          </>
        ) : (
          <Image
            src={slide.url!}
            alt={slide.alt || ""}
            fill
            className="object-cover"
            sizes="112px"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
          {slide.alt || (isVideo ? "Video slide" : "Image slide")}
        </p>
        <p className="truncate text-xs text-gray-400 dark:text-gray-500">
          {slide.videoUrl || slide.url}
        </p>
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

  const stagedIsVideo = stagedFile?.type.startsWith("video/") ?? false;

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/hero-carousel");
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        const slidesArray: Slide[] = Array.isArray(data.slides) ? data.slides : [];
        const parsed = slidesArray.filter((s: Slide) => s.url || s.videoUrl);
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

  const uploadVideo = useCallback(async (file: File): Promise<string> => {
    // Get a presigned URL for direct upload to R2 (bypasses Vercel payload limit)
    const { uploadUrl, videoUrl, error } = await getVideoUploadUrlAction(file.type, "hero");
    if (error || !uploadUrl || !videoUrl) throw new Error(error || "Failed to get upload URL");

    // Upload directly to R2
    const res = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    if (!res.ok) {
      throw new Error(`Upload failed (${res.status})`);
    }

    return videoUrl;
  }, []);

  const uploadAndAdd = useCallback(async () => {
    if (!stagedFile) return;
    // Alt text required for images, optional for videos
    if (!stagedIsVideo && !newAlt.trim()) return;

    setUploading(true);
    setError(null);
    try {
      let newSlide: Slide;

      if (stagedIsVideo) {
        // Video: chunked upload → server-side compression → R2
        const videoUrl = await uploadVideo(stagedFile);
        newSlide = { videoUrl, alt: newAlt.trim() || undefined };
      } else {
        // Image: upload through API (sharp processing)
        const formData = new FormData();
        formData.append("file", stagedFile);
        formData.append("folder", "hero");
        const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
        const text = await res.text();
        let data: Record<string, string>;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(text || `Upload failed (${res.status})`);
        }
        if (!res.ok) {
          throw new Error(data.error || "Upload failed");
        }
        newSlide = { url: data.url, mobileUrl: data.mobileUrl, alt: newAlt.trim() };
      }

      const updated = [...slides, newSlide];
      setSlides(updated);
      clearStaged();
      void save(updated);
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [stagedFile, stagedIsVideo, slides, newAlt, save, clearStaged, uploadVideo]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.type.startsWith("image/") || file.type.startsWith("video/"))) {
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

      const oldIndex = slides.findIndex((s) => slideKey(s) === active.id);
      const newIndex = slides.findIndex((s) => slideKey(s) === over.id);

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
        <SortableContext
          items={slides.map((s) => slideKey(s))}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {slides.map((slide, index) => (
              <SortableSlide
                key={slideKey(slide)}
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
          accept="image/*,video/mp4,video/webm"
          onChange={handleFileChange}
          className="hidden"
        />

        {stagedPreview ? (
          <div className="space-y-4">
            <div className="relative mx-auto h-40 w-72 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
              {stagedIsVideo ? (
                <>
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <video
                    src={stagedPreview}
                    muted
                    className="h-full w-full object-cover"
                    autoPlay
                    loop
                    playsInline
                  />
                  <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-xs font-semibold text-white">
                    Video
                  </span>
                </>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={stagedPreview} alt="Preview" className="h-full w-full object-cover" />
              )}
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
                placeholder={stagedIsVideo ? "Alt text (optional)" : "Alt text (required)"}
                value={newAlt}
                onChange={(e) => setNewAlt(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <button
                type="button"
                onClick={() => void uploadAndAdd()}
                disabled={(!stagedIsVideo && !newAlt.trim()) || uploading}
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
                {stagedIsVideo
                  ? "Compressing and uploading video..."
                  : "Processing and uploading to R2..."}
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
              Drag and drop an image or video, or{" "}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="font-medium text-lime-600 hover:text-lime-500 dark:text-lime-400"
              >
                browse
              </button>
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Images: max 10 MB (converted to WebP). Videos: MP4/WebM, max 200 MB (auto-compressed).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
