'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle2, Pencil, Plus, Target, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/Progress';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs } from '@/components/ui/Tabs';
import { BadgeWall } from '@/components/badges/BadgeWall';
import { GoalForm } from './GoalForm';
import { getPark } from '@/data/parks';
import { formatDateOnly } from '@/lib/dates';
import { useAppStore } from '@/store';
import { useGoalsWithProgress, useHydrated, type GoalWithProgress } from '@/store/selectors';
import type { Goal } from '@/types/domain';

function GoalCard({
  item,
  onEdit,
}: {
  item: GoalWithProgress;
  onEdit: (goal: Goal) => void;
}) {
  const deleteGoal = useAppStore((s) => s.deleteGoal);
  const { goal, progress } = item;
  const remainingPreview = progress.remainingParkIds.slice(0, 6);

  async function handleDelete() {
    if (window.confirm('Delete this goal? Your visits are not affected.')) {
      await deleteGoal(goal.id);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 font-semibold leading-tight">
            {goal.name}
            {progress.isComplete && (
              <CheckCircle2 className="h-4 w-4 text-primary" aria-label="Complete" />
            )}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {goal.targetDate && `Target: ${formatDateOnly(goal.targetDate)}`}
            {goal.targetDate && goal.achievedAt && ' · '}
            {goal.achievedAt &&
              progress.isComplete &&
              `Achieved ${new Date(goal.achievedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}`}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="icon" aria-label="Edit goal" onClick={() => onEdit(goal)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete goal"
            className="text-danger hover:bg-danger-soft"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ProgressBar percent={progress.percent} label={goal.name} className="flex-1" />
        <span className="text-sm font-medium tabular-nums">
          {progress.completedCount}/{progress.targetCount}
        </span>
      </div>

      {remainingPreview.length > 0 && !progress.isComplete && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Still to visit:</span>
          {remainingPreview.map((id) => (
            <Link key={id} href={`/parks/${id}`}>
              <Chip tone="neutral" className="hover:bg-primary-soft hover:text-primary">
                {getPark(id)?.name ?? id}
              </Chip>
            </Link>
          ))}
          {progress.remainingParkIds.length > remainingPreview.length && (
            <span className="text-xs text-muted-foreground">
              +{progress.remainingParkIds.length - remainingPreview.length} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function GoalsPageContent() {
  const hydrated = useHydrated();
  const goals = useGoalsWithProgress();
  const [tab, setTab] = useState('goals');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | undefined>();

  if (!hydrated) {
    return (
      <div className="mt-6 flex flex-col gap-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs
          tabs={[
            { id: 'goals', label: 'Goals' },
            { id: 'badges', label: 'Badges' },
          ]}
          active={tab}
          onChange={setTab}
        />
        {tab === 'goals' && (
          <Button
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden />
            New goal
          </Button>
        )}
      </div>

      {tab === 'goals' ? (
        goals.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No goals yet"
            description="Aim for all 63, any ten, or a specific list like the Utah Mighty 5."
            action={
              <Button
                onClick={() => {
                  setEditing(undefined);
                  setFormOpen(true);
                }}
              >
                Set your first goal
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {goals.map((item) => (
              <GoalCard
                key={item.goal.id}
                item={item}
                onEdit={(goal) => {
                  setEditing(goal);
                  setFormOpen(true);
                }}
              />
            ))}
          </div>
        )
      ) : (
        <BadgeWall />
      )}

      <GoalForm goal={editing} open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
