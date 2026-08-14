'use client';

import { useState } from 'react';
import { CalendarPlus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { StarRating } from '@/components/ui/StarRating';
import { VisitForm } from './VisitForm';
import { formatDateRange } from '@/lib/dates';
import { useAppStore } from '@/store';
import { useHydrated, useVisitsForPark } from '@/store/selectors';
import type { Park, Visit } from '@/types/domain';

export function VisitList({ park }: { park: Park }) {
  const hydrated = useHydrated();
  const visits = useVisitsForPark(park.id);
  const deleteVisit = useAppStore((s) => s.deleteVisit);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Visit | undefined>();

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    );
  }

  async function handleDelete(visit: Visit) {
    const ok = window.confirm(
      'Delete this visit? Any photos attached to it will be deleted too.',
    );
    if (ok) await deleteVisit(visit.id);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your visits</h2>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
        >
          <CalendarPlus className="h-4 w-4" aria-hidden />
          Log a visit
        </Button>
      </div>

      {visits.length === 0 ? (
        <EmptyState
          icon={CalendarPlus}
          title="No visits yet"
          description={`Been to ${park.name}? Log the trip to start your record.`}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {visits.map((visit) => (
            <li
              key={visit.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {formatDateRange(visit.startDate, visit.endDate)}
                </p>
                {visit.rating && <StarRating value={visit.rating} size="sm" className="mt-1" />}
                {visit.notes && (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                    {visit.notes}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Edit visit"
                  onClick={() => {
                    setEditing(visit);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete visit"
                  className="text-danger hover:bg-danger-soft"
                  onClick={() => handleDelete(visit)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <VisitForm
        parkId={park.id}
        parkName={park.name}
        visit={editing}
        open={formOpen}
        onClose={() => setFormOpen(false)}
      />
    </div>
  );
}
