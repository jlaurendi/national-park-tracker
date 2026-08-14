'use client';

// Client wrapper that loads leaflet browser-only. `ssr: false` is only legal
// inside a client component in the App Router, which is why this file exists.

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/Skeleton';

export const ParksMapLazy = dynamic(() => import('./ParksMap'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});

export type { MapPin } from './ParksMap';
