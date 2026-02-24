"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button, Input } from "@/components/ui";
import PhotoUploader from "./PhotoUploader";
import { findProvinceFromLocation } from "@/lib/constants/philippine-provinces";
import { createClient } from "@/lib/supabase/client";

const MapPicker = dynamic(() => import("@/components/maps/MapPicker"), { ssr: false });

interface EventFormProps {
  mode: "create" | "edit";
  initialData?: {
    id?: string;
    title: string;
    description: string;
    type: string;
    date: string;
    location: string;
    coordinates?: { lat: number; lng: number } | null;
    max_participants: number;
    price: number;
    cover_image_url: string | null;
    status?: string;
    initialGuideIds?: string[];
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
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(
    initialData?.coordinates || null
  );
  const [showMap, setShowMap] = useState(!!initialData?.coordinates);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>(
    initialData?.coordinates || undefined
  );

  // Guide selection state (hiking events only)
  const [selectedGuideIds, setSelectedGuideIds] = useState<string[]>(
    initialData?.initialGuideIds || []
  );
  const [availableGuides, setAvailableGuides] = useState<
    { id: string; full_name: string; avatar_url: string | null; busy?: boolean; busy_event_title?: string | null }[]
  >([]);
  const [loadingGuides, setLoadingGuides] = useState(false);

  useEffect(() => {
    if (type !== "hiking" || !date) {
      setAvailableGuides([]);
      return;
    }
    const fetchGuides = async () => {
      setLoadingGuides(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) { setLoadingGuides(false); return; }
      const params = new URLSearchParams({ created_by: user.id, check_date: new Date(date).toISOString() });
      if (mode === "edit" && initialData?.id) {
        params.set("exclude_event_id", initialData.id);
      }
      const res = await fetch(`/api/guides?${params}`);
      if (!res.ok) { setLoadingGuides(false); return; }
      const data = await res.json();
      setAvailableGuides(data.guides || []);
      setLoadingGuides(false);
    };
    fetchGuides();
  }, [type, date, mode, initialData?.id]);

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
      coordinates,
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
      // Sync guides for hiking events
      if (type === "hiking") {
        const eventId = data.event.id;

        // Get current guide links if editing
        let currentGuideIds: string[] = [];
        if (mode === "edit") {
          const currentRes = await fetch(`/api/events/${eventId}/guides`);
          if (currentRes.ok) {
            const currentData = await currentRes.json();
            currentGuideIds = (currentData.guides || []).map(
              (g: { id: string }) => g.id
            );
          }
        }

        // Add newly selected guides
        for (const guideId of selectedGuideIds) {
          if (!currentGuideIds.includes(guideId)) {
            await fetch(`/api/events/${eventId}/guides`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ guide_id: guideId }),
            });
          }
        }

        // Remove unselected guides
        for (const guideId of currentGuideIds) {
          if (!selectedGuideIds.includes(guideId)) {
            await fetch(`/api/events/${eventId}/guides`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ guide_id: guideId }),
            });
          }
        }
      }

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
        onChange={(e) => {
          const val = e.target.value;
          setLocation(val);
          // Try to recenter map based on province lookup
          const province = findProvinceFromLocation(val);
          if (province) {
            setMapCenter({ lat: province.lat, lng: province.lng });
          }
        }}
        placeholder="Mt. Pulag, Benguet"
        required
      />

      {/* Optional map pin section */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setShowMap(!showMap)}
          className="flex items-center gap-2 text-sm font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          {showMap ? "Hide map" : "Pin on map (optional)"}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3 h-3 transition-transform ${showMap ? "rotate-180" : ""}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {showMap && (
          <MapPicker
            value={coordinates}
            onChange={setCoordinates}
            center={mapCenter}
          />
        )}
      </div>

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

      {type === "hiking" && date && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Assign Guides
          </label>
          {loadingGuides ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">Checking guide availability...</p>
          ) : availableGuides.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              No guides found. <Link href="/dashboard/guides/new" className="text-teal-600 dark:text-teal-400 underline">Add a guide</Link> first.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                {availableGuides.map((guide) => {
                  const isBusy = guide.busy && !selectedGuideIds.includes(guide.id);
                  return (
                    <label
                      key={guide.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                        isBusy
                          ? "border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed"
                          : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedGuideIds.includes(guide.id)}
                        disabled={isBusy}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGuideIds((prev) => [...prev, guide.id]);
                          } else {
                            setSelectedGuideIds((prev) =>
                              prev.filter((id) => id !== guide.id)
                            );
                          }
                        }}
                        className="rounded border-gray-300 text-lime-500 focus:ring-lime-500 disabled:opacity-50"
                      />
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm ${isBusy ? "text-gray-400 dark:text-gray-500" : "dark:text-gray-200"}`}>
                          {guide.full_name}
                        </span>
                        {isBusy && guide.busy_event_title && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                            Assigned to &ldquo;{guide.busy_event_title}&rdquo; on this date
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Select guides to assign to this hiking event.
              </p>
            </>
          )}
        </div>
      )}

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
