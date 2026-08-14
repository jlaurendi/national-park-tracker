// Supabase browser client. Cloud sync is optional: when the env vars are
// absent (e.g. a fork built without them), the app runs local-only exactly
// as v1 did and all sign-in UI hides itself.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null | undefined;

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

/** Lazy singleton; null when cloud sync isn't configured. */
export function getSupabase(): SupabaseClient | null {
  if (client === undefined) {
    client = url && anonKey ? createClient(url, anonKey) : null;
  }
  return client;
}
