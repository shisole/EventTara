"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { CheckCircleIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { type Database } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type AvatarAnimal = Database["public"]["Tables"]["avatar_animals"]["Row"];

interface PhotoOption {
  url: string;
  label: string;
}

type AvatarChoice = { type: "animal"; id: string } | { type: "photo"; url: string };

function SetupAvatarForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const next = searchParams.get("next") ?? "/setup-username";

  const [animals, setAnimals] = useState<AvatarAnimal[]>([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const [photoOptions, setPhotoOptions] = useState<PhotoOption[]>([]);
  const [avatarChoice, setAvatarChoice] = useState<AvatarChoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Auth check + fetch animals
  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      // If user already picked avatar, skip this page
      const { data: userData } = await supabase
        .from("users")
        .select("has_picked_avatar")
        .eq("id", user.id)
        .single();

      if (userData?.has_picked_avatar) {
        router.replace(next);
        return;
      }

      // Fetch available animals
      const { data: animalData } = await supabase
        .from("avatar_animals")
        .select("*")
        .order("sort_order");

      if (animalData) {
        setAnimals(animalData);
      }

      // Build photo options from Strava and/or existing avatar_url
      const photos: PhotoOption[] = [];
      try {
        const stravaRes = await fetch("/api/strava/status");
        if (stravaRes.ok) {
          const stravaData: { connected?: boolean; athlete?: { avatar?: string | null } } =
            await stravaRes.json();
          if (stravaData.connected && stravaData.athlete?.avatar) {
            photos.push({ url: stravaData.athlete.avatar, label: "Strava Photo" });
          }
        }
      } catch {
        // Strava fetch failed — skip
      }

      const { data: userRow } = await supabase
        .from("users")
        .select("avatar_url")
        .eq("id", user.id)
        .single();
      const existingUrl = userRow?.avatar_url ?? null;
      if (existingUrl) {
        const alreadyAdded = photos.some((p) => p.url === existingUrl);
        if (!alreadyAdded) {
          photos.push({ url: existingUrl, label: "Your Photo" });
        }
      }
      setPhotoOptions(photos);

      setInitialLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedAnimal = animals.find((a) => a.id === selectedAnimalId) ?? null;
  const hasSelection = avatarChoice !== null;

  const handleContinue = async () => {
    if (!avatarChoice) return;

    setError("");
    setLoading(true);

    try {
      if (avatarChoice.type === "photo") {
        const res = await fetch("/api/users/avatar-photo", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photo_url: avatarChoice.url }),
        });
        if (!res.ok) {
          const data: { error?: string } = await res.json();
          setError(data.error ?? "Something went wrong. Please try again.");
          return;
        }
      } else {
        const res = await fetch("/api/users/avatar-config", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ animal_id: avatarChoice.id }),
        });
        if (!res.ok) {
          const data: { error?: string } = await res.json();
          setError(data.error ?? "Something went wrong. Please try again.");
          return;
        }

        // Grant the starter animal for free in the shop inventory
        void fetch("/api/shop/grant-animal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ animal_id: avatarChoice.id }),
        });
      }

      // Mark avatar as picked
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("users").update({ has_picked_avatar: true }).eq("id", user.id);
      }

      setDone(true);
      setTimeout(() => {
        router.push(next);
        router.refresh();
      }, 1500);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (animals.length === 0) return;

    setError("");
    setLoading(true);

    try {
      // Pick a random animal
      const randomAnimal = animals[Math.floor(Math.random() * animals.length)];

      // Save config but don't mark as picked
      await fetch("/api/users/avatar-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animal_id: randomAnimal.id }),
      });

      // Grant the random animal for free in the shop inventory
      void fetch("/api/shop/grant-animal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animal_id: randomAnimal.id }),
      });

      router.push(next);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-lime-100 dark:bg-lime-900/30">
            <CheckCircleIcon className="h-7 w-7 text-lime-600 dark:text-lime-400" />
          </div>
          <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white">
            Great choice!
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {avatarChoice?.type === "photo" ? (
              "Using your photo. "
            ) : selectedAnimal ? (
              <>
                You picked{" "}
                <span className="font-medium text-gray-900 dark:text-white">
                  {selectedAnimal.name}
                </span>
                .{" "}
              </>
            ) : null}
            Redirecting...
          </p>
        </div>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-lime-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
          Pick Your Avatar
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Choose an avatar to represent you on EventTara
        </p>
      </div>

      {/* Photo options */}
      {photoOptions.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {photoOptions.map((photo) => (
            <button
              key={photo.url}
              type="button"
              disabled={loading}
              onClick={() => {
                setAvatarChoice({ type: "photo", url: photo.url });
                setSelectedAnimalId(null);
              }}
              className={cn(
                "group relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all",
                avatarChoice?.type === "photo" && avatarChoice.url === photo.url
                  ? "border-lime-500 bg-lime-50 ring-2 ring-lime-500 dark:border-lime-400 dark:bg-lime-950/30 dark:ring-lime-400"
                  : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600",
              )}
            >
              <div className="relative h-16 w-16 overflow-hidden rounded-full sm:h-20 sm:w-20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt={photo.label} className="h-full w-full object-cover" />
              </div>
              <span
                className={cn(
                  "text-xs font-medium",
                  avatarChoice?.type === "photo" && avatarChoice.url === photo.url
                    ? "text-lime-700 dark:text-lime-300"
                    : "text-gray-600 dark:text-gray-400",
                )}
              >
                {photo.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Animal Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {animals.map((animal) => (
          <button
            key={animal.id}
            type="button"
            disabled={loading}
            onClick={() => {
              setAvatarChoice({ type: "animal", id: animal.id });
              setSelectedAnimalId(animal.id);
            }}
            className={cn(
              "group relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all",
              avatarChoice?.type === "animal" && selectedAnimalId === animal.id
                ? "border-lime-500 bg-lime-50 ring-2 ring-lime-500 dark:border-lime-400 dark:bg-lime-950/30 dark:ring-lime-400"
                : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600",
            )}
          >
            <div
              className={cn(
                "relative h-16 w-16 transition-transform sm:h-20 sm:w-20",
                avatarChoice?.type === "animal" &&
                  selectedAnimalId === animal.id &&
                  "animate-[bounce_0.3s_ease-in-out]",
              )}
            >
              <Image
                src={animal.image_url}
                alt={animal.name}
                fill
                className="object-contain"
                sizes="(max-width: 640px) 64px, 80px"
              />
            </div>
            <span
              className={cn(
                "text-xs font-medium",
                avatarChoice?.type === "animal" && selectedAnimalId === animal.id
                  ? "text-lime-700 dark:text-lime-300"
                  : "text-gray-600 dark:text-gray-400",
              )}
            >
              {animal.name}
            </span>
          </button>
        ))}
      </div>

      {/* Live Preview */}
      {avatarChoice?.type === "photo" && (
        <div className="flex flex-col items-center gap-2">
          <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-lime-100 dark:bg-lime-900/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarChoice.url} alt="Your photo" className="h-full w-full object-cover" />
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Photo</p>
        </div>
      )}
      {avatarChoice?.type === "animal" && selectedAnimal && (
        <div className="flex flex-col items-center gap-2">
          <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-lime-100 dark:bg-lime-900/30">
            <div className="relative h-24 w-24">
              <Image
                src={selectedAnimal.image_url}
                alt={selectedAnimal.name}
                fill
                className="object-contain"
                sizes="96px"
              />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {selectedAnimal.name}
          </p>
        </div>
      )}

      {error && <p className="text-center text-sm text-red-500">{error}</p>}

      {/* Buttons */}
      <div className="space-y-3">
        <Button
          type="button"
          className="w-full"
          size="lg"
          disabled={loading || !hasSelection}
          onClick={handleContinue}
        >
          {loading ? "Saving..." : "Continue"}
        </Button>

        <button
          type="button"
          onClick={handleSkip}
          disabled={loading}
          className="w-full text-sm text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          Skip — I&apos;ll pick later
        </button>
      </div>
    </div>
  );
}

export default function SetupAvatarPage() {
  return (
    <Suspense>
      <SetupAvatarForm />
    </Suspense>
  );
}
