"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui";

import PhotoUploader from "./PhotoUploader";

interface GuideFormProps {
  mode: "create" | "edit";
  initialData?: {
    id?: string;
    full_name: string;
    bio: string | null;
    avatar_url: string | null;
    contact_number: string | null;
  };
}

export default function GuideForm({ mode, initialData }: GuideFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState(initialData?.full_name || "");
  const [bio, setBio] = useState(initialData?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialData?.avatar_url || null);
  const [contactNumber, setContactNumber] = useState(initialData?.contact_number || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const body = {
      full_name: fullName,
      bio: bio || null,
      avatar_url: avatarUrl,
      contact_number: contactNumber || null,
    };

    const url = mode === "create" ? "/api/guides" : `/api/guides/${initialData?.id}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(`/dashboard/guides/${data.guide.id}`);
        router.refresh();
      } else {
        setError(data.error || "Something went wrong");
        setLoading(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
          }}
          placeholder="e.g. Juan Dela Cruz"
          required
          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-lime-500 focus:ring-2 focus:ring-lime-200 dark:focus:ring-lime-800 focus:outline-none"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => {
            setBio(e.target.value);
          }}
          rows={4}
          placeholder="Tell us about this guide's experience, certifications, specialties..."
          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-lime-500 focus:ring-2 focus:ring-lime-200 dark:focus:ring-lime-800 focus:outline-none transition-colors"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Contact Number
        </label>
        <input
          type="text"
          value={contactNumber}
          onChange={(e) => {
            setContactNumber(e.target.value);
          }}
          placeholder="e.g. 09171234567"
          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-lime-500 focus:ring-2 focus:ring-lime-200 dark:focus:ring-lime-800 focus:outline-none"
        />
      </div>

      <PhotoUploader
        bucket="avatars"
        path="guides"
        value={avatarUrl}
        onChange={setAvatarUrl}
        label="Guide Photo"
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : mode === "create" ? "Add Guide" : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            router.back();
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
