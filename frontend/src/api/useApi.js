import { useCallback, useEffect, useRef, useState } from "react";
import api from "./axios";
import { cache, cacheKey, fetchShared } from "./cache";

/**
 * const { data, loading, fetching, error, refresh, setData } = useApi("/transactions", { page: 1 });
 *  - loading  : true only on the very first load (no data to show yet) -> show a skeleton
 *  - fetching : true whenever a request is running (use it to dim old data)
 */
export function useApi(url, params = {}, { enabled = true } = {}) {
  const key = cacheKey(url, params);
  const [data, setData] = useState(() => cache.get(key)?.data ?? null);
  const [fetching, setFetching] = useState(enabled);
  const [error, setError] = useState("");
  const reqId = useRef(0);

  const refresh = useCallback(async () => {
    const id = ++reqId.current;
    setFetching(true);
    try {
      const result = await fetchShared(api, url, params);
      if (id === reqId.current) {
        setData(result);
        setError("");
      }
    } catch (e) {
      if (id === reqId.current) setError(e.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      if (id === reqId.current) setFetching(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!enabled) return;
    const hit = cache.get(key);
    if (hit) setData(hit.data);
    refresh();
  }, [key, enabled, refresh]);

  return { data, loading: data === null && fetching, fetching, error, refresh, setData };
}

// Warm the cache before the user even opens a page
export function prefetch(url, params = {}) {
  const hit = cache.get(cacheKey(url, params));
  if (hit && Date.now() - hit.time < 20000) return;
  fetchShared(api, url, params).catch(() => {});
}
