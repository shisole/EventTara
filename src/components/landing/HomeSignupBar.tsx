"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui";
import { useScrollHidden } from "@/lib/hooks/useScrollHidden";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import SignupSheet from "./SignupSheet";

export default function HomeSignupBar() {
  const [visible, setVisible] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
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

  if (authed !== false) return null;

  return (
    <>
      <div
        className={cn(
          "md:hidden fixed inset-x-0 z-40 px-4 py-3 transition-[bottom,opacity,transform] duration-300",
          navHidden ? "bottom-2 pb-[env(safe-area-inset-bottom,0px)]" : "bottom-16",
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full pointer-events-none",
        )}
      >
        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg dark:shadow-gray-950/40 px-4 py-3 flex flex-col items-stretch gap-2.5">
          <span className="text-center text-sm font-semibold text-gray-900 dark:text-gray-100">
            Join EventTara and find your adventure
          </span>
          <Button
            onClick={() => setSheetOpen(true)}
            className="w-full rounded-full min-h-[48px] text-base font-semibold"
          >
            Sign up
          </Button>
        </div>
      </div>

      <SignupSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
