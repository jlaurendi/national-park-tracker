-- Defense in depth: hosted Supabase's default privileges grant table access
-- to the anon role (RLS already returns zero rows for it, so this closes the
-- door at the grant level too — unauthenticated requests get denied outright
-- instead of receiving empty result sets).

revoke all on public.visits from anon;
revoke all on public.trips from anon;
revoke all on public.goals from anon;
revoke all on public.earned_badges from anon;
revoke all on public.photos from anon;
