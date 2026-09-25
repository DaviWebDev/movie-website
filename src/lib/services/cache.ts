interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const store = new Map<string, CacheEntry<any>>();

export async function cached<T>(key: string, fn: () => Promise<T>, maxAge: number): Promise<T> {
  const entry = store.get(key);

  if (entry && Date.now() - entry.timestamp < maxAge) {
    return entry.data;
  }

  const data = await fn();
  store.set(key, { data, timestamp: Date.now() });
  return data;
}
