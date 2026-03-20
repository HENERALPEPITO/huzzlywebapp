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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;

  try {
    const rows = await withPgPool(async (pool) => {
      const { rows } = await pool.query(
        `SELECT id, group_id, sender_id, sender_name, content, attachments, sent_at
         FROM group_messages
         WHERE group_id = $1
         ORDER BY sent_at ASC`,
        [groupId]
      );
      return rows;
    });

    return NextResponse.json(rows);
  } catch (error: any) {
    if (error.message?.includes('does not exist')) {
      return NextResponse.json([]);
    }
    console.error('Error fetching group messages:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const body = await req.json();
  const { senderId, senderName, content, attachments } = body;

  if (!senderId || (!content && !attachments)) {
    return NextResponse.json({ error: 'senderId and content or attachments required' }, { status: 400 });
  }

  try {
    const msg = await withPgPool(async (pool) => {
      const { rows: [msg] } = await pool.query(
        `INSERT INTO group_messages (group_id, sender_id, sender_name, content, attachments)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [groupId, senderId, senderName || '', content || '', attachments ? JSON.stringify(attachments) : null]
      );
      return msg;
    });

    return NextResponse.json(msg, { status: 201 });
  } catch (error: any) {
    console.error('Error sending group message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
