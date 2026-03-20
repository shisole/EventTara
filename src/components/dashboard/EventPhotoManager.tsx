"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { DragHandle, TrashIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { uploadImage } from "@/lib/upload";
import { cn } from "@/lib/utils";

const MAX_PHOTOS = 10;
const MAX_SIZE_BYTES = 1 * 1024 * 1024;
const MAX_DIMENSION = 2000;

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

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new globalThis.Image();
    img.addEventListener("load", () => {
      let { width, height } = img;

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width >= height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      const qualities = [0.85, 0.75, 0.65, 0.5, 0.4];
      for (const quality of qualities) {
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        const base64 = dataUrl.split(",")[1];
        const bytes = Math.ceil((base64.length * 3) / 4);
        if (bytes <= MAX_SIZE_BYTES || quality === qualities.at(-1)) {
          const byteString = atob(base64);
          const byteArray = new Uint8Array(byteString.length);
          for (let i = 0; i < byteString.length; i++) {
            byteArray[i] = byteString.codePointAt(i)!;
          }
          const blob = new Blob([byteArray], { type: "image/jpeg" });
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
          return;
        }
      }
    });
    img.addEventListener("error", () => {
      reject(new Error("Failed to load image"));
    });
    img.src = URL.createObjectURL(file);
  });
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
      const fileArray = [...files].filter((f) => f.type.startsWith("image/"));
      if (fileArray.length === 0) return;

      const remaining = MAX_PHOTOS - photos.length;
      if (remaining <= 0) {
        setError(`Maximum ${MAX_PHOTOS} photos allowed.`);
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
          const compressed = await compressImage(file);
          const imageUrl = await uploadImage(compressed, "events/photos");
          const sortOrder = photos.length;

          const res = await fetch(`/api/events/${eventId}/photos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image_url: imageUrl,
              sort_order: sortOrder,
            }),
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Failed to save photo");
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
    const res = await fetch(`/api/events/${eventId}/photos`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo_id: photoId }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to delete photo");
      return;
    }

    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
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
        Event Photos{" "}
        <span className="text-gray-400 dark:text-gray-500 font-normal">
          ({photos.length}/{MAX_PHOTOS}){photos.length > 1 && " · drag to reorder"}
        </span>
      </label>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Existing photos grid (drag to reorder) */}
      {!loading && photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
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
              <Image
                src={photo.image_url}
                alt={photo.caption || "Event photo"}
                fill
                className="object-cover pointer-events-none"
              />
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
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="rounded-xl border border-forest-300 dark:border-forest-700 bg-forest-50/50 dark:bg-forest-900/20 p-4 space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-forest-300 border-t-forest-600 dark:border-forest-700 dark:border-t-forest-400" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Uploading photo {uploadProgress.current} of {uploadProgress.total}...
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
      {!loading && !uploading && photos.length < MAX_PHOTOS && (
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
            Drop photos here or click to upload
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Max {MAX_PHOTOS} photos · auto-compressed to JPEG
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
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
