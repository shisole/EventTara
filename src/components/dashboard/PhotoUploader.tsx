"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";

import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

const MAX_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB
const MAX_DIMENSION = 2000; // cap longest side at 2000px

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new globalThis.Image();
    img.addEventListener("load", () => {
      let { width, height } = img;

      // Scale down if either dimension exceeds MAX_DIMENSION
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

      // Try decreasing JPEG quality until under MAX_SIZE_BYTES
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
