"use client";

import Image from "next/image";
import { useState, useRef } from "react";

import { Button } from "@/components/ui";
import { cdnUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
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
            byteArray[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([byteArray], { type: "image/jpeg" });
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
          return;
        }
      }
    });
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

interface PhotoUploaderProps {
  bucket: string;
  path: string;
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
}

export default function PhotoUploader({
  bucket,
  path,
  value,
  onChange,
  label,
}: PhotoUploaderProps) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    let compressed: File;
    try {
      compressed = await compressImage(file);
    } catch {
      setError("Could not process image. Please try a different file.");
      setUploading(false);
      return;
    }

    if (compressed.size > MAX_SIZE_BYTES) {
      setError("Image is too large even after compression. Please use a smaller image.");
      setUploading(false);
      return;
    }

    const fileName = `${path}/${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, compressed);

    if (uploadError) {
      setError("Upload failed: " + uploadError.message);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(fileName);
    onChange(cdnUrl(publicUrl) || publicUrl);
    setUploading(false);
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
          value
            ? "border-forest-300 bg-forest-50"
            : "border-gray-300 dark:border-gray-600 hover:border-lime-300",
        )}
      >
        {value ? (
          <div className="relative w-full h-40">
            <Image src={value} alt="Upload preview" fill className="object-cover rounded-lg" />
          </div>
        ) : (
          <div className="py-8">
            <p className="text-gray-500 dark:text-gray-400">
              {uploading ? "Compressing & uploading..." : "Click to upload image"}
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
        onChange={handleUpload}
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
