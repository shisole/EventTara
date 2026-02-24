"use client";

import { useState, useRef } from "react";

interface PaymentProofUploadProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
}

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export default function PaymentProofUpload({ file, onFileChange }: PaymentProofUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSet = (f: File) => {
    setError("");
    if (!ACCEPTED_TYPES.has(f.type)) {
      setError("Only JPG, PNG, and WebP images are accepted.");
      return;
    }
    if (f.size > MAX_SIZE) {
      setError("File must be under 5MB.");
      return;
    }
    onFileChange(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) validateAndSet(f);
  };

  const preview = file ? URL.createObjectURL(file) : null;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Payment Screenshot
      </label>

      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Payment proof preview"
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700"
          />
          <button
            type="button"
            onClick={() => {
              onFileChange(null);
            }}
            className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-black/80"
          >
            ✕
          </button>
        </div>
      ) : (
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
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-lime-500 bg-lime-50 dark:bg-lime-950"
              : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
          }`}
        >
          <p className="text-3xl mb-2">📸</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Drag & drop your payment screenshot here
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            or click to browse (JPG, PNG, WebP — max 5MB)
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) validateAndSet(f);
        }}
      />

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
