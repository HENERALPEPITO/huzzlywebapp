import { NextRequest, NextResponse } from 'next/server';
import { getCachedUnreadCounts } from '@/lib/supabase/cachedQueries';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  const fresh = req.nextUrl.searchParams.get('fresh') === '1';

  try {
    const { counts, total } = await getCachedUnreadCounts(userId, { fresh });
    return NextResponse.json({ counts, total });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Unread counts error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
