import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

function getConnectionString() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }
  return connectionString;
}

function isSelfSignedCertError(error: any) {
  const msg = String(error?.message || error);
  return (
    msg.includes('self-signed certificate in certificate chain') ||
    msg.includes('self signed certificate') ||
    msg.includes('unable to verify the first certificate') ||
    error?.code === 'SELF_SIGNED_CERT_IN_CHAIN'
  );
}

function stripSslMode(connectionString: string) {
  try {
    const url = new URL(connectionString);
    url.searchParams.delete('sslmode');
    return url.toString();
  } catch {
    return connectionString;
  }
}

async function withPgPool<T>(fn: (pool: Pool) => Promise<T>): Promise<T> {
  const connectionString = getConnectionString();
  let pool = new Pool({ connectionString });

  try {
    return await fn(pool);
  } catch (error: any) {
    if (!isSelfSignedCertError(error)) throw error;

    await pool.end();
    const retryConnectionString = stripSslMode(connectionString);
    pool = new Pool({
      connectionString: retryConnectionString,
      ssl: { rejectUnauthorized: false },
    });
    return await fn(pool);
  } finally {
    await pool.end();
  }
}

function getPool() {
  // Kept for backward compatibility within this file; prefer withPgPool() below.
  return new Pool({ connectionString: getConnectionString() });
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  try {
    const rows = await withPgPool(async (pool) => {
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
      return rows;
    });

    return NextResponse.json(rows);
  } catch (error: any) {
    if (error.message?.includes('does not exist')) {
      return NextResponse.json([]);
    }
    console.error('Error fetching groups:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, createdBy, members } = body;

  if (!name || !createdBy || !members || !Array.isArray(members) || members.length === 0) {
    return NextResponse.json({ error: 'name, createdBy, and members[] required' }, { status: 400 });
  }

  try {
    const createdGroup = await withPgPool(async (pool) => {
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

        return rows[0];
      } catch (error: any) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });

    return NextResponse.json(createdGroup, { status: 201 });
  } catch (error: any) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
