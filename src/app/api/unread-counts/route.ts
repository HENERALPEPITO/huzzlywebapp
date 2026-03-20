import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('receiver_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching unread counts:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const counts: Record<string, number> = {};
    let total = 0;
    for (const row of data || []) {
      counts[row.sender_id] = (counts[row.sender_id] || 0) + 1;
      total++;
    }

    return NextResponse.json({ counts, total });
  } catch (error: any) {
    console.error('Unread counts error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
