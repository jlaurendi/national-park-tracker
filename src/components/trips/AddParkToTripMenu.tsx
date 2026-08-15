'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Plus, Route } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { TripForm } from './TripForm';
import { newId } from '@/lib/records';
import { useAppStore } from '@/store';
import { useHydrated } from '@/store/selectors';
import { cn } from '@/lib/cn';

export function AddParkToTripMenu({ parkId, parkName }: { parkId: string; parkName: string }) {
  const hydrated = useHydrated();
  const trips = useAppStore((s) => s.trips);
  const updateTrip = useAppStore((s) => s.updateTrip);
  const [open, setOpen] = useState(false);
  const [newTripOpen, setNewTripOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  if (!hydrated) return null;

  // Open trips first; completed trips still listed so visits can be recorded
  // retroactively ("I did see this park on that trip").
  const menuTrips = [...trips].sort(
    (a, b) =>
      Number(a.status === 'completed') - Number(b.status === 'completed') ||
      b.updatedAt.localeCompare(a.updatedAt),
  );

  async function toggle(tripId: string) {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) return;
    const existing = trip.stops.find((s) => s.parkId === parkId);
    if (existing) {
      await updateTrip(trip.id, {
        stops: trip.stops
          .filter((s) => s.id !== existing.id)
          .map((s, i) => ({ ...s, sortOrder: i })),
      });
      toast(`Removed ${parkName} from “${trip.name}”`);
    } else {
      // If the trip already happened, updateTrip auto-logs the visit and
      // shows its own toast with Undo.
      await updateTrip(trip.id, {
        stops: [...trip.stops, { id: newId(), parkId, sortOrder: trip.stops.length }],
      });
      toast.success(`Added ${parkName} to “${trip.name}”`);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <Button variant="secondary" size="sm" onClick={() => setOpen((o) => !o)}>
        <Route className="h-3.5 w-3.5" aria-hidden />
        Add to trip
        <ChevronDown className="h-3.5 w-3.5" aria-hidden />
      </Button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-64 rounded-lg border border-border bg-card py-1 shadow-lg">
          {menuTrips.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">No trips yet.</p>
          )}
          {menuTrips.map((trip) => {
            const included = trip.stops.some((s) => s.parkId === parkId);
            return (
              <button
                key={trip.id}
                onClick={() => toggle(trip.id)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <span className="truncate">
                  {trip.name}
                  {trip.status === 'completed' && (
                    <span className="ml-1.5 text-xs text-muted-foreground">· completed</span>
                  )}
                </span>
                <Check
                  className={cn('h-4 w-4 shrink-0 text-primary', !included && 'invisible')}
                  aria-hidden
                />
              </button>
            );
          })}
          <button
            onClick={() => {
              setOpen(false);
              setNewTripOpen(true);
            }}
            className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-left text-sm font-medium text-primary hover:bg-muted"
          >
            <Plus className="h-4 w-4" aria-hidden />
            New trip
          </button>
        </div>
      )}
      <TripForm open={newTripOpen} onClose={() => setNewTripOpen(false)} />
    </div>
  );
}
