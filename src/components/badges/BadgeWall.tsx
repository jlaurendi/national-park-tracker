'use client';

import { badgeIcon } from './badgeIcon';
import { useBadgeStates } from '@/store/selectors';
import { cn } from '@/lib/cn';

export function BadgeWall() {
  const badgeStates = useBadgeStates();
  const earnedCount = badgeStates.filter((b) => b.earned).length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {earnedCount} of {badgeStates.length} badges earned
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {badgeStates.map(({ definition, earned, progress }) => {
          const Icon = badgeIcon(definition.icon);
          return (
            <div
              key={definition.id}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border p-4 text-center',
                earned
                  ? 'border-primary/40 bg-primary-soft shadow-sm'
                  : 'border-border bg-card opacity-70',
              )}
            >
              <div
                className={cn(
                  'rounded-full p-3',
                  earned ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                )}
              >
                <Icon className="h-6 w-6" aria-hidden />
              </div>
              <p className={cn('text-sm font-semibold', !earned && 'text-muted-foreground')}>
                {definition.name}
              </p>
              <p className="text-xs leading-snug text-muted-foreground">
                {definition.description}
              </p>
              {earned ? (
                <p className="mt-auto text-xs font-medium text-primary">
                  Earned {new Date(earned.earnedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              ) : (
                <p className="mt-auto text-xs tabular-nums text-muted-foreground">
                  {progress.done}/{progress.total}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
