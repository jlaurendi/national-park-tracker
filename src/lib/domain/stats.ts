// Dashboard aggregates.

import type { EarnedBadge, Park, Photo, Trip, Visit } from '@/types/domain';
import { compareDateOnly } from '@/lib/dates';
import { statesCovered, visitedParkIds } from './parkStatus';

export interface DashboardStats {
  visitedCount: number;
  totalParks: number;
  statesCovered: number;
  photoCount: number;
  badgeCount: number;
}

export function dashboardStats(
  visits: Visit[],
  photos: Photo[],
  earnedBadges: EarnedBadge[],
  parks: Park[],
): DashboardStats {
  return {
    visitedCount: visitedParkIds(visits).size,
    totalParks: parks.length,
    statesCovered: statesCovered(visits, parks).size,
    photoCount: photos.length,
    badgeCount: earnedBadges.length,
  };
}

/** Most recent visits by start date. */
export function recentVisits(visits: Visit[], limit: number): Visit[] {
  return [...visits].sort((a, b) => compareDateOnly(b.startDate, a.startDate)).slice(0, limit);
}

/** The next non-completed trip, soonest target/start date first, dateless last. */
export function upcomingTrip(trips: Trip[]): Trip | undefined {
  const open = trips.filter((t) => t.status !== 'completed');
  if (open.length === 0) return undefined;
  const dateOf = (t: Trip) =>
    t.startDate ?? t.stops.map((s) => s.targetDate).filter(Boolean).sort()[0];
  return [...open].sort((a, b) => {
    const da = dateOf(a);
    const db = dateOf(b);
    if (da && db) return compareDateOnly(da, db);
    if (da) return -1;
    if (db) return 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  })[0];
}
