'use client';

import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { PARKS } from '@/data/parks';
import { todayDateOnly } from '@/lib/dates';
import { useAppStore } from '@/store';
import { useParkStatuses } from '@/store/selectors';
import { ParksMapLazy, type MapPin } from './ParksMapLazy';
import type { Park } from '@/types/domain';

export function MapPageContent() {
  const statuses = useParkStatuses();
  const addVisit = useAppStore((s) => s.addVisit);
  const deleteVisit = useAppStore((s) => s.deleteVisit);

  const pins = useMemo<MapPin[]>(
    () =>
      PARKS.map((park) => ({
        park,
        status: statuses.get(park.id) ?? 'unvisited',
      })),
    [statuses],
  );

  // Quick tick-off from a pin popup: logs a visit dated today (editable on
  // the park page), with one-click Undo.
  const handleLogVisit = useCallback(
    async (park: Park) => {
      try {
        const visit = await addVisit({ parkId: park.id, startDate: todayDateOnly() });
        toast.success(`${park.name} marked as visited`, {
          description: 'Dated today — open the park to adjust dates or add notes.',
          action: { label: 'Undo', onClick: () => void deleteVisit(visit.id) },
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Logging the visit failed.');
      }
    },
    [addVisit, deleteVisit],
  );

  return (
    <ParksMapLazy
      pins={pins}
      showLegend
      showAllControl
      onLogVisit={(park) => void handleLogVisit(park)}
      className="h-[calc(100dvh-8.5rem)] w-full md:h-dvh"
    />
  );
}
