"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface PhotoUploaderProps {
  bucket: string;
  path: string;
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
}

export default function PhotoUploader({ bucket, path, value, onChange, label }: PhotoUploaderProps) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${path}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from(bucket).upload(fileName, file);

    if (error) {
      alert("Upload failed: " + error.message);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
    onChange(publicUrl);
    setUploading(false);
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
      <div
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors",
          value ? "border-forest-300 bg-forest-50" : "border-gray-300 dark:border-gray-600 hover:border-lime-300"
        )}
      >
        {value ? (
          <div className="relative w-full h-40">
            <Image src={value} alt="Upload preview" fill className="object-cover rounded-lg" />
          </div>
        ) : (
          <div className="py-8">
            <p className="text-gray-500 dark:text-gray-400">{uploading ? "Uploading..." : "Click to upload image"}</p>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      {value && (
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
          Remove
        </Button>
      )}
    </div>
  );
}
