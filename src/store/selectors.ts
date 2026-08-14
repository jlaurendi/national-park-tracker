'use client';

// Derived-state hooks. Raw arrays come from the store; anything computed
// (maps, sets, aggregates) is memoized here so components stay simple.

import { useMemo } from 'react';
import { useAppStore } from '@/store';
import { PARKS } from '@/data/parks';
import { BADGES } from '@/data/badges';
import {
  computeParkStatuses,
  statesCovered,
  visitedParkIds,
} from '@/lib/domain/parkStatus';
import { badgeProgress, qualifiesFor } from '@/lib/domain/badges';
import { computeGoalProgress, type GoalProgress } from '@/lib/domain/goals';
import { dashboardStats, recentVisits, upcomingTrip } from '@/lib/domain/stats';
import { compareDateOnly } from '@/lib/dates';
import type {
  BadgeDefinition,
  EarnedBadge,
  Goal,
  ParkVisitStatus,
  Photo,
  Visit,
} from '@/types/domain';

export function useHydrated(): boolean {
  return useAppStore((s) => s.hydrated);
}

export function useParkStatuses(): Map<string, ParkVisitStatus> {
  const visits = useAppStore((s) => s.visits);
  const trips = useAppStore((s) => s.trips);
  return useMemo(() => computeParkStatuses(PARKS, visits, trips), [visits, trips]);
}

export function useVisitsForPark(parkId: string): Visit[] {
  const visits = useAppStore((s) => s.visits);
  return useMemo(
    () =>
      visits
        .filter((v) => v.parkId === parkId)
        .sort((a, b) => compareDateOnly(b.startDate, a.startDate)),
    [visits, parkId],
  );
}

export function usePhotosForPark(parkId: string): Photo[] {
  const photos = useAppStore((s) => s.photos);
  return useMemo(
    () =>
      photos
        .filter((p) => p.parkId === parkId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [photos, parkId],
  );
}

export function useDashboard() {
  const visits = useAppStore((s) => s.visits);
  const trips = useAppStore((s) => s.trips);
  const photos = useAppStore((s) => s.photos);
  const earnedBadges = useAppStore((s) => s.earnedBadges);
  return useMemo(
    () => ({
      stats: dashboardStats(visits, photos, earnedBadges, PARKS),
      recentVisits: recentVisits(visits, 5),
      nextTrip: upcomingTrip(trips),
      recentBadges: [...earnedBadges]
        .sort((a, b) => b.earnedAt.localeCompare(a.earnedAt))
        .slice(0, 4),
    }),
    [visits, trips, photos, earnedBadges],
  );
}

export interface GoalWithProgress {
  goal: Goal;
  progress: GoalProgress;
}

export function useGoalsWithProgress(): GoalWithProgress[] {
  const goals = useAppStore((s) => s.goals);
  const visits = useAppStore((s) => s.visits);
  return useMemo(
    () =>
      [...goals]
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map((goal) => ({ goal, progress: computeGoalProgress(goal, visits, PARKS) })),
    [goals, visits],
  );
}

export interface BadgeState {
  definition: BadgeDefinition;
  earned?: EarnedBadge;
  progress: { done: number; total: number };
}

export function useBadgeStates(): BadgeState[] {
  const visits = useAppStore((s) => s.visits);
  const earnedBadges = useAppStore((s) => s.earnedBadges);
  return useMemo(() => {
    const visited = visitedParkIds(visits);
    const states = statesCovered(visits, PARKS);
    const earnedByBadgeId = new Map(earnedBadges.map((e) => [e.badgeId, e]));
    return BADGES.map((definition) => ({
      definition,
      earned: earnedByBadgeId.get(definition.id),
      progress: badgeProgress(definition.criteria, visited, PARKS, states),
    }));
  }, [visits, earnedBadges]);
}

/** True when the given criteria would currently qualify (used in tests/UI). */
export function useWouldQualify(definition: BadgeDefinition): boolean {
  const visits = useAppStore((s) => s.visits);
  return useMemo(() => {
    const visited = visitedParkIds(visits);
    const states = statesCovered(visits, PARKS);
    return qualifiesFor(definition.criteria, visited, PARKS, states);
  }, [visits, definition]);
}
