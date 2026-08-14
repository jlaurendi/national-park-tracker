'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input, Label, Select, Textarea } from '@/components/ui/Input';
import { useAppStore } from '@/store';
import type { Trip, TripStatus } from '@/types/domain';

interface TripFormProps {
  /** When set, edits this trip; otherwise creates one and navigates to it. */
  trip?: Trip;
  open: boolean;
  onClose: () => void;
}

export function TripForm({ trip, open, onClose }: TripFormProps) {
  return (
    <Dialog open={open} onClose={onClose} title={trip ? 'Edit trip' : 'Plan a new trip'}>
      <TripFields key={trip?.id ?? 'new'} trip={trip} onClose={onClose} />
    </Dialog>
  );
}

function TripFields({ trip, onClose }: { trip?: Trip; onClose: () => void }) {
  const router = useRouter();
  const addTrip = useAppStore((s) => s.addTrip);
  const updateTrip = useAppStore((s) => s.updateTrip);

  const [name, setName] = useState(trip?.name ?? '');
  const [status, setStatus] = useState<TripStatus>(trip?.status ?? 'idea');
  const [startDate, setStartDate] = useState(trip?.startDate ?? '');
  const [endDate, setEndDate] = useState(trip?.endDate ?? '');
  const [notes, setNotes] = useState(trip?.notes ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Give the trip a name.');
      return;
    }
    if (startDate && endDate && endDate < startDate) {
      setError('The end date must be on or after the start date.');
      return;
    }
    setSaving(true);
    try {
      const input = {
        name: name.trim(),
        status,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        notes: notes.trim() || undefined,
      };
      if (trip) {
        await updateTrip(trip.id, input);
        onClose();
      } else {
        const created = await addTrip(input);
        onClose();
        router.push(`/trips/view?id=${created.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Saving the trip failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="trip-name">Trip name</Label>
        <Input
          id="trip-name"
          placeholder="Utah Mighty 5, Summer 2027…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="trip-status">Status</Label>
        <Select
          id="trip-status"
          value={status}
          onChange={(e) => setStatus(e.target.value as TripStatus)}
        >
          <option value="idea">Idea</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="trip-start">Starts (optional)</Label>
          <Input
            id="trip-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="trip-end">Ends (optional)</Label>
          <Input
            id="trip-end"
            type="date"
            min={startDate || undefined}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="trip-notes">Notes</Label>
        <Textarea
          id="trip-notes"
          placeholder="Route ideas, lodging, who's coming…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : trip ? 'Save changes' : 'Create trip'}
        </Button>
      </div>
    </form>
  );
}
