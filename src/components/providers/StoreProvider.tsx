'use client';

import { useEffect, type ReactNode } from 'react';
import { useAppStore } from '@/store';

/**
 * Kicks off the one-time IndexedDB → store hydration. Children render
 * immediately; data-driven components gate on `hydrated` and show skeletons,
 * so the first client render always matches the server HTML.
 */
export function StoreProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    void useAppStore.getState().hydrate();
  }, []);
  return <>{children}</>;
}
