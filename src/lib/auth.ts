// Thin wrappers around Supabase email-OTP auth. OTP codes (not magic links)
// so sign-in works identically on any host — no redirect URLs to configure.

import { getSupabase } from './supabase/client';

function client() {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Cloud sync is not configured in this build.');
  return supabase;
}

export async function requestOtp(email: string): Promise<void> {
  const { error } = await client().auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) throw new Error(error.message);
}

export async function verifyOtp(email: string, token: string): Promise<void> {
  const { error } = await client().auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw new Error(error.message);
}

export async function signOut(): Promise<void> {
  const { error } = await client().auth.signOut();
  if (error) throw new Error(error.message);
}
