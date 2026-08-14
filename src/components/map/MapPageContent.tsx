'use client';

import { useMemo } from 'react';
import { PARKS } from '@/data/parks';
import { useParkStatuses } from '@/store/selectors';
import { ParksMapLazy, type MapPin } from './ParksMapLazy';

export function MapPageContent() {
  const statuses = useParkStatuses();

  const pins = useMemo<MapPin[]>(
    () =>
      PARKS.map((park) => ({
        park,
        status: statuses.get(park.id) ?? 'unvisited',
      })),
    [statuses],
  );

  return (
    <ParksMapLazy
      pins={pins}
      showLegend
      showAllControl
      className="h-[calc(100dvh-8.5rem)] w-full md:h-dvh"
    />
  );
}
