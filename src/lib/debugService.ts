import { supabase } from './supabaseClient';

interface WorkerData {
  id: string;
  user_id: string;
}

type SupabaseErrorLike = {
  message?: string;
  details?: string | null;
  hint?: string | null;
  code?: string | null;
  status?: number;
};

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
      console.error('❌ Error fetching workers:', {
        message: workersError.message,
        details: workersError.details,
        hint: workersError.hint,
        code: workersError.code,
        status: (workersError as SupabaseErrorLike).status,
      });
      return;
    }

    console.log(`✓ Found ${workers?.length || 0} worker records`);
    console.log('Worker IDs:', workers?.map((w: WorkerData) => w.id) || []);

    if (!workers || workers.length === 0) {
      console.warn('⚠ No workers found in database');
      return;
    }

    // Now test two-step approach (worker -> users)
    console.log('\n=== Testing two-step contact fetch ===');
    const ids = Array.from(new Set((workers || []).map((w: WorkerData) => w.user_id).filter(Boolean)));
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, first_name, email')
      .in('id', ids);

    if (usersError) {
      console.error('❌ Error fetching users:', {
        message: usersError.message,
        details: usersError.details,
        hint: usersError.hint,
        code: usersError.code,
        status: (usersError as SupabaseErrorLike).status,
      });
      return;
    }

    console.log(`✓ Got ${users?.length || 0} user rows for contacts`);
    console.log('Sample user:', JSON.stringify(users?.[0], null, 2));

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

