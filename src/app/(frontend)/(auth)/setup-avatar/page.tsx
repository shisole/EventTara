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

function SetupAvatarForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const next = searchParams.get("next") ?? "/setup-username";

  const [animals, setAnimals] = useState<AvatarAnimal[]>([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
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

      setInitialLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedAnimal = animals.find((a) => a.id === selectedAnimalId) ?? null;

  const handleContinue = async () => {
    if (!selectedAnimalId) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/users/avatar-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animal_id: selectedAnimalId }),
      });

      if (!res.ok) {
        const data: { error?: string } = await res.json();
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
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
            {selectedAnimal && (
              <>
                You picked{" "}
                <span className="font-medium text-gray-900 dark:text-white">
                  {selectedAnimal.name}
                </span>
                .{" "}
              </>
            )}
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
          Pick Your Animal
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Choose an animal avatar to represent you on EventTara
        </p>
      </div>

      {/* Animal Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {animals.map((animal) => (
          <button
            key={animal.id}
            type="button"
            disabled={loading}
            onClick={() => setSelectedAnimalId(animal.id)}
            className={cn(
              "group relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all",
              selectedAnimalId === animal.id
                ? "border-lime-500 bg-lime-50 ring-2 ring-lime-500 dark:border-lime-400 dark:bg-lime-950/30 dark:ring-lime-400"
                : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600",
            )}
          >
            <div
              className={cn(
                "relative h-16 w-16 transition-transform sm:h-20 sm:w-20",
                selectedAnimalId === animal.id && "animate-[bounce_0.3s_ease-in-out]",
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
                selectedAnimalId === animal.id
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
      {selectedAnimal && (
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
          disabled={loading || !selectedAnimalId}
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
