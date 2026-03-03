"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { ChevronRightIcon } from "@/components/icons";
import {
  BREADCRUMB_ROUTES,
  patternToRegex,
  type BreadcrumbSegment,
} from "@/lib/constants/breadcrumb-routes";
import { useBreadcrumbTitle } from "@/lib/contexts/BreadcrumbContext";
import { cn } from "@/lib/utils";

/** Replace `:id` / `:username` placeholders in an href with matched values. */
function interpolateHref(href: string, params: Record<string, string>): string {
  return href.replaceAll(/:(\w+)/g, (_, key: string) => params[key] ?? key);
}

export default function Breadcrumbs() {
  const pathname = usePathname();
  const { title } = useBreadcrumbTitle();

  const match = useMemo(() => {
    // Strip trailing slash for consistent matching (except root "/")
    const normalized =
      pathname !== "/" && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

    for (const route of BREADCRUMB_ROUTES) {
      const regex = patternToRegex(route.pattern);
      const m = normalized.match(regex);
      if (m) {
        const params: Record<string, string> = { ...m.groups };
        return { route, params };
      }
    }
    return null;
  }, [pathname]);

  // No breadcrumb on home page or unknown routes
  if (!match || pathname === "/") return null;

  const { route, params } = match;

  // Build resolved segments: Home + route segments with labels resolved
  const resolved: { label: string; href?: string }[] = [{ label: "Home", href: "/" }];

  for (const seg of route.segments) {
    const resolvedSeg: { label: string; href?: string } = {
      label: resolveLabel(seg, title, route.fallbackLabel),
    };
    if (seg.href) {
      resolvedSeg.href = interpolateHref(seg.href, params);
    }
    resolved.push(resolvedSeg);
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
        {resolved.map((seg, i) => {
          const isLast = i === resolved.length - 1;
          return (
            <li key={i} className="flex items-center gap-1 min-w-0">
              {i > 0 && (
                <ChevronRightIcon className="h-3.5 w-3.5 flex-shrink-0 text-gray-400 dark:text-gray-500" />
              )}
              {isLast || !seg.href ? (
                <span
                  className={cn(
                    "truncate max-w-[200px]",
                    isLast && "text-gray-900 dark:text-gray-100 font-medium",
                  )}
                >
                  {seg.label}
                </span>
              ) : (
                <Link
                  href={seg.href}
                  className="truncate max-w-[200px] hover:underline hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  {seg.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function resolveLabel(
  seg: BreadcrumbSegment,
  contextTitle: string | null,
  fallback?: string,
): string {
  if (seg.label !== null) return seg.label;
  return contextTitle ?? fallback ?? "...";
}
