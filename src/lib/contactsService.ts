import { supabase } from './supabaseClient';

export interface Contact {
  worker_id: string;
  user_id: string;
  name: string;
}

interface WorkerRow {
  id: string;
  user_id: string;
  users: {
    first_name: string | null;
    email?: string;
  } | null;
}

/**
 * Fetches the list of contacts from the worker table with user information
 * Uses Supabase relational select to join with the users table
 */
export async function fetchContacts(): Promise<Contact[]> {
  try {
    const { data, error } = await supabase
      .from('worker')
      .select(`
        id,
        user_id,
        users (
          first_name,
          email
        )
      `);

    if (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }

    if (!data || !Array.isArray(data)) {
      console.warn('No data returned from worker query');
      return [];
    }

    // Transform the data to the expected format
    const contacts: Contact[] = data
      .filter((worker: WorkerRow) => worker.users)
      .map((worker: WorkerRow) => {
        const user = worker.users!;
        // Use first_name if available, otherwise extract from email
        let displayName = user.first_name || 'Unknown';
        
        if (displayName === 'Unknown' && user.email) {
          displayName = user.email.split('@')[0];
        }
        
        return {
          worker_id: worker.id,
          user_id: worker.user_id,
          name: displayName,
        };
      });

    console.log(`Fetched ${contacts.length} contacts`);
    return contacts;
  } catch (error) {
    console.error('Failed to fetch contacts:', error);
    throw error;
  }
}
