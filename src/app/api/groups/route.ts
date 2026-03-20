import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

function getPool() {
  return new Pool({ connectionString: process.env.DATABASE_URL });
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  const pool = getPool();
  try {
    const { rows } = await pool.query(
      `SELECT g.id, g.name, g.created_by, g.created_at,
              json_agg(json_build_object('user_id', gm.user_id, 'user_name', gm.user_name)) as members
       FROM groups g
       JOIN group_members gm ON gm.group_id = g.id
       WHERE g.id IN (SELECT group_id FROM group_members WHERE user_id = $1)
       GROUP BY g.id
       ORDER BY g.created_at DESC`,
      [userId]
    );
    return NextResponse.json(rows);
  } catch (error: any) {
    if (error.message?.includes('does not exist')) {
      return NextResponse.json([]);
    }
    console.error('Error fetching groups:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await pool.end();
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, createdBy, members } = body;

  if (!name || !createdBy || !members || !Array.isArray(members) || members.length === 0) {
    return NextResponse.json({ error: 'name, createdBy, and members[] required' }, { status: 400 });
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { rows: [group] } = await client.query(
      'INSERT INTO groups (name, created_by) VALUES ($1, $2) RETURNING *',
      [name, createdBy]
    );

    const allMembers = [...members];
    if (!allMembers.find((m: any) => m.user_id === createdBy)) {
      allMembers.push({ user_id: createdBy, user_name: 'You' });
    }

    for (const member of allMembers) {
      await client.query(
        'INSERT INTO group_members (group_id, user_id, user_name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [group.id, member.user_id, member.user_name || '']
      );
    }

    await client.query('COMMIT');

    const { rows } = await client.query(
      `SELECT g.id, g.name, g.created_by, g.created_at,
              json_agg(json_build_object('user_id', gm.user_id, 'user_name', gm.user_name)) as members
       FROM groups g
       JOIN group_members gm ON gm.group_id = g.id
       WHERE g.id = $1
       GROUP BY g.id`,
      [group.id]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error creating group:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
    await pool.end();
  }
}
