'use client';

import { useMemo, useState } from 'react';
import { CalendarCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { getPark } from '@/data/parks';
import { formatDateOnly, todayDateOnly } from '@/lib/dates';
import { useAppStore } from '@/store';
import { visitedParkIds } from '@/lib/domain/parkStatus';
import type { Trip } from '@/types/domain';

/**
 * "You finished this trip — log visits for its parks?" Offered automatically
 * when a trip is marked completed, and on demand from the trip page. Visits
 * stay the source of truth (badges, goals, and photos all hang off them);
 * this just creates them in bulk.
 */
export function TripVisitsDialog() {
  const tripId = useAppStore((s) => s.tripVisitsPrompt);
  const trip = useAppStore((s) => s.trips.find((t) => t.id === s.tripVisitsPrompt));
  const dismiss = useAppStore((s) => s.dismissTripVisitsPrompt);

  if (!tripId || !trip) return null;
  return <TripVisitsFields key={tripId} trip={trip} onClose={dismiss} />;
}

function TripVisitsFields({ trip, onClose }: { trip: Trip; onClose: () => void }) {
  const visits = useAppStore((s) => s.visits);
  const addVisit = useAppStore((s) => s.addVisit);
  const [busy, setBusy] = useState(false);

  // Stops whose park has no visit yet, with a sensible proposed date.
  const candidates = useMemo(() => {
    const visited = visitedParkIds(visits);
    return [...trip.stops]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .filter((stop) => !visited.has(stop.parkId))
      .map((stop) => ({
        parkId: stop.parkId,
        date: stop.targetDate ?? trip.endDate ?? trip.startDate ?? todayDateOnly(),
      }));
  }, [trip, visits]);

  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(candidates.map((c) => c.parkId)),
  );

  async function handleConfirm() {
    setBusy(true);
    try {
      const selected = candidates.filter((c) => checked.has(c.parkId));
      for (const c of selected) {
        await addVisit({ parkId: c.parkId, startDate: c.date });
      }
      toast.success(
        `Logged ${selected.length} visit${selected.length === 1 ? '' : 's'} from “${trip.name}”.`,
      );
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Logging visits failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onClose={busy ? () => {} : onClose} title="Log visits from this trip?">
      {candidates.length === 0 ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Every park on “{trip.name}” already has a visit logged — you&apos;re all set.
          </p>
          <div className="flex justify-end">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Mark these parks from “{trip.name}” as visited? Each gets a visit you can edit
            later (dates, ratings, notes, photos).
          </p>
          <ul className="flex flex-col gap-1">
            {candidates.map((c) => (
              <li key={c.parkId}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={checked.has(c.parkId)}
                    onChange={(e) => {
                      setChecked((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(c.parkId);
                        else next.delete(c.parkId);
                        return next;
                      });
                    }}
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  <span className="flex-1 text-sm font-medium">
                    {getPark(c.parkId)?.name ?? c.parkId}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDateOnly(c.date)}</span>
                </label>
              </li>
            ))}
          </ul>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={busy}>
              Not now
            </Button>
            <Button onClick={handleConfirm} disabled={busy || checked.size === 0}>
              <CalendarCheck className="h-4 w-4" aria-hidden />
              {busy ? 'Logging…' : `Log ${checked.size} visit${checked.size === 1 ? '' : 's'}`}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
