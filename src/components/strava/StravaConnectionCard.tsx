"use client";

import { useCallback, useEffect, useState } from "react";

import { StravaIcon } from "@/components/icons";
import { Button } from "@/components/ui";

import StravaConnectButton from "./StravaConnectButton";

interface AthleteInfo {
  id: number;
  name: string;
  avatar: string | null;
}

interface ConnectionStatus {
  connected: boolean;
  athlete?: AthleteInfo;
}

export default function StravaConnectionCard() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/strava/status");
      if (!res.ok) {
        throw new Error("Failed to fetch Strava status");
      }
      const data: ConnectionStatus = await res.json();
      setStatus(data);
    } catch {
      setError("Could not load Strava connection status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setError(null);
    try {
      const res = await fetch("/api/strava/disconnect", { method: "DELETE" });
      if (!res.ok) {
        throw new Error("Failed to disconnect Strava");
      }
      setStatus({ connected: false });
    } catch {
      setError("Could not disconnect Strava. Please try again.");
    } finally {
      setDisconnecting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center gap-3 animate-pulse">
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="flex-1">
          <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700 mt-2" />
        </div>
      </div>
    );
  }

  // Error state
  if (error && !status) {
    return (
      <div className="text-sm text-red-600 dark:text-red-400">
        {error}
        <button onClick={fetchStatus} className="ml-2 underline hover:no-underline">
          Retry
        </button>
      </div>
    );
  }

  // Connected state
  if (status?.connected && status.athlete) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {status.athlete.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={status.athlete.avatar}
              alt={status.athlete.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#FC4C02] flex items-center justify-center">
              <StravaIcon className="w-5 h-5 text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-white truncate">
              {status.athlete.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Connected via Strava</p>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950"
        >
          {disconnecting ? "Disconnecting..." : "Disconnect Strava"}
        </Button>
      </div>
    );
  }

  // Not connected state
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Connect your Strava account to automatically sync activities with your event bookings.
      </p>
      <StravaConnectButton />
    </div>
  );
}
