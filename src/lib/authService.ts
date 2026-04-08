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
  company_name?: string;
  role?: 'worker' | 'employer';
  city?: string;
  state?: string;
  /** If true, only creates the Supabase auth user; call `completeSignUpProfile` after OTP verification. */
  deferProfileUntilVerified?: boolean;
}

export interface CompleteSignUpProfileData {
  userId: string;
  email: string;
  first_name: string;
  last_name: string;
  role?: 'worker' | 'employer';
  company_name?: string;
  city?: string;
  state?: string;
}

export interface SignInData {
  email: string;
  password?: string;
}

async function insertSignUpProfile({
  userId,
  emailNorm,
  firstNorm,
  lastNorm,
  role,
  company_name,
  city,
  state,
}: {
  userId: string;
  emailNorm: string;
  firstNorm: string;
  lastNorm: string;
  role: 'worker' | 'employer';
  company_name?: string;
  city: string;
  state: string;
}) {
  const userRole = role === 'employer' ? 'Client' : 'Worker';

  const { error: userError } = await supabase
    .from('users')
    .upsert({
      id: userId,
      email: emailNorm,
      first_name: firstNorm,
      last_name: lastNorm,
      role: userRole,
      onboarding_completed: false,
    });

  if (userError) throw userError;

  if (role === 'employer' && company_name) {
    const clientPayload: Record<string, string> = {
      user_id: userId,
      company_name: company_name,
    };

    if (city) clientPayload.city = city;
    if (state) clientPayload.state = state;

    const { error: clientError } = await supabase.from('clients').insert(clientPayload);

    if (clientError) {
      console.error('Client insert error:', clientError.message || clientError);
      throw clientError;
    }
  }

  const { data: finalUser, error: selectError } = await supabase
    .from('users')
    .select('*, clients(*)')
    .eq('id', userId)
    .single();

  if (selectError) throw selectError;
  return finalUser;
}

/**
 * Inserts `users` (and employer `clients`) after email/phone OTP verification.
 */
export async function completeSignUpProfile({
  userId,
  email,
  first_name,
  last_name,
  role = 'worker',
  company_name,
  city = '',
  state = '',
}: CompleteSignUpProfileData) {
  const emailNorm = (email ?? '').trim();
  const firstNorm = (first_name ?? '').trim();
  const lastNorm = (last_name ?? '').trim();

  if (!userId || !emailNorm || !firstNorm) {
    return { data: null, error: new Error('Missing required fields') };
  }

  if (role === 'employer' && !company_name) {
    return { data: null, error: new Error('Company name is required for employers') };
  }

  try {
    const finalUser = await insertSignUpProfile({
      userId,
      emailNorm,
      firstNorm,
      lastNorm,
      role,
      company_name,
      city,
      state,
    });
    return { data: finalUser, error: null };
  } catch (error: any) {
    console.error('Complete sign-up profile error:', error.message);
    return { data: null, error };
  }
}

/**
 * Signs up a new user. By default inserts `users` (+ `clients` for employers).
 * With `deferProfileUntilVerified`, only creates the auth user; call `completeSignUpProfile` after OTP.
 */
export async function signUpClient({
  email,
  password,
  first_name,
  last_name,
  company_name,
  role = 'worker',
  city = '',
  state = '',
  deferProfileUntilVerified = false,
}: SignUpData) {
  const emailNorm = (email ?? '').trim();
  const firstNorm = (first_name ?? '').trim();
  const lastNorm = (last_name ?? '').trim();

  // Only first name is required; single-word "Full name" in the UI yields empty last_name.
  if (!emailNorm || !password || !firstNorm) {
    return { data: null, error: new Error('Missing required fields') };
  }

  // Company is collected in employer onboarding after OTP — only require when inserting profile immediately.
  if (role === 'employer' && !company_name?.trim() && !deferProfileUntilVerified) {
    return { data: null, error: new Error('Company name is required for employers') };
  }

  const siteOrigin =
    typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '') || '';

  try {
    // Auth emails (OTP / confirm) are sent by Supabase using your configured provider (e.g. Resend SMTP).
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: emailNorm,
      password,
      options: {
        emailRedirectTo: siteOrigin ? `${siteOrigin}/` : undefined,
        data: {
          first_name: firstNorm,
          last_name: lastNorm,
          ...(role === 'employer' ? { signup_role: 'employer' } : {}),
        },
      },
    });

    if (authError) throw authError;

    const user = authData?.user;
    if (!user) throw new Error('Failed to create auth user');

    if (deferProfileUntilVerified) {
      return { data: null, error: null };
    }

    const finalUser = await insertSignUpProfile({
      userId: user.id,
      emailNorm,
      firstNorm,
      lastNorm,
      role,
      company_name,
      city,
      state,
    });

    return { data: finalUser, error: null };

  } catch (error: any) {
    console.error('Sign Up Error:', error.message);
    return { data: null, error };
  }
}

const siteOriginForAuthEmail = () =>
  typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '') || '';

/**
 * Sends an email OTP / magic link via Supabase Auth (Resend SMTP, etc.).
 * Use this for the “enter 6-digit code” UI — `signUp()` usually emails a **link**, not a code.
 * Dashboard: Authentication → Providers → Email → enable **Email OTP** (or use a template with `{{ .Token }}`).
 */
export function requestEmailSignupOtp({
  email,
  firstName,
  lastName,
  signupRole,
}: {
  email: string;
  firstName: string;
  lastName: string;
  signupRole: 'worker' | 'employer';
}) {
  const origin = siteOriginForAuthEmail();
  return supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      shouldCreateUser: true,
      emailRedirectTo: origin ? `${origin}/` : undefined,
      data: {
        first_name: firstName,
        last_name: lastName,
        signup_role: signupRole,
      },
    },
  });
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
