// Trip-related derivations shared by the trip page, dialogs, and menus.

import type { Trip, Visit } from '@/types/domain';
import { visitedParkIds } from './parkStatus';

/** True when the trip is in the past: marked completed, or its dates have passed. */
export function tripHasHappened(trip: Trip, today: string): boolean {
  if (trip.status === 'completed') return true;
  const lastDay = trip.endDate ?? trip.startDate;
  return lastDay !== undefined && lastDay < today;
}

/** Park ids on the trip that have no visit logged yet, in stop order. */
export function unvisitedStopParkIds(trip: Trip, visits: Visit[]): string[] {
  const visited = visitedParkIds(visits);
  return [...trip.stops]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => s.parkId)
    .filter((parkId) => !visited.has(parkId));
}
