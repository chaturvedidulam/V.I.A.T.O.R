import { useEffect, useState } from "react";

/**
 * Tiny async helper so every page can show a loading skeleton and an empty
 * state without pulling in a data library. Swap for TanStack Query once the
 * real Firebase calls land.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fn()
      .then((res) => alive && setData(res))
      .catch((e: unknown) => {
        if (!alive) return;
        setData(null);
        setError(e instanceof Error ? e : new Error("Something went wrong"));
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}
