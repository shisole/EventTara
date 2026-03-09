"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Input, Toggle } from "@/components/ui";
import { cn } from "@/lib/utils";

const activityOptions = [
  { key: "hiking", label: "Hiking", color: "bg-emerald-500" },
  { key: "mtb", label: "Mountain Biking", color: "bg-amber-500" },
  { key: "road_bike", label: "Road Biking", color: "bg-blue-500" },
  { key: "running", label: "Running", color: "bg-orange-500" },
  { key: "trail_run", label: "Trail Running", color: "bg-yellow-700" },
];

export default function CreateClubForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [location, setLocation] = useState("");
  const [activityTypes, setActivityTypes] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleActivity = (key: string) => {
    setActivityTypes((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Club name is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          logo_url: logoUrl.trim() || null,
          activity_types: activityTypes,
          visibility: isPrivate ? "private" : "public",
          location: location.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create club");
        return;
      }

      router.push(`/clubs/${data.club.slug}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Name */}
      <Input
        id="name"
        label="Club Name *"
        placeholder="e.g., Manila Trail Runners"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      {/* Description */}
      <div className="space-y-1">
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Description
        </label>
        <textarea
          id="description"
          placeholder="Tell people what your club is about..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 dark:focus:ring-lime-800 outline-none transition-colors resize-none"
        />
      </div>

      {/* Logo URL */}
      <Input
        id="logo_url"
        label="Logo URL"
        placeholder="https://example.com/logo.png"
        value={logoUrl}
        onChange={(e) => setLogoUrl(e.target.value)}
        type="url"
      />

      {/* Location */}
      <Input
        id="location"
        label="Location"
        placeholder="e.g., Metro Manila, Philippines"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />

      {/* Activity Types */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Activity Types
        </label>
        <div className="flex flex-wrap gap-2">
          {activityOptions.map((opt) => {
            const isSelected = activityTypes.includes(opt.key);
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => toggleActivity(opt.key)}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border",
                  isSelected
                    ? "border-lime-500 bg-lime-50 text-lime-700 dark:bg-lime-950 dark:text-lime-300 dark:border-lime-700"
                    : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500",
                )}
              >
                <span className={cn("w-2.5 h-2.5 rounded-full", opt.color)} />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Visibility */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Visibility
        </label>
        <div className="flex items-center gap-3">
          <Toggle checked={isPrivate} onChange={setIsPrivate} id="visibility-toggle" />
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isPrivate ? "Private" : "Public"}
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isPrivate
                ? "Only people with an invite link can join"
                : "Anyone can find and join this club"}
            </p>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Club"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
