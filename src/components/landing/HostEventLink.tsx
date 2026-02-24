"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export default function HostEventLink() {
  const [href, setHref] = useState("/signup?role=organizer");

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && !user.is_anonymous) {
        setHref("/events");
      }
    });
  }, []);

  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center font-semibold rounded-xl text-lg py-4 px-8 border-2 border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:border-lime-500 hover:text-lime-600 dark:hover:text-lime-400 transition-colors"
    >
      Host Your Event
    </Link>
  );
}
