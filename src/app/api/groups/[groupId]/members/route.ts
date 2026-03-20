import { NextRequest, NextResponse } from 'next/server';
import pg from 'pg';

const { Pool } = pg;

function getPool() {
  return new Pool({ connectionString: process.env.DATABASE_URL });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const body = await req.json();
  const { members } = body;

  if (!members || !Array.isArray(members) || members.length === 0) {
    return NextResponse.json({ error: 'members[] required' }, { status: 400 });
  }

  const pool = getPool();
  try {
    for (const member of members) {
      await pool.query(
        'INSERT INTO group_members (group_id, user_id, user_name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [groupId, member.user_id, member.user_name || '']
      );
    }

    const { rows } = await pool.query(
      `SELECT g.id, g.name, g.created_by, g.created_at,
              json_agg(json_build_object('user_id', gm.user_id, 'user_name', gm.user_name)) as members
       FROM groups g
       JOIN group_members gm ON gm.group_id = g.id
       WHERE g.id = $1
       GROUP BY g.id`,
      [groupId]
    );

    return NextResponse.json(rows[0] || { error: 'Group not found' });
  } catch (error: any) {
    console.error('Error adding members:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await pool.end();
  }
}
