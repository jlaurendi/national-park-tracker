'use client';

import { Check, CalendarClock } from 'lucide-react';
import { Chip } from '@/components/ui/Chip';
import { useHydrated, useParkStatuses } from '@/store/selectors';
import type { ParkVisitStatus } from '@/types/domain';

const LABELS: Record<ParkVisitStatus, string> = {
  visited: 'Visited',
  planned: 'Planned',
  unvisited: 'Not visited',
};

export function ParkStatusChip({ parkId }: { parkId: string }) {
  const hydrated = useHydrated();
  const statuses = useParkStatuses();

  if (!hydrated) {
    return <span className="inline-block h-5 w-16 animate-pulse rounded-full bg-muted" />;
  }

  const status = statuses.get(parkId) ?? 'unvisited';
  return (
    <Chip tone={status}>
      {status === 'visited' && <Check className="h-3 w-3" aria-hidden />}
      {status === 'planned' && <CalendarClock className="h-3 w-3" aria-hidden />}
      {LABELS[status]}
    </Chip>
  );
}
