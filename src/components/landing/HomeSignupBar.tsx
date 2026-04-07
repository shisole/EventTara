"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui";
import { useScrollHidden } from "@/lib/hooks/useScrollHidden";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function HomeSignupBar() {
  const [visible, setVisible] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const navHidden = useScrollHidden();

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active) setAuthed(!!data.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session?.user);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.6);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (authed !== false || !visible) return null;

  return (
    <div
      className={cn(
        "md:hidden fixed inset-x-0 z-40 px-4 py-3 transition-[bottom,opacity] duration-300",
        navHidden ? "bottom-2 pb-[env(safe-area-inset-bottom,0px)]" : "bottom-16",
      )}
    >
      <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg dark:shadow-gray-950/40 px-4 py-3 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 min-w-0">
          Join EventTara and find your adventure
        </span>
        <Link href="/signup" className="shrink-0">
          <Button className="rounded-xl min-h-[44px] px-6 text-sm font-semibold">Sign up</Button>
        </Link>
      </div>
    </div>
  );
}
