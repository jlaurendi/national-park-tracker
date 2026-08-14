'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { PARKS } from '@/data/parks';
import { useParkStatuses } from '@/store/selectors';
import { ParksMapLazy, type MapPin } from './ParksMapLazy';

/** Non-interactive map card; clicking anywhere opens the full map. */
export function MiniMapPreview() {
  const statuses = useParkStatuses();
  const pins = useMemo<MapPin[]>(
    () => PARKS.map((park) => ({ park, status: statuses.get(park.id) ?? 'unvisited' })),
    [statuses],
  );

  return (
    <div className="relative h-64 overflow-hidden rounded-xl border border-border shadow-sm">
      <ParksMapLazy pins={pins} interactive={false} className="h-full w-full" />
      <Link
        href="/map"
        aria-label="Open the full parks map"
        className="absolute inset-0 z-[1000] flex items-end justify-end p-3"
      >
        <span className="rounded-lg border border-border bg-card/95 px-3 py-1.5 text-xs font-medium shadow-md backdrop-blur">
          Open full map →
        </span>
      </Link>
    </div>
  );
}
