"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { TrashIcon } from "@/components/icons";
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
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPhotos(initialPhotos);
  }, [initialPhotos]);

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

      try {
        for (const file of toUpload) {
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
          ({photos.length}/{MAX_PHOTOS})
        </span>
      </label>

      {/* Existing photos grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden">
              <Image
                src={photo.image_url}
                alt={photo.caption || "Event photo"}
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => void handleDelete(photo.id)}
                className="absolute top-1 right-1 w-7 h-7 flex items-center justify-center bg-black/60 hover:bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Delete photo"
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      {photos.length < MAX_PHOTOS && (
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
            {uploading ? "Uploading..." : "Drop photos here or click to upload"}
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
