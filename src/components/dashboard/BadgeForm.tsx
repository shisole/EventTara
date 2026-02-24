"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Input } from "@/components/ui";
import { BADGE_CATEGORIES, BADGE_RARITIES } from "@/lib/constants/badge-templates";

import BadgeTemplatePicker from "./BadgeTemplatePicker";
import PhotoUploader from "./PhotoUploader";

interface BadgeFormProps {
  eventId: string;
  existingBadge?: {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    category: string | null;
    rarity: string | null;
  } | null;
}

export default function BadgeForm({ eventId, existingBadge }: BadgeFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(existingBadge?.title || "");
  const [description, setDescription] = useState(existingBadge?.description || "");
  const [imageUrl, setImageUrl] = useState<string | null>(existingBadge?.image_url || null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [category, setCategory] = useState(existingBadge?.category || "special");
  const [rarity, setRarity] = useState(existingBadge?.rarity || "common");
  const [showTemplatePicker, setShowTemplatePicker] = useState(!existingBadge);

  const handleTemplateSelect = (template: {
    title: string;
    description: string;
    category: string;
    rarity: string;
  }) => {
    setTitle(template.title);
    setDescription(template.description);
    setCategory(template.category);
    setRarity(template.rarity);
    setShowTemplatePicker(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/badges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: eventId,
        title,
        description,
        image_url: imageUrl,
        category,
        rarity,
      }),
    });

    setLoading(false);
    if (res.ok) {
      setSuccess(true);
      router.refresh();
    }
  };

  return (
    <div className="space-y-4">
      {showTemplatePicker && !existingBadge && (
        <BadgeTemplatePicker
          onSelect={handleTemplateSelect}
          onSkip={() => {
            setShowTemplatePicker(false);
          }}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="badgeTitle"
          label="Badge Title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
          }}
          placeholder="Summit Conqueror"
          required
        />

        <Input
          id="badgeDesc"
          label="Description"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
          }}
          placeholder="Awarded to those who reached the summit"
        />

        <PhotoUploader
          bucket="badges"
          path="images"
          value={imageUrl}
          onChange={setImageUrl}
          label="Badge Image"
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label
              htmlFor="badgeCategory"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Category
            </label>
            <select
              id="badgeCategory"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
              }}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 dark:focus:ring-lime-800 outline-none transition-colors"
            >
              {BADGE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="badgeRarity"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Rarity
            </label>
            <select
              id="badgeRarity"
              value={rarity}
              onChange={(e) => {
                setRarity(e.target.value);
              }}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 dark:focus:ring-lime-800 outline-none transition-colors"
            >
              {BADGE_RARITIES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {success && <p className="text-sm text-forest-500">Badge saved!</p>}

        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "Saving..." : existingBadge ? "Update Badge" : "Create Badge"}
        </Button>
      </form>
    </div>
  );
}
