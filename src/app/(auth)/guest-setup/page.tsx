"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";
import { PRESET_AVATARS } from "@/lib/constants/avatars";
import { cn } from "@/lib/utils";

export default function GuestSetupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [displayName, setDisplayName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAvatar) {
      setError("Please pick an avatar!");
      return;
    }
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Session expired. Please try again.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.from("users").upsert({
      id: user.id,
      full_name: displayName || "Adventurer",
      avatar_url: selectedAvatar,
      is_guest: true,
      role: "guest",
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      router.push("/events");
      router.refresh();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-heading font-bold">Choose Your Adventure Avatar</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Pick an avatar and a display name to get started</p>
      </div>

      <form onSubmit={handleContinue} className="space-y-6">
        <div className="grid grid-cols-4 gap-3">
          {PRESET_AVATARS.map((avatar) => (
            <button
              key={avatar.id}
              type="button"
              onClick={() => setSelectedAvatar(avatar.id)}
              className={cn(
                "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                selectedAvatar === avatar.id
                  ? "border-lime-500 bg-lime-50 dark:bg-lime-950 scale-105"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              )}
            >
              <span className={cn("w-12 h-12 rounded-full flex items-center justify-center text-2xl", avatar.color)}>
                {avatar.emoji}
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400">{avatar.label}</span>
            </button>
          ))}
        </div>

        <Input
          id="displayName"
          label="Display Name (optional)"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="TrailHiker_42"
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Setting up..." : "Tara na! Let's Go!"}
        </Button>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          Create a full account anytime to save your badges permanently
        </p>
      </form>
    </div>
  );
}
