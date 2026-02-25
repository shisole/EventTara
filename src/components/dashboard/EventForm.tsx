"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

import DifficultyBadge from "@/components/events/DifficultyBadge";
import { Button, Input } from "@/components/ui";
import { findProvinceFromLocation } from "@/lib/constants/philippine-provinces";

import MountainCombobox, { type SelectedMountain } from "./MountainCombobox";
import PhotoUploader from "./PhotoUploader";

const MapPicker = dynamic(() => import("@/components/maps/MapPicker"), { ssr: false });
const DateRangePicker = dynamic(() => import("@/components/ui/DateRangePicker"));

interface DistanceCategory {
  distance_km: number;
  label: string;
  price: number;
  max_participants: number;
}

interface EventFormProps {
  mode: "create" | "edit";
  initialData?: {
    id?: string;
    title: string;
    description: string;
    type: string;
    date: string;
    end_date?: string | null;
    location: string;
    coordinates?: { lat: number; lng: number } | null;
    max_participants: number;
    price: number;
    cover_image_url: string | null;
    status?: string;
    initialGuideIds?: string[];
    initialMountains?: SelectedMountain[];
    difficulty_level?: number | null;
    initialDistances?: DistanceCategory[];
  };
}

const EVENT_TYPES = [
  { value: "hiking", label: "Hiking" },
  { value: "mtb", label: "Mountain Biking" },
  { value: "road_bike", label: "Road Biking" },
  { value: "running", label: "Running" },
  { value: "trail_run", label: "Trail Running" },
];

const DISTANCE_TYPES = new Set(["running", "trail_run", "road_bike"]);
const PRESET_DISTANCES = [3, 5, 10, 21, 42, 50, 100];

const DISTANCE_LABEL_MAP: Record<number, string> = {
  3: "3K",
  5: "5K",
  10: "10K",
  21: "Half Marathon",
  42: "Marathon",
  50: "50K Ultra",
  100: "100K Ultra",
};

function getDistanceLabel(km: number): string {
  return DISTANCE_LABEL_MAP[km] ?? `${String(km)}K`;
}

interface GuideOption {
  id: string;
  full_name: string;
  avatar_url: string | null;
  busy?: boolean;
  busy_event_title?: string | null;
}

function GuideCombobox({
  guides,
  selectedIds,
  onChange,
  loading,
}: {
  guides: GuideOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  loading: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        e.target instanceof Node &&
        !wrapperRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  const selectedGuides = guides.filter((g) => selectedIds.includes(g.id));
  const filtered = guides.filter(
    (g) => !selectedIds.includes(g.id) && g.full_name.toLowerCase().includes(query.toLowerCase()),
  );

  const select = (id: string) => {
    onChange([...selectedIds, id]);
    setQuery("");
    inputRef.current?.focus();
  };

  const remove = (id: string) => {
    onChange(selectedIds.filter((sid) => sid !== id));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Assign Guides
      </label>

      {loading ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">Checking guide availability...</p>
      ) : guides.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">
          No guides found.{" "}
          <Link href="/dashboard/guides/new" className="text-teal-600 dark:text-teal-400 underline">
            Add a guide
          </Link>{" "}
          first.
        </p>
      ) : (
        <div ref={wrapperRef} className="relative">
          {/* Selected chips + search input */}
          <div
            className="flex flex-wrap items-center gap-2 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 cursor-text min-h-[46px]"
            onClick={() => inputRef.current?.focus()}
          >
            {selectedGuides.map((guide) => (
              <span
                key={guide.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-lime-100 dark:bg-lime-900 text-lime-700 dark:text-lime-300 text-sm font-medium"
              >
                {guide.full_name}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(guide.id);
                  }}
                  className="hover:text-lime-900 dark:hover:text-lime-100 ml-0.5"
                  aria-label={`Remove ${guide.full_name}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-3.5 h-3.5"
                  >
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </button>
              </span>
            ))}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => {
                setOpen(true);
              }}
              placeholder={selectedIds.length === 0 ? "Search guides..." : ""}
              className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>

          {/* Dropdown */}
          {open && (
            <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
              {filtered.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">
                  {query ? "No guides match your search." : "All guides have been selected."}
                </p>
              ) : (
                filtered.map((guide) => {
                  const isBusy = !!guide.busy;
                  return (
                    <button
                      key={guide.id}
                      type="button"
                      disabled={isBusy}
                      onClick={() => {
                        if (!isBusy) select(guide.id);
                      }}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                        isBusy
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium dark:text-gray-200">
                          {guide.full_name}
                        </span>
                        {isBusy && guide.busy_event_title && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                            Busy &mdash; assigned to &ldquo;{guide.busy_event_title}&rdquo; on this
                            date
                          </p>
                        )}
                      </div>
                      {isBusy && (
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex-shrink-0">
                          Unavailable
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function EventForm({ mode, initialData }: EventFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [type, setType] = useState(initialData?.type || "hiking");

  // Date range state
  const [startDate, setStartDate] = useState<Date | undefined>(
    initialData?.date ? new Date(initialData.date) : undefined,
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    initialData?.end_date ? new Date(initialData.end_date) : undefined,
  );
  const [startTime, setStartTime] = useState(
    initialData?.date ? new Date(initialData.date).toTimeString().slice(0, 5) : "",
  );

  const [location, setLocation] = useState(initialData?.location || "");
  const [maxParticipants, setMaxParticipants] = useState(initialData?.max_participants || 50);
  const [price, setPrice] = useState(initialData?.price || 0);
  const [coverImage, setCoverImage] = useState<string | null>(initialData?.cover_image_url || null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(
    initialData?.coordinates || null,
  );
  const [showMap, setShowMap] = useState(!!initialData?.coordinates);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>(
    initialData?.coordinates || undefined,
  );

  // Distance categories state (running/trail_run/road_bike events)
  const [distances, setDistances] = useState<DistanceCategory[]>(
    initialData?.initialDistances || [],
  );
  const [customDistanceInput, setCustomDistanceInput] = useState("");

  const supportsDistances = DISTANCE_TYPES.has(type);

  // Clear distances when switching to a non-distance event type
  useEffect(() => {
    if (!supportsDistances) {
      setDistances([]);
    }
  }, [supportsDistances]);

  const addDistance = (km: number) => {
    // Don't add duplicate distances
    if (distances.some((d) => d.distance_km === km)) return;
    const newCategory: DistanceCategory = {
      distance_km: km,
      label: getDistanceLabel(km),
      price: 0,
      max_participants: 50,
    };
    setDistances((prev) => [...prev, newCategory].sort((a, b) => a.distance_km - b.distance_km));
  };

  const removeDistance = (km: number) => {
    setDistances((prev) => prev.filter((d) => d.distance_km !== km));
  };

  const updateDistance = (km: number, field: keyof DistanceCategory, value: string | number) => {
    setDistances((prev) => prev.map((d) => (d.distance_km === km ? { ...d, [field]: value } : d)));
  };

  const handleAddCustomDistance = () => {
    const km = Number.parseFloat(customDistanceInput);
    if (Number.isNaN(km) || km <= 0) return;
    addDistance(km);
    setCustomDistanceInput("");
  };

  // Guide selection state (hiking events only)
  const [selectedGuideIds, setSelectedGuideIds] = useState<string[]>(
    initialData?.initialGuideIds || [],
  );
  const [availableGuides, setAvailableGuides] = useState<
    {
      id: string;
      full_name: string;
      avatar_url: string | null;
      busy?: boolean;
      busy_event_title?: string | null;
    }[]
  >([]);
  const [loadingGuides, setLoadingGuides] = useState(false);

  // Mountain selection state (hiking events only)
  const [selectedMountains, setSelectedMountains] = useState<SelectedMountain[]>(
    initialData?.initialMountains || [],
  );
  const [availableMountains, setAvailableMountains] = useState<
    {
      id: string;
      name: string;
      province: string;
      difficulty_level: number;
      elevation_masl: number | null;
    }[]
  >([]);
  const [loadingMountains, setLoadingMountains] = useState(false);
  const [difficultyLevel, setDifficultyLevel] = useState<number | null>(
    initialData?.difficulty_level ?? null,
  );

  useEffect(() => {
    if (type !== "hiking" || !startDate) {
      setAvailableGuides([]);
      return;
    }
    const fetchGuides = async () => {
      setLoadingGuides(true);
      const params = new URLSearchParams({ check_date: startDate.toISOString() });
      if (mode === "edit" && initialData?.id) {
        params.set("exclude_event_id", initialData.id);
      }
      const res = await fetch(`/api/guides?${params}`);
      if (!res.ok) {
        setLoadingGuides(false);
        return;
      }
      const data = await res.json();
      setAvailableGuides(data.guides || []);
      setLoadingGuides(false);
    };
    void fetchGuides();
  }, [type, startDate, mode, initialData?.id]);

  useEffect(() => {
    if (type !== "hiking") {
      setAvailableMountains([]);
      return;
    }
    const fetchMountains = async () => {
      setLoadingMountains(true);
      const res = await fetch("/api/mountains");
      if (res.ok) {
        const data = await res.json();
        setAvailableMountains(data.mountains);
      }
      setLoadingMountains(false);
    };
    void fetchMountains();
  }, [type]);

  useEffect(() => {
    if (selectedMountains.length === 0) {
      setDifficultyLevel(null);
      return;
    }
    const maxDifficulty = Math.max(
      ...selectedMountains.map((m) => m.difficulty_override ?? m.difficulty_level),
    );
    setDifficultyLevel(maxDifficulty);
  }, [selectedMountains]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Combine startDate + startTime into ISO string
    if (!startDate || !startTime) {
      setError("Please select a date and time");
      setLoading(false);
      return;
    }

    const [hours, minutes] = startTime.split(":").map(Number);
    const dateTimeStart = new Date(startDate);
    dateTimeStart.setHours(hours, minutes, 0, 0);

    // Calculate end_date if endDate differs from startDate
    let endDateTime: string | null = null;
    if (endDate && endDate.getTime() !== startDate.getTime()) {
      const dateTimeEnd = new Date(endDate);
      dateTimeEnd.setHours(23, 59, 59, 999); // End of day
      endDateTime = dateTimeEnd.toISOString();
    }

    const body: Record<string, unknown> = {
      title,
      description,
      type,
      date: dateTimeStart.toISOString(),
      end_date: endDateTime,
      location,
      coordinates,
      max_participants: maxParticipants,
      price,
      cover_image_url: coverImage,
      difficulty_level: difficultyLevel,
    };

    // Include distance categories when applicable
    if (supportsDistances && distances.length > 0) {
      body.distances = distances;
    }

    const url = mode === "create" ? "/api/events" : `/api/events/${initialData?.id}`;
    const method = mode === "create" ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (res.ok) {
      // Sync guides for hiking events
      if (type === "hiking") {
        const eventId = data.event.id;

        // Get current guide links if editing
        let currentGuideIds: string[] = [];
        if (mode === "edit") {
          const currentRes = await fetch(`/api/events/${eventId}/guides`);
          if (currentRes.ok) {
            const currentData = await currentRes.json();
            currentGuideIds = (currentData.guides || []).map((g: { id: string }) => g.id);
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

      // Sync mountains for hiking events
      if (type === "hiking" && data.event.id) {
        const mountainEventId = data.event.id;
        const currentMtnRes = await fetch(`/api/events/${mountainEventId}/mountains`);
        const currentMtnData = await currentMtnRes.json();
        const currentMountainIds = new Set(
          (currentMtnData.mountains || []).map((m: { mountain_id: string }) => m.mountain_id),
        );
        const newMountainIds = new Set(selectedMountains.map((m) => m.mountain_id));

        // Delete removed mountains
        for (const current of currentMtnData.mountains || []) {
          if (!newMountainIds.has(current.mountain_id)) {
            await fetch(`/api/events/${mountainEventId}/mountains`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ mountain_id: current.mountain_id }),
            });
          }
        }

        // Add new mountains
        for (const selected of selectedMountains) {
          if (!currentMountainIds.has(selected.mountain_id)) {
            await fetch(`/api/events/${mountainEventId}/mountains`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                mountain_id: selected.mountain_id,
                route_name: selected.route_name || null,
                difficulty_override: selected.difficulty_override,
                sort_order: selected.sort_order,
              }),
            });
          }
        }
      }

      router.push(`/dashboard/events/${data.event.id}`);
      router.refresh();
    } else {
      setError(data.error || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <Input
        id="title"
        label="Event Title"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
        }}
        placeholder="Mountain Hike at Mt. Pulag"
        required
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
          }}
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 dark:focus:ring-lime-800 outline-none transition-colors dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
          placeholder="Describe your event..."
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Event Type
        </label>
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
          }}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 dark:focus:ring-lime-800 outline-none transition-colors dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
        >
          {EVENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        startTime={startTime}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onStartTimeChange={setStartTime}
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
          onClick={() => {
            setShowMap(!showMap);
          }}
          className="flex items-center gap-2 text-sm font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
            />
          </svg>
          {showMap ? "Hide map" : "Pin on map (optional)"}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className={`w-3 h-3 transition-transform ${showMap ? "rotate-180" : ""}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {showMap && <MapPicker value={coordinates} onChange={setCoordinates} center={mapCenter} />}
      </div>

      {/* Distance Categories (running, trail_run, road_bike only) */}
      {supportsDistances && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Distance Categories{" "}
              <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Add distance categories to offer multiple race distances. Each category can have its
              own price and participant limit.
            </p>

            {/* Preset quick-pick chips */}
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_DISTANCES.map((km) => {
                const alreadyAdded = distances.some((d) => d.distance_km === km);
                return (
                  <button
                    key={km}
                    type="button"
                    disabled={alreadyAdded}
                    onClick={() => {
                      addDistance(km);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      alreadyAdded
                        ? "bg-lime-100 dark:bg-lime-900 text-lime-700 dark:text-lime-300 cursor-default"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-lime-100 dark:hover:bg-lime-900 hover:text-lime-700 dark:hover:text-lime-300 cursor-pointer"
                    }`}
                  >
                    {km} km
                    {alreadyAdded && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-3.5 h-3.5 inline ml-1"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom distance input */}
            <div className="flex items-end gap-2">
              <div className="flex-1 max-w-[160px]">
                <Input
                  id="customDistance"
                  label="Custom (km)"
                  type="number"
                  value={customDistanceInput}
                  onChange={(e) => {
                    setCustomDistanceInput(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomDistance();
                    }
                  }}
                  min="0.1"
                  step="0.1"
                  placeholder="e.g. 15"
                />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddCustomDistance}>
                Add
              </Button>
            </div>
          </div>

          {/* Distance rows */}
          {distances.length > 0 && (
            <div className="space-y-3">
              <div className="hidden sm:grid sm:grid-cols-[80px_1fr_1fr_1fr_40px] gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 px-1">
                <span>Distance</span>
                <span>Label</span>
                <span>Price (PHP)</span>
                <span>Max Participants</span>
                <span />
              </div>
              {distances.map((d) => (
                <div
                  key={d.distance_km}
                  className="flex flex-col sm:grid sm:grid-cols-[80px_1fr_1fr_1fr_40px] gap-2 items-start sm:items-center p-3 sm:p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                >
                  {/* Distance (read-only) */}
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {d.distance_km} km
                  </span>

                  {/* Label (editable) */}
                  <input
                    type="text"
                    value={d.label}
                    onChange={(e) => {
                      updateDistance(d.distance_km, "label", e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:border-lime-500 focus:ring-1 focus:ring-lime-200 dark:focus:ring-lime-800 outline-none transition-colors"
                    placeholder="Label"
                  />

                  {/* Price */}
                  <input
                    type="number"
                    value={d.price}
                    onChange={(e) => {
                      updateDistance(d.distance_km, "price", Number(e.target.value));
                    }}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:border-lime-500 focus:ring-1 focus:ring-lime-200 dark:focus:ring-lime-800 outline-none transition-colors"
                    placeholder="Price"
                  />

                  {/* Max participants */}
                  <input
                    type="number"
                    value={d.max_participants}
                    onChange={(e) => {
                      updateDistance(d.distance_km, "max_participants", Number(e.target.value));
                    }}
                    min="1"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:border-lime-500 focus:ring-1 focus:ring-lime-200 dark:focus:ring-lime-800 outline-none transition-colors"
                    placeholder="Max"
                  />

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => {
                      removeDistance(d.distance_km);
                    }}
                    className="self-center text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    aria-label={`Remove ${d.label}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.519.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Event-level price & max participants (hidden when distance categories are set) */}
      {!(supportsDistances && distances.length > 0) && (
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="maxParticipants"
            label="Max Participants"
            type="number"
            value={String(maxParticipants)}
            onChange={(e) => {
              setMaxParticipants(Number(e.target.value));
            }}
            min="1"
            required
          />
          <Input
            id="price"
            label="Price (PHP)"
            type="number"
            value={String(price)}
            onChange={(e) => {
              setPrice(Number(e.target.value));
            }}
            min="0"
            step="0.01"
            required
          />
        </div>
      )}

      <PhotoUploader
        bucket="events"
        path="covers"
        value={coverImage}
        onChange={setCoverImage}
        label="Cover Image"
      />

      {type === "hiking" && (
        <>
          <MountainCombobox
            mountains={availableMountains}
            selectedMountains={selectedMountains}
            onChange={setSelectedMountains}
            loading={loadingMountains}
          />
          {selectedMountains.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Overall Event Difficulty
              </label>
              <div className="flex items-center gap-3">
                <select
                  value={difficultyLevel ?? ""}
                  onChange={(e) =>
                    setDifficultyLevel(e.target.value ? Number(e.target.value) : null)
                  }
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                >
                  {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}/9
                    </option>
                  ))}
                </select>
                {difficultyLevel && <DifficultyBadge level={difficultyLevel} />}
              </div>
              <p className="text-xs text-gray-500">
                Auto-set to highest peak difficulty. Override if the traverse is harder.
              </p>
            </div>
          )}
        </>
      )}

      {type === "hiking" && startDate && (
        <GuideCombobox
          guides={availableGuides}
          selectedIds={selectedGuideIds}
          onChange={setSelectedGuideIds}
          loading={loadingGuides}
        />
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : mode === "create" ? "Create Event" : "Save Changes"}
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
