"use client";

import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";

import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

interface UserResult {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

interface EventDistance {
  id: string;
  label: string | null;
  distance_km: number;
  price: number;
}

interface AddParticipantModalProps {
  eventId: string;
  distances: EventDistance[];
  onClose: () => void;
  onAdded: () => void;
}

type ParticipantMode = "existing" | "new";
type ManualStatus = "paid" | "reserved" | "pending";

const statusOptions: { value: ManualStatus; label: string; description: string }[] = [
  { value: "reserved", label: "Reserved", description: "Spot held, not yet paid" },
  { value: "paid", label: "Paid", description: "Payment received" },
  { value: "pending", label: "Pending", description: "Unconfirmed entry" },
];

export default function AddParticipantModal({
  eventId,
  distances,
  onClose,
  onAdded,
}: AddParticipantModalProps) {
  const [mode, setMode] = useState<ParticipantMode>("existing");
  const [status, setStatus] = useState<ManualStatus>("reserved");
  const [distanceId, setDistanceId] = useState<string>(distances[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Existing user search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // New person fields
  const [manualName, setManualName] = useState("");
  const [manualContact, setManualContact] = useState("");

  // Animation
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [handleClose]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        e.target instanceof Node &&
        !dropdownRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.users || []);
      setShowDropdown(true);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    setSelectedUser(null);
    setError("");
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchUsers(value), 300);
  }

  function selectUser(user: UserResult) {
    setSelectedUser(user);
    setSearchQuery(user.full_name);
    setShowDropdown(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "existing" && !selectedUser) {
      setError("Please search and select a user.");
      return;
    }
    if (mode === "new" && !manualName.trim()) {
      setError("Name is required.");
      return;
    }

    setSubmitting(true);
    try {
      const body: Record<string, string | undefined> = {
        manualStatus: status,
        eventDistanceId: distanceId || undefined,
      };

      if (mode === "existing" && selectedUser) {
        body.userId = selectedUser.id;
      } else {
        body.manualName = manualName.trim();
        body.manualContact = manualContact.trim() || undefined;
      }

      const res = await fetch(`/api/events/${eventId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add participant.");
        return;
      }

      onAdded();
      handleClose();
    } catch {
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[80] flex items-center justify-center p-4 transition-opacity duration-200",
        isVisible ? "bg-black/60 opacity-100" : "bg-black/0 opacity-0",
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-participant-title"
      onClick={handleClose}
    >
      <div
        className={cn(
          "relative w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl transition-all duration-200",
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h2
          id="add-participant-title"
          className="text-lg font-heading font-bold dark:text-white mb-5"
        >
          Add Participant
        </h2>

        {/* Mode toggle */}
        <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 mb-5">
          <button
            type="button"
            onClick={() => {
              setMode("existing");
              setError("");
            }}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
              mode === "existing"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300",
            )}
          >
            Existing User
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("new");
              setError("");
            }}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
              mode === "new"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300",
            )}
          >
            New Person
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <fieldset disabled={submitting} className="min-w-0 space-y-4">
            {mode === "existing" ? (
              <div ref={dropdownRef} className="relative">
                <Input
                  label="Search user"
                  placeholder="Type a name or email..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  autoFocus
                />
                {selectedUser && (
                  <p className="mt-1 text-xs text-forest-600 dark:text-forest-400">
                    Selected: {selectedUser.full_name} ({selectedUser.email})
                  </p>
                )}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => selectUser(u)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors first:rounded-t-xl last:rounded-b-xl"
                      >
                        <p className="text-sm font-medium dark:text-white">{u.full_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                      </button>
                    ))}
                  </div>
                )}
                {showDropdown &&
                  searchResults.length === 0 &&
                  !searching &&
                  searchQuery.length >= 2 && (
                    <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg px-4 py-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400">No users found</p>
                    </div>
                  )}
                {searching && (
                  <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg px-4 py-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Searching...</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Input
                  label="Full name"
                  placeholder="Juan Dela Cruz"
                  value={manualName}
                  onChange={(e) => {
                    setManualName(e.target.value);
                    setError("");
                  }}
                  required
                  autoFocus
                />
                <Input
                  label="Contact (phone or email)"
                  placeholder="Optional"
                  value={manualContact}
                  onChange={(e) => setManualContact(e.target.value)}
                />
              </>
            )}

            {/* Distance picker */}
            {distances.length > 0 && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Distance
                </label>
                <select
                  value={distanceId}
                  onChange={(e) => setDistanceId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 dark:focus:ring-lime-800 outline-none transition-colors"
                >
                  {distances.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label || `${d.distance_km}km`} — PHP {d.price}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status selector */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={cn(
                      "rounded-xl border-2 py-2.5 px-3 text-sm font-medium transition-all",
                      status === opt.value
                        ? opt.value === "paid"
                          ? "border-forest-500 bg-forest-50 text-forest-700 dark:bg-forest-900/30 dark:text-forest-300 dark:border-forest-500"
                          : opt.value === "reserved"
                            ? "border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-500"
                            : "border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-500"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {statusOptions.find((o) => o.value === status)?.description}
              </p>
            </div>

            {error && <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitting} className="flex-1">
                {submitting ? "Adding..." : "Add Participant"}
              </Button>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
