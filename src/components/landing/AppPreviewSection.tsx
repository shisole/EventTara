"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

const FEATURES = [
  {
    badge: "Explore",
    title: "Find your next adventure in seconds",
    description:
      "Browse hundreds of outdoor events — hiking, biking, running, and trail running across the Philippines. Filter by activity, date, location, or club to find the perfect one.",
    cta: { label: "Explore Events", href: "/events" },
    src: "/images/screenshots/events.png",
    alt: "EventTara events listing page showing hiking, biking, and running events",
    bg: "bg-white dark:bg-slate-800",
  },
  {
    badge: "Booking",
    title: "Book your spot with one tap",
    description:
      "See event details, route maps, guides, and reviews — then reserve instantly. Get a scannable QR ticket for check-in day. No more chasing slots in group chats.",
    cta: { label: "See How It Works", href: "/events" },
    src: "/images/screenshots/event-detail.png",
    alt: "EventTara event detail page with booking and route map",
    bg: "bg-gray-50 dark:bg-slate-900",
  },
  {
    badge: "Achievements",
    title: "Earn badges with every adventure",
    description:
      "Track your milestones, unlock avatar borders, and climb the leaderboard. Every hike, ride, and run gets you closer to your next badge.",
    cta: { label: "View Achievements", href: "/achievements" },
    src: "/images/screenshots/achievements.png",
    alt: "EventTara achievements page showing badges and leaderboards",
    bg: "bg-white dark:bg-slate-800",
  },
];

const NAV_HEIGHT = 64;

function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl shadow-2xl ring-1 ring-white/10 overflow-hidden bg-slate-900">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
          <div className="w-3 h-3 rounded-full bg-green-400/80" />
        </div>
        <div className="flex-1 mx-8">
          <div className="bg-slate-700/60 rounded-md px-3 py-1 text-xs text-slate-400 text-center max-w-[200px] mx-auto">
            eventtara.com
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

export default function AppPreviewSection() {
  const paneRefs = useRef<(HTMLDivElement | null)[]>([]);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const overlayRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const mql = globalThis.matchMedia("(min-width: 1024px)");
    let isLg = mql.matches;

    const onResize = () => {
      isLg = mql.matches;
    };
    mql.addEventListener("change", onResize);

    const onScroll = () => {
      const vh = globalThis.innerHeight;

      for (let i = 0; i < FEATURES.length - 1; i++) {
        const content = contentRefs.current[i];
        const overlay = overlayRefs.current[i];
        const nextPane = paneRefs.current[i + 1];
        if (!content || !overlay || !nextPane) continue;

        if (!isLg) {
          content.style.filter = "none";
          content.style.transform = "none";
          overlay.style.opacity = "0";
          continue;
        }

        const nextTop = nextPane.getBoundingClientRect().top;
        const p = Math.max(0, Math.min(1, (vh - nextTop) / (vh - NAV_HEIGHT)));

        content.style.filter = p > 0.01 ? `blur(${p * 5}px)` : "none";
        content.style.transform = p > 0.01 ? `scale(${1 - p * 0.04})` : "none";
        overlay.style.opacity = String(p * 0.6);
      }
    };

    globalThis.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      globalThis.removeEventListener("scroll", onScroll);
      mql.removeEventListener("change", onResize);
    };
  }, []);

  return (
    <section>
      {/* Sticky overlapping panes */}
      {FEATURES.map((feature, i) => {
        const reversed = i % 2 === 1;
        const isLast = i === FEATURES.length - 1;

        return (
          <div
            key={feature.badge}
            ref={(el) => {
              paneRefs.current[i] = el;
            }}
            className={cn(
              "lg:sticky lg:top-16 relative overflow-hidden",
              feature.bg,
              i > 0 && "lg:rounded-t-3xl",
              i > 0 &&
                "shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.4)]",
            )}
            style={{ zIndex: i + 1 }}
          >
            {/* Content — gets blurred + scaled when next pane overlaps */}
            <div
              ref={(el) => {
                contentRefs.current[i] = el;
              }}
            >
              <div
                className={cn(
                  "lg:min-h-[calc(100dvh-4rem)] flex flex-col justify-center",
                  "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-8",
                )}
              >
                {i === 0 && (
                  <div className="text-center mb-8 sm:mb-10">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-gray-900 dark:text-white mb-4">
                      See It in Action
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                      From discovering your next hike to collecting badges — everything you need for
                      your outdoor adventures.
                    </p>
                  </div>
                )}
                <div
                  className={cn(
                    "flex flex-col gap-8 sm:gap-12 lg:gap-16 items-center w-full",
                    reversed ? "lg:flex-row-reverse" : "lg:flex-row",
                  )}
                >
                  {/* Screenshot */}
                  <div className="w-full lg:w-[58%] shrink-0">
                    <BrowserFrame>
                      <div className="relative aspect-[16/10]">
                        <Image
                          src={feature.src}
                          alt={feature.alt}
                          fill
                          className="object-cover object-top"
                          sizes="(max-width: 1024px) 100vw, 58vw"
                        />
                      </div>
                    </BrowserFrame>
                  </div>

                  {/* Text content */}
                  <div className="w-full lg:w-[42%]">
                    <span className="inline-block px-3 py-1 rounded-full bg-lime-500/10 border border-lime-500/30 text-lime-600 dark:text-lime-400 text-xs font-semibold tracking-wide uppercase mb-4">
                      {feature.badge}
                    </span>
                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                      {feature.title}
                    </h3>
                    <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                      {feature.description}
                    </p>
                    <Link
                      href={feature.cta.href}
                      className="inline-flex items-center gap-2 text-lime-600 dark:text-lime-400 font-semibold hover:text-lime-500 transition-colors group"
                    >
                      {feature.cta.label}
                      <svg
                        className="w-4 h-4 transition-transform group-hover:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Dark overlay — fades in as next pane covers this one */}
            {!isLast && (
              <div
                ref={(el) => {
                  overlayRefs.current[i] = el;
                }}
                className="absolute inset-0 bg-black pointer-events-none"
                style={{ opacity: 0 }}
              />
            )}
          </div>
        );
      })}
    </section>
  );
}
