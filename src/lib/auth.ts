// Thin wrappers around Supabase email auth. The email carries a sign-in link
// and/or a 6-digit code depending on the project's email template (free-tier
// hosted projects can't customize the template, so they send the default
// link; our local stack and SMTP-configured projects send the code). The app
// supports both: codes via verifyOtp below, links via supabase-js's
// detectSessionInUrl when the user lands back on the site.

import { getSupabase } from './supabase/client';

function client() {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Cloud sync is not configured in this build.');
  return supabase;
}

export async function requestOtp(email: string): Promise<void> {
  const { error } = await client().auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      // Bring link-clickers back to the page they started on.
      emailRedirectTo: typeof window === 'undefined' ? undefined : window.location.href,
    },
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
