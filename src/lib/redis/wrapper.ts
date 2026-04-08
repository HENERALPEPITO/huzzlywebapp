import { Redis } from '@upstash/redis';

/**
 * Redis cache wrapper for server-side use (API routes, Server Actions).
 *
 * Configure Upstash Redis (HTTPS, serverless-friendly):
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * If either is missing, all operations no-op: reads miss, writes skip, `withRedisCache` runs the fetcher only.
 */

let redisSingleton: Redis | null | undefined;

export function isRedisConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  );
}

export function getRedis(): Redis | null {
  if (redisSingleton !== undefined) return redisSingleton;
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    redisSingleton = null;
    return null;
  }
  redisSingleton = new Redis({ url, token });
  return redisSingleton;
}

export async function redisGetJson<T>(key: string): Promise<T | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    const raw = await r.get<string>(key);
    if (raw == null) return null;
    return JSON.parse(typeof raw === 'string' ? raw : JSON.stringify(raw)) as T;
  } catch (e) {
    console.warn('[redis] get', key, e);
    return null;
  }
}

export async function redisSetJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.set(key, JSON.stringify(value), { ex: Math.max(1, ttlSeconds) });
  } catch (e) {
    console.warn('[redis] set', key, e);
  }
}

export async function redisDel(...keys: string[]): Promise<void> {
  const r = getRedis();
  if (!r || keys.length === 0) return;
  try {
    await r.del(...keys);
  } catch (e) {
    console.warn('[redis] del', keys, e);
  }
}

/**
 * Cache-aside: return cached JSON or run `fetcher`, store result with TTL.
 */
export async function withRedisCache<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
  const r = getRedis();
  if (!r) return fetcher();

  try {
    const hit = await redisGetJson<T>(key);
    if (hit !== null) return hit;
  } catch {
    /* fall through */
  }

  const fresh = await fetcher();
  await redisSetJson(key, fresh, ttlSeconds);
  return fresh;
}

/** Key helpers — keep Supabase-related cache keys in one namespace */
export const cacheKeys = {
  supabaseUnreadCounts: (userId: string) => `huzzly:supabase:unread_counts:${userId}`,
} as const;
