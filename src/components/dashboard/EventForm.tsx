"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import PhotoUploader from "./PhotoUploader";

interface EventFormProps {
  mode: "create" | "edit";
  initialData?: {
    id?: string;
    title: string;
    description: string;
    type: string;
    date: string;
    location: string;
    max_participants: number;
    price: number;
    cover_image_url: string | null;
    status?: string;
  };
}

const EVENT_TYPES = [
  { value: "hiking", label: "Hiking" },
  { value: "mtb", label: "Mountain Biking" },
  { value: "road_bike", label: "Road Biking" },
  { value: "running", label: "Running" },
  { value: "trail_run", label: "Trail Running" },
];

export default function EventForm({ mode, initialData }: EventFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [type, setType] = useState(initialData?.type || "hiking");
  const [date, setDate] = useState(initialData?.date ? new Date(initialData.date).toISOString().slice(0, 16) : "");
  const [location, setLocation] = useState(initialData?.location || "");
  const [maxParticipants, setMaxParticipants] = useState(initialData?.max_participants || 50);
  const [price, setPrice] = useState(initialData?.price || 0);
  const [coverImage, setCoverImage] = useState<string | null>(initialData?.cover_image_url || null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const body = {
      title,
      description,
      type,
      date: new Date(date).toISOString(),
      location,
      max_participants: maxParticipants,
      price,
      cover_image_url: coverImage,
    };

    const url = mode === "create" ? "/api/events" : `/api/events/${initialData?.id}`;
    const method = mode === "create" ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setLoading(false);
    } else {
      router.push(`/dashboard/events/${data.event.id}`);
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <Input
        id="title"
        label="Event Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Mountain Hike at Mt. Pulag"
        required
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 dark:focus:ring-lime-800 outline-none transition-colors dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
          placeholder="Describe your event..."
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Event Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 dark:focus:ring-lime-800 outline-none transition-colors dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
        >
          {EVENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <Input
        id="date"
        label="Date & Time"
        type="datetime-local"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />

      <Input
        id="location"
        label="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Mt. Pulag, Benguet"
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="maxParticipants"
          label="Max Participants"
          type="number"
          value={String(maxParticipants)}
          onChange={(e) => setMaxParticipants(Number(e.target.value))}
          min="1"
          required
        />
        <Input
          id="price"
          label="Price (PHP)"
          type="number"
          value={String(price)}
          onChange={(e) => setPrice(Number(e.target.value))}
          min="0"
          step="0.01"
          required
        />
      </div>

      <PhotoUploader
        bucket="events"
        path="covers"
        value={coverImage}
        onChange={setCoverImage}
        label="Cover Image"
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : mode === "create" ? "Create Event" : "Save Changes"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
