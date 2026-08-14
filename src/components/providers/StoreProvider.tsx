'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { useAppStore } from '@/store';
import { getSupabase } from '@/lib/supabase/client';
import {
  activateCloudRepositories,
  activateLocalRepositories,
  getLocalRepositories,
} from '@/lib/repositories';

/**
 * Boots persistence. Signed out (or cloud not configured): local IndexedDB,
 * exactly the v1 behavior. Signed in: Supabase repositories. Every auth
 * transition swaps the active repositories and re-hydrates the store; pages
 * gate on `hydrated` and render skeletons, so the first client render always
 * matches the server HTML.
 */
export function StoreProvider({ children }: { children: ReactNode }) {
  // Guards against redundant re-hydration from duplicate auth events
  // (INITIAL_SESSION, TOKEN_REFRESHED, ...).
  const activeKey = useRef<string | null>(null);

  useEffect(() => {
    const store = () => useAppStore.getState();
    const supabase = getSupabase();

    if (!supabase) {
      activateLocalRepositories();
      store().setAuth({ status: 'disabled' });
      void store().rehydrate();
      return;
    }

    /** rehydrate with one retry — the first request after a sign-in can race
     *  the session update and briefly see a stale token. */
    async function rehydrateWithRetry() {
      try {
        await store().rehydrate();
      } catch {
        await new Promise((r) => setTimeout(r, 600));
        await store().rehydrate();
      }
    }

    async function apply(session: Session | null) {
      const key = session?.user?.id ?? 'local';
      if (key === activeKey.current) return;
      activeKey.current = key;

      // Never show the previous mode's data while switching — skeleton-gate
      // until the new source has loaded.
      useAppStore.setState({ hydrated: false, migrationOffer: null });

      try {
        if (session?.user) {
          activateCloudRepositories(supabase!, session.user.id);
          store().setAuth({
            status: 'signed-in',
            email: session.user.email ?? undefined,
            userId: session.user.id,
          });
          await rehydrateWithRetry();
          await maybeOfferMigration();
        } else {
          activateLocalRepositories();
          store().setAuth({ status: 'signed-out' });
          await rehydrateWithRetry();
        }
      } catch (err) {
        // Don't leave another mode's records on screen; empty is safer.
        useAppStore.setState({
          hydrated: true,
          visits: [],
          trips: [],
          goals: [],
          earnedBadges: [],
          photos: [],
        });
        activeKey.current = null; // allow the next auth event to retry
        toast.error(
          err instanceof Error ? err.message : 'Loading your data failed — try reloading.',
        );
      }
    }

    /** Fresh cloud account + existing local data → offer to move it over. */
    async function maybeOfferMigration() {
      const s = store();
      const cloudEmpty =
        s.visits.length === 0 &&
        s.trips.length === 0 &&
        s.goals.length === 0 &&
        s.photos.length === 0;
      if (!cloudEmpty) return;
      const local = getLocalRepositories();
      const [visits, trips, goals, photos] = await Promise.all([
        local.visits.getAll(),
        local.trips.getAll(),
        local.goals.getAll(),
        local.photos.getAll(),
      ]);
      if (visits.length + trips.length + goals.length + photos.length === 0) return;
      useAppStore.setState({
        migrationOffer: {
          visits: visits.length,
          trips: trips.length,
          goals: goals.length,
          photos: photos.length,
        },
      });
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Deferred out of the callback tick per supabase-js guidance: calling
      // other client methods synchronously here can race the session update.
      setTimeout(() => void apply(session), 0);
    });
    void supabase.auth.getSession().then(({ data }) => apply(data.session));

    return () => subscription.unsubscribe();
  }, []);

  return <>{children}</>;
}
