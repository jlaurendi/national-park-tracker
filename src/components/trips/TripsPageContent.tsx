'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Plus, Route } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/Progress';
import { Skeleton } from '@/components/ui/Skeleton';
import { TripForm } from './TripForm';
import { formatDateRange } from '@/lib/dates';
import { useAppStore } from '@/store';
import { useHydrated, useParkStatuses } from '@/store/selectors';
import type { Trip, TripStatus } from '@/types/domain';

export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  idea: 'Idea',
  scheduled: 'Scheduled',
  completed: 'Completed',
};

export const TRIP_STATUS_TONES: Record<TripStatus, 'neutral' | 'planned' | 'visited'> = {
  idea: 'neutral',
  scheduled: 'planned',
  completed: 'visited',
};

function TripCard({ trip }: { trip: Trip }) {
  const statuses = useParkStatuses();
  const visitedStops = trip.stops.filter((s) => statuses.get(s.parkId) === 'visited').length;

  return (
    <Link
      href={`/trips/view?id=${trip.id}`}
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-tight">{trip.name}</h3>
        <Chip tone={TRIP_STATUS_TONES[trip.status]}>{TRIP_STATUS_LABELS[trip.status]}</Chip>
      </div>
      <p className="text-sm text-muted-foreground">
        {trip.stops.length} {trip.stops.length === 1 ? 'stop' : 'stops'}
        {trip.startDate && ` · ${formatDateRange(trip.startDate, trip.endDate)}`}
      </p>
      {trip.stops.length > 0 && (
        <div className="flex items-center gap-2">
          <ProgressBar
            percent={(visitedStops / trip.stops.length) * 100}
            label={`${trip.name} progress`}
            className="flex-1"
          />
          <span className="text-xs tabular-nums text-muted-foreground">
            {visitedStops}/{trip.stops.length} visited
          </span>
        </div>
      )}
    </Link>
  );
}

export function TripsPageContent() {
  const hydrated = useHydrated();
  const trips = useAppStore((s) => s.trips);
  const [formOpen, setFormOpen] = useState(false);

  if (!hydrated) {
    return (
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
    );
  }

  const sorted = [...trips].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden />
          New trip
        </Button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={Route}
          title="No trips yet"
          description="Group parks into a trip, set target dates, and watch the route come together on the map."
          action={<Button onClick={() => setFormOpen(true)}>Plan your first trip</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sorted.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}

      <TripForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
