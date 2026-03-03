"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

interface BreadcrumbContextValue {
  title: string | null;
  setTitle: (title: string | null) => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

const BreadcrumbContext = createContext<BreadcrumbContextValue>({
  title: null,
  setTitle: noop,
});

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [title, setTitle] = useState<string | null>(null);

  // Reset title on route change
  useEffect(() => {
    setTitle(null);
  }, [pathname]);

  const value = useMemo(() => ({ title, setTitle }), [title]);

  return <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>;
}

export function useBreadcrumbTitle(): BreadcrumbContextValue {
  return useContext(BreadcrumbContext);
}

/**
 * Drop-in client component that sets the breadcrumb title via context.
 * Resets to null on unmount so stale titles don't linger.
 */
export function BreadcrumbTitle({ title }: { title: string }) {
  const { setTitle } = useBreadcrumbTitle();

  useEffect(() => {
    setTitle(title);
    return () => setTitle(null);
  }, [title, setTitle]);

  return null;
}
