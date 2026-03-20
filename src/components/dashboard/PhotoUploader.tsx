"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";

import { Button } from "@/components/ui";
import { compressImage } from "@/lib/media";
import { cn } from "@/lib/utils";

const MAX_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB

interface PhotoUploaderProps {
  value: string | File | null;
  onChange: (value: File | null) => void;
  label?: string;
}

export default function PhotoUploader({ value, onChange, label }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Generate / revoke object URL for File previews
  useEffect(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
    // For string URLs or null, use the value directly
    setPreviewUrl(typeof value === "string" ? value : null);
  }, [value]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be re-selected
    e.target.value = "";

    setError(null);
    setCompressing(true);

    let compressed: File;
    try {
      compressed = await compressImage(file);
    } catch {
      setError("Could not process image. Please try a different file.");
      setCompressing(false);
      return;
    }

    if (compressed.size > MAX_SIZE_BYTES) {
      setError("Image is too large even after compression. Please use a smaller image.");
      setCompressing(false);
      return;
    }

    setCompressing(false);
    onChange(compressed);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors",
          previewUrl
            ? "border-forest-300 bg-forest-50"
            : "border-gray-300 dark:border-gray-600 hover:border-lime-300",
        )}
      >
        {previewUrl ? (
          <div className="relative w-full h-40">
            <Image
              src={previewUrl}
              alt="Upload preview"
              fill
              className="object-cover rounded-lg"
              unoptimized={value instanceof File}
            />
          </div>
        ) : (
          <div className="py-8">
            <p className="text-gray-500 dark:text-gray-400">
              {compressing ? "Compressing..." : "Click to upload image"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Max 1 MB · auto-compressed to JPEG
            </p>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            onChange(null);
          }}
        >
          Remove
        </Button>
      )}
    </div>
  );
}
