'use client';

import { useState, type FormEvent } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input, Label, Textarea } from '@/components/ui/Input';
import { StarRating } from '@/components/ui/StarRating';
import { todayDateOnly } from '@/lib/dates';
import { useAppStore } from '@/store';
import type { Visit } from '@/types/domain';

interface VisitFormProps {
  parkId: string;
  parkName: string;
  /** When set, the dialog edits this visit instead of creating one. */
  visit?: Visit;
  open: boolean;
  onClose: () => void;
}

export function VisitForm({ parkId, parkName, visit, open, onClose }: VisitFormProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={visit ? `Edit visit to ${parkName}` : `Log a visit to ${parkName}`}
    >
      {/* Fields live in a child that mounts fresh each open, so state resets
          without effect-based synchronization. */}
      <VisitFields key={visit?.id ?? 'new'} parkId={parkId} visit={visit} onClose={onClose} />
    </Dialog>
  );
}

function VisitFields({
  parkId,
  visit,
  onClose,
}: {
  parkId: string;
  visit?: Visit;
  onClose: () => void;
}) {
  const addVisit = useAppStore((s) => s.addVisit);
  const updateVisit = useAppStore((s) => s.updateVisit);

  const [startDate, setStartDate] = useState(visit?.startDate ?? todayDateOnly());
  const [endDate, setEndDate] = useState(visit?.endDate ?? '');
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5 | undefined>(visit?.rating);
  const [notes, setNotes] = useState(visit?.notes ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!startDate) {
      setError('A start date is required.');
      return;
    }
    if (endDate && endDate < startDate) {
      setError('The end date must be on or after the start date.');
      return;
    }
    setSaving(true);
    try {
      const input = {
        parkId,
        startDate,
        endDate: endDate || undefined,
        rating,
        notes: notes.trim() || undefined,
      };
      if (visit) {
        await updateVisit(visit.id, input);
      } else {
        await addVisit(input);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Saving the visit failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="visit-start">First day</Label>
          <Input
            id="visit-start"
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="visit-end">Last day (optional)</Label>
          <Input
            id="visit-end"
            type="date"
            min={startDate || undefined}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Rating</Label>
        <StarRating value={rating} onChange={setRating} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="visit-notes">Notes</Label>
        <Textarea
          id="visit-notes"
          placeholder="Favorite trail, wildlife spotted, weather…"
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
          {saving ? 'Saving…' : visit ? 'Save changes' : 'Log visit'}
        </Button>
      </div>
    </form>
  );
}
