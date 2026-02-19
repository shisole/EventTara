"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import PhotoUploader from "./PhotoUploader";

interface BadgeFormProps {
  eventId: string;
  existingBadge?: {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
  } | null;
}

export default function BadgeForm({ eventId, existingBadge }: BadgeFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(existingBadge?.title || "");
  const [description, setDescription] = useState(existingBadge?.description || "");
  const [imageUrl, setImageUrl] = useState<string | null>(existingBadge?.image_url || null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
      }),
    });

    setLoading(false);
    if (res.ok) {
      setSuccess(true);
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input id="badgeTitle" label="Badge Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Summit Conqueror" required />

      <Input id="badgeDesc" label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Awarded to those who reached the summit" />

      <PhotoUploader bucket="badges" path="images" value={imageUrl} onChange={setImageUrl} label="Badge Image" />

      {success && <p className="text-sm text-forest-500">Badge saved!</p>}

      <Button type="submit" size="sm" disabled={loading}>
        {loading ? "Saving..." : existingBadge ? "Update Badge" : "Create Badge"}
      </Button>
    </form>
  );
}
