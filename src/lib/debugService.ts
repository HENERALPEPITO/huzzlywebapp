import { supabase } from './supabaseClient';

interface WorkerData {
  id: string;
  user_id: string;
}

interface ContactData {
  id: string;
  user_id: string;
  users: {
    id: string;
    first_name: string | null;
    email: string | null;
  } | null;
}

/**
 * Debug utility to test worker and contacts queries
 */
export async function debugFetchWorkers() {
  console.log('=== Debug: Fetching all workers ===');
  
  try {
    // First, check if we can fetch raw worker data
    const { data: workers, error: workersError } = await supabase
      .from('worker')
      .select('id, user_id');

    if (workersError) {
      console.error('❌ Error fetching workers:', workersError);
      return;
    }

    console.log(`✓ Found ${workers?.length || 0} worker records`);
    console.log('Worker IDs:', workers?.map((w: WorkerData) => w.id) || []);

    if (!workers || workers.length === 0) {
      console.warn('⚠ No workers found in database');
      return;
    }

    // Now test the relational query
    console.log('\n=== Testing relational select ===');
    const { data: contactsData, error: contactsError } = await supabase
      .from('worker')
      .select(`
        id,
        user_id,
        users (
          id,
          first_name,
          email
        )
      `);

    if (contactsError) {
      console.error('❌ Error fetching contacts with relations:', contactsError);
      return;
    }

    console.log(`✓ Got ${contactsData?.length || 0} contacts with user data`);
    console.log('Sample data:', JSON.stringify(contactsData?.[0], null, 2));

    // Check for null user references
    const missing = contactsData?.filter((w: ContactData) => !w.users) || [];
    if (missing.length > 0) {
      console.warn(`⚠ ${missing.length} workers have no associated user`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

/**
 * Test basic Supabase connection
 */
export async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.warn('Not authenticated:', error.message);
    } else {
      console.log('✓ Connected. Current user:', user?.email);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
}

