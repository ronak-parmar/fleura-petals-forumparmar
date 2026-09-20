"use client";

import { useEffect, useState, useCallback } from "react";
import { ApiError } from "@/lib/api/types";

interface AsyncState<T> {
  data: T | null;
  error: ApiError | Error | null;
  loading: boolean;
}

/**
 * Standard data-fetching hook for client.ts calls. Re-runs whenever `deps`
 * changes. Use this instead of ad-hoc useEffect/useState in every page so
 * loading/error states look and behave the same everywhere.
 *
 *   const { data: products, error, loading, reload } = useAsync(
 *     () => client.getProducts({ nature: "fresh" }),
 *     [nature]
 *   );
 */
export function useAsync<T>(fn: () => Promise<T>, deps: React.DependencyList) {
  const [state, setState] = useState<AsyncState<T>>({ data: null, error: null, loading: true });
  const [tick, setTick] = useState(0);

  const run = useCallback(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn()
      .then((data) => { if (!cancelled) setState({ data, error: null, loading: false }); })
      .catch((error) => { if (!cancelled) setState({ data: null, error, loading: false }); });
    return () => { cancelled = true; };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => run(), [run, tick]);

  return { ...state, reload: () => setTick((t) => t + 1) };
}

/** Type guard for the ApiError shape used throughout lib/api/client.ts. */
export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}
