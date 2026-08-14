'use client';

import Link from 'next/link';
import { Award, BookImage, CalendarDays, Map as MapIcon, Route, Target } from 'lucide-react';
import { badgeIcon } from '@/components/badges/badgeIcon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ProgressBar, ProgressRing } from '@/components/ui/Progress';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Chip } from '@/components/ui/Chip';
import { getPark } from '@/data/parks';
import { BADGES_BY_ID } from '@/data/badges';
import { formatDateRange } from '@/lib/dates';
import { useDashboard, useGoalsWithProgress, useHydrated } from '@/store/selectors';
import { MiniMapPreview } from '@/components/map/MiniMapPreview';

function StatCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof MapIcon;
  label: string;
  value: string | number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </Link>
  );
}

export function DashboardContent() {
  const hydrated = useHydrated();
  const { stats, recentVisits, nextTrip, recentBadges } = useDashboard();
  const goals = useGoalsWithProgress();

  if (!hydrated) {
    return (
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Skeleton className="h-52" />
        <Skeleton className="h-52 md:col-span-2" />
        <Skeleton className="h-40 md:col-span-3" />
      </div>
    );
  }

  const percent = (stats.visitedCount / stats.totalParks) * 100;
  const activeGoals = goals.filter((g) => !g.progress.isComplete).slice(0, 3);

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-3">
        {/* Progress ring */}
        <Card className="flex flex-col items-center justify-center gap-2 p-6">
          <ProgressRing percent={percent}>
            <div className="text-center">
              <p className="text-3xl font-bold tabular-nums">{stats.visitedCount}</p>
              <p className="text-xs text-muted-foreground">of {stats.totalParks} parks</p>
            </div>
          </ProgressRing>
          <p className="text-sm text-muted-foreground">
            {stats.visitedCount === 0
              ? 'Your adventure starts here.'
              : `${Math.round(percent)}% of the way there.`}
          </p>
        </Card>

        {/* Stats + goals */}
        <div className="flex flex-col gap-4 md:col-span-2">
          <div className="grid grid-cols-3 gap-4">
            <StatCard icon={MapIcon} label="States" value={stats.statesCovered} href="/map" />
            <StatCard icon={BookImage} label="Photos" value={stats.photoCount} href="/scrapbook" />
            <StatCard icon={Award} label="Badges" value={stats.badgeCount} href="/goals" />
          </div>
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" aria-hidden />
                Active goals
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {activeGoals.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No active goals.{' '}
                  <Link href="/goals" className="font-medium text-primary hover:underline">
                    Set one →
                  </Link>
                </p>
              ) : (
                activeGoals.map(({ goal, progress }) => (
                  <Link key={goal.id} href="/goals" className="group">
                    <div className="mb-1 flex items-baseline justify-between gap-2">
                      <p className="text-sm font-medium group-hover:text-primary">{goal.name}</p>
                      <p className="text-xs tabular-nums text-muted-foreground">
                        {progress.completedCount}/{progress.targetCount}
                      </p>
                    </div>
                    <ProgressBar percent={progress.percent} label={goal.name} />
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent visits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" aria-hidden />
              Recent visits
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentVisits.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No visits logged yet"
                description="Open a park page and log your first visit."
                className="py-8"
              />
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {recentVisits.map((visit) => {
                  const park = getPark(visit.parkId);
                  return (
                    <li key={visit.id}>
                      <Link
                        href={`/parks/${visit.parkId}`}
                        className="flex items-center justify-between gap-2 py-2.5 hover:text-primary"
                      >
                        <span className="text-sm font-medium">{park?.name ?? visit.parkId}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDateRange(visit.startDate, visit.endDate)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Next trip + badges */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-4 w-4 text-primary" aria-hidden />
                Next trip
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nextTrip ? (
                <Link href={`/trips/view?id=${nextTrip.id}`} className="group flex flex-col gap-1">
                  <p className="font-medium group-hover:text-primary">{nextTrip.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {nextTrip.stops.length} {nextTrip.stops.length === 1 ? 'stop' : 'stops'}
                    {nextTrip.startDate && ` · ${formatDateRange(nextTrip.startDate, nextTrip.endDate)}`}
                  </p>
                </Link>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nothing planned.{' '}
                  <Link href="/trips" className="font-medium text-primary hover:underline">
                    Plan a trip →
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" aria-hidden />
                Latest badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentBadges.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Log visits to start earning badges.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {recentBadges.map((earned) => {
                    const def = BADGES_BY_ID.get(earned.badgeId);
                    if (!def) return null;
                    const Icon = badgeIcon(def.icon);
                    return (
                      <Link key={earned.id} href="/goals">
                        <Chip tone="visited" className="px-3 py-1 text-sm">
                          <Icon className="h-3.5 w-3.5" aria-hidden />
                          {def.name}
                        </Chip>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <MiniMapPreview />
    </div>
  );
}
