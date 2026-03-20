import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export const runtime = 'nodejs';

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

  try {
    const createdGroup = await withPgPool(async (pool) => {
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

      return rows[0] || { error: 'Group not found' };
    });

    return NextResponse.json(createdGroup);
  } catch (error: any) {
    console.error('Error adding members:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
