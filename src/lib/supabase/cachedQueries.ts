import { supabase } from '@/lib/supabaseClient';
import { cacheKeys, redisDel, withRedisCache } from '@/lib/redis/wrapper';

export type UnreadCountsResult = { counts: Record<string, number>; total: number };

const DEFAULT_UNREAD_TTL_SEC = 25;

function unreadTtlSec(): number {
  const n = Number(process.env.REDIS_CACHE_TTL_UNREAD_SEC);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_UNREAD_TTL_SEC;
}

async function fetchUnreadCountsFromSupabase(userId: string): Promise<UnreadCountsResult> {
  const { data, error } = await supabase
    .from('messages')
    .select('sender_id')
    .eq('receiver_id', userId)
    .eq('is_read', false);

  if (error) throw new Error(error.message);

  const counts: Record<string, number> = {};
  let total = 0;
  for (const row of data || []) {
    counts[row.sender_id] = (counts[row.sender_id] || 0) + 1;
    total++;
  }
  return { counts, total };
}

/**
 * Unread message aggregates for a user — Redis-cached when Upstash is configured.
 * Pass `fresh: true` to bypass the cache entry (e.g. after read receipts or push refresh).
 */
export async function getCachedUnreadCounts(
  userId: string,
  opts?: { fresh?: boolean }
): Promise<UnreadCountsResult> {
  if (opts?.fresh) {
    await redisDel(cacheKeys.supabaseUnreadCounts(userId));
  }
  return withRedisCache(cacheKeys.supabaseUnreadCounts(userId), unreadTtlSec(), () =>
    fetchUnreadCountsFromSupabase(userId)
  );
}

/** Call after marking messages read or sending (optional; short TTL still limits staleness). */
export function invalidateUnreadCountsCache(userId: string): void {
  void redisDel(cacheKeys.supabaseUnreadCounts(userId));
}
