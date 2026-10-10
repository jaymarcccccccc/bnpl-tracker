"use client";

import { useCallback, useEffect, useState } from "react";

/** Minimal data-loading hook: { data, error, reload }. Re-runs when deps change. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reload = useCallback(async () => {
    try {
      setData(await fn());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }, deps);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, reload };
}
