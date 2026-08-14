'use client';

// Object URLs for photo blobs, with a refcounted module cache. Every
// createObjectURL is revoked ~30s after its last consumer unmounts — the
// delay avoids constant recreate churn while scrolling a photo grid.

import { useEffect, useState } from 'react';
import { getRepositories } from '@/lib/repositories';

type Variant = 'display' | 'thumb';

interface CacheEntry {
  url?: string;
  promise?: Promise<string | undefined>;
  refs: number;
  timer?: number;
}

const cache = new Map<string, CacheEntry>();
const REVOKE_DELAY_MS = 30_000;

export function usePhotoUrl(photoId: string, variant: Variant): string | undefined {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    const key = `${photoId}:${variant}`;
    let entry = cache.get(key);
    if (!entry) {
      entry = { refs: 0 };
      cache.set(key, entry);
    }
    entry.refs += 1;
    if (entry.timer !== undefined) {
      window.clearTimeout(entry.timer);
      entry.timer = undefined;
    }

    if (entry.url) {
      // Deferred so the effect body never sets state synchronously (the URL
      // is an external-cache read, not derived React state).
      const cachedUrl = entry.url;
      queueMicrotask(() => {
        if (!cancelled) setUrl(cachedUrl);
      });
    } else {
      entry.promise ??= (async () => {
        const repo = getRepositories().photos;
        const blob =
          variant === 'display'
            ? await repo.getDisplayBlob(photoId)
            : await repo.getThumbBlob(photoId);
        if (!blob) return undefined;
        const objectUrl = URL.createObjectURL(blob);
        const current = cache.get(key);
        if (!current || current.refs <= 0) {
          // Everyone left while we were loading.
          URL.revokeObjectURL(objectUrl);
          cache.delete(key);
          return undefined;
        }
        current.url = objectUrl;
        return objectUrl;
      })();
      void entry.promise.then((objectUrl) => {
        if (!cancelled && objectUrl) setUrl(objectUrl);
      });
    }

    return () => {
      cancelled = true;
      const current = cache.get(key);
      if (!current) return;
      current.refs -= 1;
      if (current.refs <= 0) {
        current.timer = window.setTimeout(() => {
          const stale = cache.get(key);
          if (stale && stale.refs <= 0) {
            if (stale.url) URL.revokeObjectURL(stale.url);
            cache.delete(key);
          }
        }, REVOKE_DELAY_MS);
      }
    };
  }, [photoId, variant]);

  return url;
}
