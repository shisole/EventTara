"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import type { CmsFeatureFlags } from "@/lib/cms/types";

const STORAGE_KEY = "debug_feature_flags";

type FlagOverrides = Partial<Record<keyof Omit<CmsFeatureFlags, "id">, boolean>>;

interface DebugFlagContextValue {
  /** Whether debug mode is active */
  active: boolean;
  /** Server-provided flag values */
  serverFlags: CmsFeatureFlags | null;
  /** Current overrides (session-only) */
  overrides: FlagOverrides;
  /** Set a single flag override */
  setOverride: (key: keyof Omit<CmsFeatureFlags, "id">, value: boolean) => void;
  /** Clear all overrides */
  resetOverrides: () => void;
}

const DebugFlagContext = createContext<DebugFlagContextValue>({
  active: false,
  serverFlags: null,
  overrides: {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setOverride: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  resetOverrides: () => {},
});

export function useDebugFlags() {
  return useContext(DebugFlagContext);
}

export function DebugFlagProvider({
  active,
  serverFlags,
  children,
}: {
  active: boolean;
  serverFlags: CmsFeatureFlags | null;
  children: React.ReactNode;
}) {
  const [overrides, setOverrides] = useState<FlagOverrides>({});

  // Load overrides from sessionStorage on mount
  useEffect(() => {
    if (!active) return;
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: FlagOverrides = JSON.parse(stored);
        setOverrides(parsed);
      }
    } catch {
      // ignore parse errors
    }
  }, [active]);

  const setOverride = useCallback((key: keyof Omit<CmsFeatureFlags, "id">, value: boolean) => {
    setOverrides((prev) => {
      const next = { ...prev, [key]: value };
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // storage full — ignore
      }
      return next;
    });
  }, []);

  const resetOverrides = useCallback(() => {
    setOverrides({});
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(
    () => ({ active, serverFlags, overrides, setOverride, resetOverrides }),
    [active, serverFlags, overrides, setOverride, resetOverrides],
  );

  return <DebugFlagContext.Provider value={value}>{children}</DebugFlagContext.Provider>;
}
