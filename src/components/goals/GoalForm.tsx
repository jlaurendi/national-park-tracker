'use client';

import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input, Label, Select } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { ParkCombobox } from '@/components/trips/ParkCombobox';
import { GOAL_PRESETS } from '@/data/goalPresets';
import { getPark } from '@/data/parks';
import { useAppStore } from '@/store';
import type { Goal, GoalType } from '@/types/domain';

interface GoalFormProps {
  goal?: Goal;
  open: boolean;
  onClose: () => void;
}

export function GoalForm({ goal, open, onClose }: GoalFormProps) {
  return (
    <Dialog open={open} onClose={onClose} title={goal ? 'Edit goal' : 'Set a goal'}>
      <GoalFields key={goal?.id ?? 'new'} goal={goal} onClose={onClose} />
    </Dialog>
  );
}

function GoalFields({ goal, onClose }: { goal?: Goal; onClose: () => void }) {
  const addGoal = useAppStore((s) => s.addGoal);
  const updateGoal = useAppStore((s) => s.updateGoal);

  const [type, setType] = useState<GoalType>(goal?.type ?? 'park-count');
  const [name, setName] = useState(goal?.name ?? '');
  const [targetCount, setTargetCount] = useState(goal?.targetCount ?? 10);
  const [parkIds, setParkIds] = useState<string[]>(goal?.parkIds ?? []);
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function applyPreset(presetId: string) {
    const preset = GOAL_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setType(preset.type);
    setName(preset.name);
    if (preset.targetCount) setTargetCount(preset.targetCount);
    setParkIds(preset.parkIds ? [...preset.parkIds] : []);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Give the goal a name.');
      return;
    }
    if (type === 'park-count' && (!targetCount || targetCount < 1 || targetCount > 63)) {
      setError('Pick a target between 1 and 63.');
      return;
    }
    if (type === 'park-list' && parkIds.length === 0) {
      setError('Add at least one park to the list.');
      return;
    }
    setSaving(true);
    try {
      const input = {
        type,
        name: name.trim(),
        targetCount: type === 'park-count' ? targetCount : undefined,
        parkIds: type === 'park-list' ? parkIds : undefined,
        targetDate: targetDate || undefined,
      };
      if (goal) {
        await updateGoal(goal.id, input);
      } else {
        await addGoal(input);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {!goal && (
        <div className="flex flex-col gap-1.5">
          <Label>Start from a preset</Label>
          <div className="flex flex-wrap gap-1.5">
            {GOAL_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                title={preset.description}
                className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium hover:border-primary hover:text-primary"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="goal-name">Goal name</Label>
        <Input
          id="goal-name"
          placeholder="See all 63 parks"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="goal-type">Type</Label>
          <Select
            id="goal-type"
            value={type}
            onChange={(e) => setType(e.target.value as GoalType)}
          >
            <option value="all-parks">All 63 parks</option>
            <option value="park-count">Any N parks</option>
            <option value="park-list">Specific parks</option>
          </Select>
        </div>
        {type === 'park-count' ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="goal-count">How many parks?</Label>
            <Input
              id="goal-count"
              type="number"
              min={1}
              max={63}
              value={targetCount}
              onChange={(e) => setTargetCount(Number(e.target.value))}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="goal-date">Target date (optional)</Label>
            <Input
              id="goal-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>
        )}
      </div>

      {type === 'park-list' && (
        <div className="flex flex-col gap-1.5">
          <Label>Parks in this goal ({parkIds.length})</Label>
          <ParkCombobox
            excludeIds={new Set(parkIds)}
            onSelect={(park) => setParkIds((ids) => [...ids, park.id])}
            placeholder="Add a park to the goal…"
          />
          {parkIds.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {parkIds.map((id) => (
                <Chip key={id} tone="neutral" className="pr-1">
                  {getPark(id)?.name ?? id}
                  <button
                    type="button"
                    aria-label={`Remove ${getPark(id)?.name ?? id}`}
                    onClick={() => setParkIds((ids) => ids.filter((p) => p !== id))}
                    className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Chip>
              ))}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : goal ? 'Save changes' : 'Set goal'}
        </Button>
      </div>
    </form>
  );
}
