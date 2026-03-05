"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";

import { MAX_REVIEW_PHOTOS } from "@/lib/constants/review-tags";
import { cn } from "@/lib/utils";

interface ReviewPhotoUploadProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  disabled?: boolean;
}

async function compressImage(file: File): Promise<File> {
  const { default: imageCompression } = await import("browser-image-compression");
  return imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
  });
}

async function uploadPhoto(file: File): Promise<string> {
  const compressed = await compressImage(file);
  const formData = new FormData();
  formData.append("file", compressed);
  formData.append("folder", "reviews/photos");

  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(err.error || "Upload failed");
  }
  const data: { url: string } = await res.json();
  return data.url;
}

export default function ReviewPhotoUpload({
  photos,
  onChange,
  disabled = false,
}: ReviewPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setError(null);

      const remaining = MAX_REVIEW_PHOTOS - photos.length;
      if (remaining <= 0) {
        setError(`Maximum ${MAX_REVIEW_PHOTOS} photos allowed`);
        return;
      }

      const toUpload = [...files].slice(0, remaining);
      setUploading(true);

      try {
        const urls = await Promise.all(toUpload.map((f) => uploadPhoto(f)));
        onChange([...photos, ...urls]);
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : "Upload failed");
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [photos, onChange],
  );

  const removePhoto = (index: number) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {photos.map((url, i) => (
          <div key={url} className="relative group">
            <Image
              src={url}
              alt={`Review photo ${i + 1}`}
              width={80}
              height={80}
              className="h-20 w-20 rounded-lg object-cover"
            />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              disabled={disabled}
              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove photo"
            >
              &times;
            </button>
          </div>
        ))}
        {photos.length < MAX_REVIEW_PHOTOS && (
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "h-20 w-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 transition-colors",
              !disabled &&
                !uploading &&
                "hover:border-teal-400 hover:text-teal-500 dark:hover:border-teal-600 dark:hover:text-teal-400",
              (disabled || uploading) && "opacity-50 cursor-not-allowed",
            )}
          >
            {uploading ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
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
            ) : (
              <>
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-[10px] mt-0.5">Photo</span>
              </>
            )}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
