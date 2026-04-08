import { supabase } from './supabaseClient';

/** True when `public.users.onboarding_completed` is set (employer billing step or worker welcome flow). */
export async function isOnboardingCompleted(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('onboarding_completed')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[onboarding] isOnboardingCompleted:', error.message);
    return false;
  }
  if (!data) return false;
  return data.onboarding_completed === true;
}

/** Marks worker onboarding done after the marketing/welcome steps (employers use facility + billing). */
export async function completeWorkerOnboarding(userId: string): Promise<void> {
  const { data: profile, error: selErr } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (selErr) throw selErr;
  if (profile?.role?.toLowerCase() !== 'worker') {
    throw new Error('Worker onboarding completion is only valid for Worker profiles.');
  }

  const { error } = await supabase
    .from('users')
    .update({
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw error;
}

/** Postgrest / Supabase errors are plain objects; surface `message`, `details`, and `hint`. */
export function formatPersistError(e: unknown): string {
  if (e == null) return 'Something went wrong.';
  if (typeof e === 'object' && e !== null && 'message' in e) {
    const o = e as { message?: string; details?: string; hint?: string; code?: string };
    const parts = [o.message, o.details, o.hint].filter((x) => x && String(x).trim());
    if (parts.length) return parts.join(' — ');
  }
  if (e instanceof Error) return e.message;
  return String(e);
}

/** DB enum `us_state` — only these values are accepted on `public.clients.state`. */
const US_STATE_ENUM = new Set(['NC', 'SC', 'VA']);

export type BillingPreference = 'stripe' | 'card' | 'ach';

export function normalizeUsStateForDb(input: string): 'NC' | 'SC' | 'VA' | null {
  const s = input.trim().toUpperCase();
  if (US_STATE_ENUM.has(s)) return s as 'NC' | 'SC' | 'VA';
  const map: Record<string, 'NC' | 'SC' | 'VA'> = {
    'NORTH CAROLINA': 'NC',
    'SOUTH CAROLINA': 'SC',
    'VIRGINIA': 'VA',
  };
  return map[s] ?? null;
}

export async function uploadOnboardingFile(
  userId: string,
  file: File,
  prefix: 'logo' | 'docs',
): Promise<string> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `onboarding/${userId}/${prefix}_${timestamp}_${safeName}`;

  const { error: uploadError } = await supabase.storage.from('message-files').upload(filePath, file, {
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data: pub } = supabase.storage.from('message-files').getPublicUrl(filePath);
  if (pub?.publicUrl) return pub.publicUrl;

  const { data: signed, error: signedError } = await supabase.storage
    .from('message-files')
    .createSignedUrl(filePath, 60 * 60 * 24 * 365);
  if (signedError || !signed?.signedUrl) {
    throw signedError || new Error('Could not resolve file URL');
  }
  return signed.signedUrl;
}

export async function saveOnboardingPersonal(
  userId: string,
  fields: { firstName: string; lastName: string; email: string; phone: string },
): Promise<void> {
  const now = new Date().toISOString();
  const emailNorm = fields.email.trim();

  const { data: existing, error: selErr } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (selErr) throw selErr;

  const base = {
    first_name: fields.firstName.trim(),
    last_name: fields.lastName.trim(),
    phone: fields.phone.trim() || null,
    onboarding_step: 1,
    updated_at: now,
  };

  if (existing?.id) {
    const { data: au } = await supabase.auth.getUser();
    const emailFromAuth = au?.user?.email?.trim() || null;
    const resolvedEmail = emailNorm || emailFromAuth;
    const updatePayload: Record<string, unknown> = { ...base };
    if (resolvedEmail) updatePayload.email = resolvedEmail;
    const { error } = await supabase.from('users').update(updatePayload).eq('id', userId);
    if (error) throw error;
    return;
  }

  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;

  const authEmail = authData?.user?.email?.trim() || null;
  const emailToStore = emailNorm || authEmail;
  if (!emailToStore) {
    throw new Error(
      'Add an email address in the form, or link an email to your account in Supabase Auth.',
    );
  }

  // Employer onboarding wizard: new profiles default to Client so steps 2–3 can write `clients`.
  const { error } = await supabase.from('users').insert({
    id: userId,
    email: emailToStore,
    ...base,
    role: 'Client',
    is_active: true,
  });

  if (error) throw error;
}

export async function saveOnboardingBusiness(
  userId: string,
  fields: {
    companyName: string;
    businessType: string;
    city: string;
    state: string;
    zip: string;
    ein: string;
  },
  files: { logo: File | null; doc: File | null },
): Promise<void> {
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) throw profileError;

  if (profile?.role !== 'Client') {
    return;
  }

  const stateEnum = normalizeUsStateForDb(fields.state);
  if (!stateEnum) {
    throw new Error('State must be NC, SC, or VA (required for client addresses in the database).');
  }

  let logoUrl: string | null = null;
  if (files.logo) {
    logoUrl = await uploadOnboardingFile(userId, files.logo, 'logo');
    await supabase
      .from('users')
      .update({ profile_photo: logoUrl, updated_at: new Date().toISOString() })
      .eq('id', userId);
  }

  const row = {
    user_id: userId,
    company_name: fields.companyName.trim(),
    city: fields.city.trim(),
    state: stateEnum,
    zip_code: fields.zip.trim() || null,
    ein_number: fields.ein.trim() || null,
    onboarding_step: 2,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase.from('clients').select('id').eq('user_id', userId).maybeSingle();

  if (existing?.id) {
    const { error } = await supabase.from('clients').update(row).eq('user_id', userId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('clients').insert(row);
    if (error) throw error;
  }

  if (fields.businessType.trim()) {
    const { error: evErr } = await supabase.from('analytics_events').insert({
      user_id: userId,
      event_name: 'employer_onboarding_business_type',
      metadata: { business_type: fields.businessType.trim() },
    });
    if (evErr) console.warn('analytics_events insert:', evErr.message);
  }

  if (files.doc) {
    const docUrl = await uploadOnboardingFile(userId, files.doc, 'docs');
    const { data: client } = await supabase.from('clients').select('id').eq('user_id', userId).maybeSingle();
    if (client?.id) {
      const { error: docErr } = await supabase.from('client_required_docs').insert({
        client_id: client.id,
        file_path: docUrl,
      });
      if (docErr) console.warn('client_required_docs insert:', docErr.message);
    }
  }
}

async function insertBillingPreference(userId: string, method: BillingPreference): Promise<void> {
  const type = method === 'ach' ? 'Bank' : 'Card';
  const { error } = await supabase.from('payment_methods').insert({
    user_id: userId,
    type,
    provider: method === 'stripe' ? 'stripe' : method === 'card' ? 'card' : 'ach',
    last4: null,
    is_default: true,
  });
  if (error) throw error;
}

export async function saveOnboardingBilling(
  userId: string,
  options: { payment: BillingPreference | null; skipped: boolean; deferEmployerCompletion?: boolean },
): Promise<void> {
  const { data: profile } = await supabase.from('users').select('role').eq('id', userId).maybeSingle();

  if (profile?.role === 'Client' && options.payment && !options.skipped) {
    try {
      await insertBillingPreference(userId, options.payment);
    } catch (e) {
      console.warn('payment_methods insert skipped:', e);
    }
  }

  const now = new Date().toISOString();
  const defer =
    profile?.role === 'Client' && options.deferEmployerCompletion === true;

  const { error: userErr } = await supabase
    .from('users')
    .update({
      onboarding_step: 3,
      onboarding_completed: defer ? false : true,
      updated_at: now,
    })
    .eq('id', userId);

  if (userErr) throw userErr;

  if (profile?.role === 'Client' && !defer) {
    await supabase
      .from('clients')
      .update({
        onboarding_step: 3,
        onboarding_status: 'complete',
        onboarding_completed_at: now,
        updated_at: now,
      })
      .eq('user_id', userId);
  }
}

export type EmployerWebSummaryPayload = {
  organizationName: string;
  locationName: string;
  address: string;
  primaryLocation: boolean;
  managerName: string;
  managerPhone: string;
  managerEmail: string;
  managerRole: string;
};

/** After Figma “Summary” Save — marks employer onboarding complete and logs structured answers. */
export async function finalizeEmployerWebOnboarding(
  userId: string,
  payload: EmployerWebSummaryPayload,
): Promise<void> {
  const now = new Date().toISOString();

  const { error: evErr } = await supabase.from('analytics_events').insert({
    user_id: userId,
    event_name: 'employer_web_onboarding_summary',
    metadata: payload as unknown as Record<string, unknown>,
  });
  if (evErr) console.warn('analytics_events employer summary:', evErr.message);

  const { error: userErr } = await supabase
    .from('users')
    .update({
      onboarding_completed: true,
      updated_at: now,
    })
    .eq('id', userId);
  if (userErr) throw userErr;

  const { error: clientErr } = await supabase
    .from('clients')
    .update({
      onboarding_step: 3,
      onboarding_status: 'complete',
      onboarding_completed_at: now,
      updated_at: now,
      ...(payload.organizationName.trim()
        ? { company_name: payload.organizationName.trim() }
        : {}),
    })
    .eq('user_id', userId);
  if (clientErr) throw clientErr;
}
