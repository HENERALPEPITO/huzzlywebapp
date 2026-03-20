import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export const runtime = 'nodejs';

function getConnectionString() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }
  return connectionString;
}

function getDbHostname(connectionString: string) {
  try {
    return new URL(connectionString).hostname;
  } catch {
    return 'unknown';
  }
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
  const dbHost = getDbHostname(connectionString);
  let pool = new Pool({ connectionString });

  try {
    return await fn(pool);
  } catch (error: any) {
    // Helps diagnose Vercel DNS/egress issues without logging secrets.
    if (error?.code === 'ENOTFOUND') {
      console.error('DB hostname could not be resolved:', dbHost);
    }
    if (!isSelfSignedCertError(error)) throw error;

    // Retry with relaxed TLS verification for local/dev environments.
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

export async function POST() {
  try {
    await withPgPool(async (pool) => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS groups (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          created_by TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS group_members (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL,
          user_name TEXT NOT NULL DEFAULT '',
          joined_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(group_id, user_id)
        );

        CREATE TABLE IF NOT EXISTS group_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
          sender_id TEXT NOT NULL,
          sender_name TEXT NOT NULL DEFAULT '',
          content TEXT NOT NULL DEFAULT '',
          attachments JSONB,
          sent_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Group setup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
