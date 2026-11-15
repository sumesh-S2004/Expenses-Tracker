// Tiny stale-while-revalidate cache: pages show the last data instantly,
// then refresh quietly in the background.
export const cache = new Map();
const inflight = new Map();

export const cacheKey = (url, params) => `${url}?${JSON.stringify(params || {})}`;

export function clearCache() {
  cache.clear();
  inflight.clear();
}

// Same request fired twice at once (StrictMode, hover-prefetch + page load) = one network call.
export function fetchShared(api, url, params) {
  const key = cacheKey(url, params);
  if (inflight.has(key)) return inflight.get(key);
  const p = api
    .get(url, { params })
    .then((res) => {
      cache.set(key, { data: res.data, time: Date.now() });
      return res.data;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}
