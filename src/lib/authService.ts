import { supabase } from './supabaseClient';

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'client' | 'admin' | string;
  created_at?: string;
}

export interface ClientProfile {
  user_id: string;
  company_name: string;
  city: string;
  state: string;
  created_at?: string;
}

export interface SignUpData {
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  company_name: string;
  city?: string;
  state?: string;
}

export interface SignInData {
  email: string;
  password?: string;
}

/**
 * Signs up a new user, inserts their profile into the `users` table,
 * and then creates a `clients` record.
 */
export async function signUpClient({
  email,
  password,
  first_name,
  last_name,
  company_name,
  city = '',
  state = ''
}: SignUpData) {
  // 1. Basic validation
  if (!email || !password || !first_name || !last_name || !company_name) {
    return { data: null, error: new Error('Missing required fields') };
  }

  try {
    // 2. Create Supabase Auth User
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name,
          last_name,
        }
      }
    });

    if (authError) throw authError;

    const user = authData?.user;
    if (!user) throw new Error('Failed to create auth user');

    // 3. Insert Record Into `users` Table
    // Use upsert in case there are database triggers that auto-create the row
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: user.id, // references auth.users.id
        email: email,
        first_name: first_name,
        last_name: last_name,
        role: 'Client' // Updated to match Enum definition
      });

    if (userError) throw userError;

    // 4. Automatically Insert Into `clients` Table
    const clientPayload: any = {
      user_id: user.id, // references users.id
      company_name: company_name,
    };

    // Only add city and state if they are non-empty to avoid enum errors for blanks
    if (city) clientPayload.city = city;
    if (state) clientPayload.state = state;

    const { error: clientError } = await supabase
      .from('clients')
      .insert(clientPayload);

    if (clientError) throw clientError;

    // Optional: Fetch the created profile data if needed
    const { data: finalUser } = await supabase
      .from('users')
      .select('*, clients(*)')
      .eq('id', user.id)
      .single();

    return { data: finalUser, error: null };

  } catch (error: any) {
    console.error('Sign Up Error:', error.message);
    return { data: null, error };
  }
}

/**
 * Signs in an existing user and retrieves their user and client profiles.
 */
export async function signInClient({ email, password }: SignInData) {
  if (!email || !password) {
    return { data: null, error: new Error('Email and password are required') };
  }

  try {
    // 1. Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw authError;

    const user = authData?.user;
    if (!user) throw new Error('Authentication failed');

    // 2. Fetch the user's profile from `users` table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    // 3. If role is client, fetch the client record
    let clientProfile = null;
    if (userProfile?.role?.toLowerCase() === 'client') {
      const { data: client, error: clientDataError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!clientDataError) {
        clientProfile = client;
      } else {
        console.warn('Could not fetch client profile for this user:', clientDataError.message);
      }
    }

    return {
      data: {
        session: authData.session,
        user: userProfile,
        client: clientProfile,
      },
      error: null,
    };

  } catch (error: any) {
    console.error('Sign In Error:', error.message);
    return { data: null, error };
  }
}
