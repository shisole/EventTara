"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface RouteAttachmentFormProps {
  eventId: string;
  onRouteAttached?: () => void;
}

type TabKey = "strava" | "gpx";

export default function RouteAttachmentForm({
  eventId,
  onRouteAttached,
}: RouteAttachmentFormProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("strava");
  const [stravaUrl, setStravaUrl] = useState("");
  const [gpxFileName, setGpxFileName] = useState<string | null>(null);
  const [gpxContent, setGpxContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGpxFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(false);
    const file = e.target.files?.[0];
    if (!file) {
      setGpxFileName(null);
      setGpxContent(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith(".gpx")) {
      setError("Please select a .gpx file");
      setGpxFileName(null);
      setGpxContent(null);
      return;
    }

    setGpxFileName(file.name);

    try {
      const text = await file.text();
      setGpxContent(text);
    } catch {
      setError("Failed to read file");
    }
  };

  const handleSubmitStrava = async () => {
    if (!stravaUrl.trim()) {
      setError("Please enter a Strava route URL");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/events/${eventId}/route-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "strava",
          strava_route_url: stravaUrl.trim(),
        }),
      });

      if (!res.ok) {
        const body: { error?: string } = await res.json();
        throw new Error(body.error ?? "Failed to attach route");
      }

      setSuccess(true);
      setStravaUrl("");
      onRouteAttached?.();
    } catch (error_) {
      const message = error_ instanceof Error ? error_.message : "Failed to attach route";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitGpx = async () => {
    if (!gpxContent) {
      setError("Please select a GPX file");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/events/${eventId}/route-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "gpx",
          gpx_data: gpxContent,
        }),
      });

      if (!res.ok) {
        const body: { error?: string } = await res.json();
        throw new Error(body.error ?? "Failed to attach route");
      }

      setSuccess(true);
      setGpxFileName(null);
      setGpxContent(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onRouteAttached?.();
    } catch (error_) {
      const message = error_ instanceof Error ? error_.message : "Failed to attach route";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: "strava", label: "Strava URL" },
    { key: "gpx", label: "GPX Upload" },
  ];

  return (
    <div className="space-y-4">
      {/* Tab toggle */}
      <div className="flex gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setError(null);
              setSuccess(false);
            }}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Strava URL tab */}
      {activeTab === "strava" && (
        <div className="space-y-3">
          <div>
            <label
              htmlFor="strava-route-url"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Strava Route URL
            </label>
            <input
              id="strava-route-url"
              type="url"
              value={stravaUrl}
              onChange={(e) => {
                setStravaUrl(e.target.value);
                setError(null);
                setSuccess(false);
              }}
              placeholder="https://www.strava.com/routes/12345"
              className={cn(
                "w-full rounded-lg border px-3 py-2 text-sm",
                "border-gray-300 dark:border-gray-600",
                "bg-white dark:bg-gray-800",
                "text-gray-900 dark:text-white",
                "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                "focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none",
              )}
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Paste a Strava route URL to import the route, distance, and elevation data.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => void handleSubmitStrava()}
            disabled={loading || !stravaUrl.trim()}
          >
            {loading ? "Importing..." : "Import Route"}
          </Button>
        </div>
      )}

      {/* GPX Upload tab */}
      {activeTab === "gpx" && (
        <div className="space-y-3">
          <div>
            <label
              htmlFor="gpx-file"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              GPX File
            </label>
            <div
              className={cn(
                "relative flex items-center gap-3 rounded-lg border border-dashed px-4 py-3",
                "border-gray-300 dark:border-gray-600",
                "bg-gray-50 dark:bg-gray-800/50",
              )}
            >
              <svg
                className="h-5 w-5 shrink-0 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                />
              </svg>
              <div className="flex-1 min-w-0">
                {gpxFileName ? (
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{gpxFileName}</p>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Choose a .gpx file or drag it here
                  </p>
                )}
              </div>
              <input
                ref={fileInputRef}
                id="gpx-file"
                type="file"
                accept=".gpx"
                onChange={(e) => void handleGpxFileChange(e)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={loading}
              />
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => void handleSubmitGpx()}
            disabled={loading || !gpxContent}
          >
            {loading ? "Uploading..." : "Upload Route"}
          </Button>
        </div>
      )}

      {/* Error */}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {/* Success */}
      {success && (
        <p className="text-sm text-teal-600 dark:text-teal-400">Route attached successfully!</p>
      )}
    </div>
  );
}
