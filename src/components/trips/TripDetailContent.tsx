'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, CalendarCheck, MapPinOff, Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { ParkCombobox } from './ParkCombobox';
import { TripForm } from './TripForm';
import { TRIP_STATUS_LABELS, TRIP_STATUS_TONES } from './TripsPageContent';
import { ParksMapLazy, type MapPin } from '@/components/map/ParksMapLazy';
import { getPark } from '@/data/parks';
import { formatDateRange, todayDateOnly } from '@/lib/dates';
import { newId } from '@/lib/records';
import { useAppStore } from '@/store';
import { useHydrated, useParkStatuses } from '@/store/selectors';
import type { Park, TripStop } from '@/types/domain';

export function TripDetailContent({ tripId }: { tripId: string }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const trip = useAppStore((s) => s.trips.find((t) => t.id === tripId));
  const updateTrip = useAppStore((s) => s.updateTrip);
  const deleteTrip = useAppStore((s) => s.deleteTrip);
  const promptTripVisits = useAppStore((s) => s.promptTripVisits);
  const statuses = useParkStatuses();
  const [editOpen, setEditOpen] = useState(false);

  const stops = useMemo(
    () => (trip ? [...trip.stops].sort((a, b) => a.sortOrder - b.sortOrder) : []),
    [trip],
  );

  const pins = useMemo<MapPin[]>(
    () =>
      stops.flatMap((stop, i) => {
        const park = getPark(stop.parkId);
        if (!park) return [];
        return [
          {
            park,
            status: statuses.get(park.id) ?? 'unvisited',
            label: String(i + 1),
          },
        ];
      }),
    [stops, statuses],
  );

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (!trip) {
    return (
      <EmptyState
        icon={MapPinOff}
        title="Trip not found"
        description="It may have been deleted."
        action={
          <Link href="/trips" className="text-sm font-medium text-primary hover:underline">
            Back to trips →
          </Link>
        }
      />
    );
  }

  function renumber(next: TripStop[]): TripStop[] {
    return next.map((stop, i) => ({ ...stop, sortOrder: i }));
  }

  async function addStop(park: Park) {
    await updateTrip(trip!.id, {
      stops: renumber([...stops, { id: newId(), parkId: park.id, sortOrder: stops.length }]),
    });
  }

  async function removeStop(stopId: string) {
    await updateTrip(trip!.id, { stops: renumber(stops.filter((s) => s.id !== stopId)) });
  }

  async function moveStop(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= stops.length) return;
    const next = [...stops];
    [next[index], next[target]] = [next[target], next[index]];
    await updateTrip(trip!.id, { stops: renumber(next) });
  }

  async function setStopDate(stopId: string, targetDate: string) {
    await updateTrip(trip!.id, {
      stops: stops.map((s) => (s.id === stopId ? { ...s, targetDate: targetDate || undefined } : s)),
    });
  }

  async function handleDelete() {
    if (window.confirm('Delete this trip? Parks and visits are not affected.')) {
      await deleteTrip(trip!.id);
      router.push('/trips');
    }
  }

  // "Log visits" affordance for trips that already happened.
  const hasUnvisitedStops = stops.some((s) => statuses.get(s.parkId) !== 'visited');
  const lastTripDate = trip.endDate ?? trip.startDate;
  const tripHasHappened =
    trip.status === 'completed' || (lastTripDate !== undefined && lastTripDate < todayDateOnly());

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{trip.name}</h1>
            <Chip tone={TRIP_STATUS_TONES[trip.status]}>{TRIP_STATUS_LABELS[trip.status]}</Chip>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {trip.startDate
              ? formatDateRange(trip.startDate, trip.endDate)
              : 'No dates yet'}
            {trip.notes && ` — ${trip.notes}`}
          </p>
        </div>
        <div className="flex gap-2">
          {hasUnvisitedStops && tripHasHappened && (
            <Button size="sm" onClick={() => promptTripVisits(trip.id)}>
              <CalendarCheck className="h-3.5 w-3.5" aria-hidden />
              Log visits
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Edit
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="text-danger hover:bg-danger-soft"
            onClick={handleDelete}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <div className="flex flex-col gap-3">
          <ParkCombobox excludeIds={new Set(stops.map((s) => s.parkId))} onSelect={addStop} />

          {stops.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              No stops yet — search above to add parks to the route.
            </p>
          ) : (
            <ol className="flex flex-col gap-2">
              {stops.map((stop, i) => {
                const park = getPark(stop.parkId);
                if (!park) return null;
                const visited = statuses.get(park.id) === 'visited';
                return (
                  <li
                    key={stop.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                  >
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary"
                      aria-hidden
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/parks/${park.id}`}
                        className="truncate text-sm font-medium hover:text-primary"
                      >
                        {park.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {park.states.join(' · ')}
                        {visited && ' · visited ✓'}
                      </p>
                    </div>
                    <Input
                      type="date"
                      aria-label={`Target date for ${park.name}`}
                      value={stop.targetDate ?? ''}
                      onChange={(e) => setStopDate(stop.id, e.target.value)}
                      className="h-8 w-36 text-xs"
                    />
                    <div className="flex shrink-0 flex-col">
                      <button
                        aria-label={`Move ${park.name} earlier`}
                        disabled={i === 0}
                        onClick={() => moveStop(i, -1)}
                        className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        aria-label={`Move ${park.name} later`}
                        disabled={i === stops.length - 1}
                        onClick={() => moveStop(i, 1)}
                        className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      aria-label={`Remove ${park.name} from trip`}
                      onClick={() => removeStop(stop.id)}
                      className="shrink-0 rounded p-1 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <ParksMapLazy
          pins={pins}
          showRoute
          defaultView={pins.length > 0 ? 'fit' : 'continental'}
          className="h-80 rounded-xl border border-border shadow-sm lg:h-[28rem]"
        />
      </div>

      <TripForm trip={trip} open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
}
