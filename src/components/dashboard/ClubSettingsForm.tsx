"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Input, Toggle } from "@/components/ui";

const ACTIVITY_OPTIONS = ["hiking", "mtb", "road_bike", "running", "trail_run"];

interface ClubSettingsFormProps {
  club: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    logo_url: string | null;
    cover_url: string | null;
    activity_types: string[];
    visibility: string;
    location: string | null;
    payment_info: Record<string, unknown> | null;
  };
  isOwner: boolean;
}

export default function ClubSettingsForm({ club, isOwner }: ClubSettingsFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState(club.name);
  const [description, setDescription] = useState(club.description ?? "");
  const [logoUrl, setLogoUrl] = useState(club.logo_url ?? "");
  const [location, setLocation] = useState(club.location ?? "");
  const [visibility, setVisibility] = useState(club.visibility);
  const [activityTypes, setActivityTypes] = useState<string[]>(club.activity_types ?? []);

  // Payment info (owner only)
  const gcashNameValue: string =
    typeof club.payment_info?.gcash_name === "string" ? club.payment_info.gcash_name : "";
  const gcashNumberValue: string =
    typeof club.payment_info?.gcash_number === "string" ? club.payment_info.gcash_number : "";
  const [gcashName, setGcashName] = useState(gcashNameValue);
  const [gcashNumber, setGcashNumber] = useState(gcashNumberValue);

  function toggleActivity(type: string) {
    setActivityTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const payload: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim() || null,
      logo_url: logoUrl.trim() || null,
      location: location.trim() || null,
      visibility,
      activity_types: activityTypes,
    };

    if (isOwner) {
      payload.payment_info = {
        gcash_name: gcashName.trim() || null,
        gcash_number: gcashNumber.trim() || null,
      };
    }

    try {
      const res = await fetch(`/api/clubs/${club.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update club settings");
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-sm text-green-600 dark:text-green-400">
          Settings saved successfully!
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-6 space-y-4">
        <h2 className="text-lg font-heading font-bold dark:text-white">General</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Club Name
          </label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 resize-none"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell people about your club..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Logo URL
          </label>
          <Input
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Location
          </label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Manila, Philippines"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Activity Types
          </label>
          <div className="flex flex-wrap gap-2">
            {ACTIVITY_OPTIONS.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => toggleActivity(type)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activityTypes.includes(type)
                    ? "bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400 border border-lime-300 dark:border-lime-700"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
                }`}
              >
                {type.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Private Club</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Only members with invite links can join
            </p>
          </div>
          <Toggle
            checked={visibility === "private"}
            onChange={(checked) => setVisibility(checked ? "private" : "public")}
          />
        </div>
      </div>

      {isOwner && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-6 space-y-4">
          <h2 className="text-lg font-heading font-bold dark:text-white">Payment Settings</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Payment details shown to participants when they book events.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              GCash Name
            </label>
            <Input
              value={gcashName}
              onChange={(e) => setGcashName(e.target.value)}
              placeholder="Juan Dela Cruz"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              GCash Number
            </label>
            <Input
              value={gcashNumber}
              onChange={(e) => setGcashNumber(e.target.value)}
              placeholder="09XX XXX XXXX"
            />
          </div>
        </div>
      )}

      <Button type="submit" disabled={saving} className="w-full sm:w-auto">
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  );
}
