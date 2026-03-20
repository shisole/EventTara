"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { DragHandle, TrashIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { compressImage, isVideo, isVideoFile } from "@/lib/media";
import { uploadImage } from "@/lib/upload";
import { cn } from "@/lib/utils";

const MAX_MEDIA = 10;
const MAX_VIDEO_BYTES = 20 * 1024 * 1024;

interface EventPhoto {
  id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
}

interface EventPhotoManagerProps {
  eventId: string;
  initialPhotos?: EventPhoto[];
}

export default function EventPhotoManager({ eventId, initialPhotos = [] }: EventPhotoManagerProps) {
  const [photos, setPhotos] = useState<EventPhoto[]>(initialPhotos);
  const [loading, setLoading] = useState(initialPhotos.length === 0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const touchStartRef = useRef<{ idx: number; y: number } | null>(null);

  // Fetch photos client-side if none were provided server-side
  useEffect(() => {
    if (initialPhotos.length > 0) {
      setPhotos(initialPhotos);
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function fetchPhotos() {
      try {
        const res = await fetch(`/api/events/${eventId}/photos`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setPhotos(data.photos ?? []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void fetchPhotos();
    return () => {
      cancelled = true;
    };
  }, [eventId, initialPhotos]);

  const handleUpload = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = [...files].filter(
        (f) => f.type.startsWith("image/") || f.type.startsWith("video/"),
      );
      if (fileArray.length === 0) return;

      const remaining = MAX_MEDIA - photos.length;
      if (remaining <= 0) {
        setError(`Maximum ${MAX_MEDIA} items allowed.`);
        return;
      }

      const toUpload = fileArray.slice(0, remaining);
      setError(null);
      setUploading(true);
      setUploadProgress({ current: 0, total: toUpload.length });

      try {
        for (let i = 0; i < toUpload.length; i++) {
          setUploadProgress({ current: i + 1, total: toUpload.length });
          const file = toUpload[i];

          let uploadFile: File;
          let folder: string;

          if (isVideoFile(file)) {
            if (file.size > MAX_VIDEO_BYTES) {
              throw new Error(`Video "${file.name}" exceeds 20 MB limit.`);
            }
            uploadFile = file;
            folder = "events/videos";
          } else {
            uploadFile = await compressImage(file);
            folder = "events/photos";
          }

          const mediaUrl = await uploadImage(uploadFile, folder);
          const sortOrder = photos.length;

          const res = await fetch(`/api/events/${eventId}/photos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image_url: mediaUrl,
              sort_order: sortOrder,
            }),
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Failed to save media");
          }

          const { photo } = await res.json();
          setPhotos((prev) => [...prev, photo]);
        }
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [eventId, photos.length],
  );

  const handleDelete = async (photoId: string) => {
    // Optimistic: remove from state immediately
    const previous = photos;
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));

    const res = await fetch(`/api/events/${eventId}/photos`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo_id: photoId }),
    });

    if (!res.ok) {
      // Revert on failure
      setPhotos(previous);
      const data = await res.json();
      setError(data.error || "Failed to delete photo");
    }
  };

  const handleReorder = useCallback(
    async (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;

      const reordered = [...photos];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);

      // Optimistically update UI
      setPhotos(reordered);

      const order = reordered.map((p, i) => ({ id: p.id, sort_order: i }));
      const res = await fetch(`/api/events/${eventId}/photos`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      });

      if (!res.ok) {
        // Revert on failure
        setPhotos(photos);
        setError("Failed to reorder photos");
      }
    },
    [eventId, photos],
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      void handleUpload(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Event Photos & Videos{" "}
        <span className="text-gray-400 dark:text-gray-500 font-normal">
          ({photos.length}/{MAX_MEDIA}){photos.length > 1 && " · drag to reorder"}
        </span>
      </label>

      {/* Loading skeleton */}
      {loading && (
        <>
          {/* Mobile: list skeleton */}
          <div className="flex flex-col gap-2 sm:hidden">
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className="h-[72px] rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"
              />
            ))}
          </div>
          {/* Desktop: grid skeleton */}
          <div className="hidden sm:grid grid-cols-4 gap-2">
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className="aspect-square rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"
              />
            ))}
          </div>
        </>
      )}

      {/* Existing media — mobile: vertical list / desktop: grid */}
      {!loading && photos.length > 0 && (
        <>
          {/* Mobile: vertical sortable list */}
          <div className="flex flex-col gap-2 sm:hidden">
            {photos.map((photo, idx) => (
              <div
                key={photo.id}
                draggable
                onDragStart={(e) => {
                  setDragIndex(idx);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setDragOverIndex(idx);
                }}
                onDragLeave={() => {
                  setDragOverIndex((prev) => (prev === idx ? null : prev));
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (dragIndex !== null && dragIndex !== idx) {
                    void handleReorder(dragIndex, idx);
                  }
                  setDragIndex(null);
                  setDragOverIndex(null);
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setDragOverIndex(null);
                }}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  touchStartRef.current = { idx, y: touch.clientY };
                }}
                onTouchMove={(e) => {
                  if (touchStartRef.current === null) return;
                  const touch = e.touches[0];
                  const deltaY = touch.clientY - touchStartRef.current.y;
                  const rowHeight = 72;
                  const steps = Math.round(deltaY / rowHeight);
                  const targetIdx = Math.max(
                    0,
                    Math.min(photos.length - 1, touchStartRef.current.idx + steps),
                  );
                  setDragOverIndex(targetIdx);
                }}
                onTouchEnd={() => {
                  if (touchStartRef.current !== null && dragOverIndex !== null) {
                    void handleReorder(touchStartRef.current.idx, dragOverIndex);
                  }
                  touchStartRef.current = null;
                  setDragOverIndex(null);
                }}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-2 transition-all",
                  "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50",
                  dragIndex === idx && "opacity-40 scale-[0.98]",
                  dragOverIndex === idx &&
                    dragIndex !== idx &&
                    "ring-2 ring-forest-400 ring-offset-1 dark:ring-offset-gray-900",
                )}
              >
                <div className="touch-none cursor-grab active:cursor-grabbing text-gray-400 dark:text-gray-500 shrink-0">
                  <DragHandle className="w-5 h-5" />
                </div>
                <div className="relative w-14 h-14 shrink-0 rounded-md overflow-hidden">
                  {isVideo(photo.image_url) ? (
                    <video
                      src={photo.image_url}
                      muted
                      playsInline
                      preload="metadata"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src={photo.image_url}
                      alt={photo.caption || "Event photo"}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {isVideo(photo.image_url) ? "Video" : "Photo"} {idx + 1}
                  </p>
                  {photo.caption && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                      {photo.caption}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => void handleDelete(photo.id)}
                  className="shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Delete"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Desktop: grid */}
          <div className="hidden sm:grid grid-cols-4 gap-2">
            {photos.map((photo, idx) => (
              <div
                key={photo.id}
                draggable
                onDragStart={(e) => {
                  setDragIndex(idx);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setDragOverIndex(idx);
                }}
                onDragLeave={() => {
                  setDragOverIndex((prev) => (prev === idx ? null : prev));
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (dragIndex !== null && dragIndex !== idx) {
                    void handleReorder(dragIndex, idx);
                  }
                  setDragIndex(null);
                  setDragOverIndex(null);
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setDragOverIndex(null);
                }}
                className={cn(
                  "relative group aspect-square rounded-lg overflow-hidden cursor-grab active:cursor-grabbing transition-all",
                  dragIndex === idx && "opacity-40 scale-95",
                  dragOverIndex === idx &&
                    dragIndex !== idx &&
                    "ring-2 ring-forest-400 ring-offset-2 dark:ring-offset-gray-900",
                )}
              >
                {isVideo(photo.image_url) ? (
                  <video
                    src={photo.image_url}
                    muted
                    playsInline
                    preload="metadata"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  />
                ) : (
                  <Image
                    src={photo.image_url}
                    alt={photo.caption || "Event photo"}
                    fill
                    className="object-cover pointer-events-none"
                  />
                )}
                {isVideo(photo.image_url) && (
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 rounded text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Video
                  </div>
                )}
                {/* Drag handle */}
                <div className="absolute top-1 left-1 w-7 h-7 flex items-center justify-center bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <DragHandle className="w-3.5 h-3.5" />
                </div>
                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => void handleDelete(photo.id)}
                  className="absolute top-1 right-1 w-7 h-7 flex items-center justify-center bg-black/60 hover:bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Delete photo"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
                {/* Position indicator */}
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  {idx + 1}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="rounded-xl border border-forest-300 dark:border-forest-700 bg-forest-50/50 dark:bg-forest-900/20 p-4 space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-forest-300 border-t-forest-600 dark:border-forest-700 dark:border-t-forest-400" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Uploading {uploadProgress.current} of {uploadProgress.total}...
            </p>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-forest-500 transition-all duration-300 ease-out"
              style={{
                width: `${uploadProgress.total > 0 ? (uploadProgress.current / uploadProgress.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Upload zone */}
      {!loading && !uploading && photos.length < MAX_MEDIA && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => {
            setDragOver(false);
          }}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
            dragOver
              ? "border-forest-400 bg-forest-50 dark:bg-forest-900/20"
              : "border-gray-300 dark:border-gray-600 hover:border-lime-300",
          )}
        >
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Drop photos or videos here, or click to upload
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Max {MAX_MEDIA} items · images auto-compressed · videos up to 20 MB
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            void handleUpload(e.target.files);
            e.target.value = "";
          }
        }}
      />

      {error && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-red-500">{error}</p>
          <Button type="button" variant="ghost" size="sm" onClick={() => setError(null)}>
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}
