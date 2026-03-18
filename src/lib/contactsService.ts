import { supabase } from './supabaseClient';

export interface Contact {
  worker_id: string;
  user_id: string;
  name: string;
}

interface WorkerRow {
  id: string;
  user_id: string;
}

interface UserRow {
  id: string;
  first_name: string | null;
  email: string | null;
}

function formatSupabaseError(error: any) {
  if (!error) return null;
  return {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
    status: error.status,
    name: error.name,
    raw: String(error),
  };
}

/**
 * Fetches the list of contacts from the worker table with user information
 * Uses a two-step query (worker -> users) to avoid relying on PostgREST relationship naming.
 */
export async function fetchContacts(): Promise<Contact[]> {
  try {
    // 1) Fetch worker rows
    const { data: workers, error: workersError } = await supabase
      .from('worker')
      .select('id, user_id');

    if (workersError) {
      console.error('Error fetching workers:', formatSupabaseError(workersError));
      throw workersError;
    }

    if (!workers || !Array.isArray(workers)) {
      console.warn('No data returned from worker query');
      return [];
    }

    const workerRows = workers as WorkerRow[];
    const userIds = Array.from(new Set(workerRows.map((w) => w.user_id).filter(Boolean)));

    if (userIds.length === 0) {
      return [];
    }

    // 2) Fetch user rows
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, first_name, email')
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching users for contacts:', formatSupabaseError(usersError));
      throw usersError;
    }

    const userById = new Map<string, UserRow>();
    (users as UserRow[] | null)?.forEach((u) => userById.set(u.id, u));

    const contacts: Contact[] = workerRows
      .map((w) => {
        const user = userById.get(w.user_id);
        if (!user) return null;

        let displayName = user.first_name || 'Unknown';
        if (displayName === 'Unknown' && user.email) {
          displayName = user.email.split('@')[0];
        }

        return {
          worker_id: w.id,
          user_id: w.user_id,
          name: displayName,
        };
      })
      .filter(Boolean) as Contact[];

    console.log(`Fetched ${contacts.length} contacts`);
    return contacts;
  } catch (error) {
    console.error('Failed to fetch contacts:', formatSupabaseError(error));
    throw error;
  }
}
