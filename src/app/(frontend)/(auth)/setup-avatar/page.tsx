"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

function SetupAvatarForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const next = searchParams.get("next") ?? "/events";

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState("User");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setUserId(user.id);

      void supabase
        .from("users")
        .select("avatar_url, full_name, has_picked_avatar")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.has_picked_avatar) {
            router.replace(next);
            return;
          }
          if (data?.avatar_url) setAvatarUrl(data.avatar_url);
          if (data?.full_name) setFullName(data.full_name);
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleContinue = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      await supabase.from("users").update({ has_picked_avatar: true }).eq("id", userId);
      router.push(next);
    } catch {
      router.push(next);
    } finally {
      setLoading(false);
    }
  };

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
          Your Profile Photo
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Looking good! This photo will appear on your profile.
        </p>
      </div>

      <div className="flex justify-center">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={fullName}
            width={128}
            height={128}
            className="w-32 h-32 rounded-full object-cover ring-4 ring-lime-200 dark:ring-lime-800"
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-lime-100 dark:bg-lime-900 text-lime-600 dark:text-lime-300 flex items-center justify-center text-3xl font-bold ring-4 ring-lime-200 dark:ring-lime-800">
            {initials}
          </div>
        )}
      </div>

      <Button onClick={handleContinue} className="w-full" size="lg" disabled={loading}>
        {loading ? "Setting up..." : "Continue"}
      </Button>
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
