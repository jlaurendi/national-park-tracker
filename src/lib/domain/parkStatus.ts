// Pure derivations of per-park visit status. No React, no storage.

import type { Park, ParkVisitStatus, Trip, Visit } from '@/types/domain';

export function visitedParkIds(visits: Visit[]): Set<string> {
  return new Set(visits.map((v) => v.parkId));
}

/** Parks appearing in any non-completed trip. */
export function plannedParkIds(trips: Trip[]): Set<string> {
  const ids = new Set<string>();
  for (const trip of trips) {
    if (trip.status === 'completed') continue;
    for (const stop of trip.stops) ids.add(stop.parkId);
  }
  return ids;
}

/** Status per park id. Visited wins over planned. */
export function computeParkStatuses(
  parks: Park[],
  visits: Visit[],
  trips: Trip[],
): Map<string, ParkVisitStatus> {
  const visited = visitedParkIds(visits);
  const planned = plannedParkIds(trips);
  const statuses = new Map<string, ParkVisitStatus>();
  for (const park of parks) {
    statuses.set(
      park.id,
      visited.has(park.id) ? 'visited' : planned.has(park.id) ? 'planned' : 'unvisited',
    );
  }
  return statuses;
}

/** Distinct states covered by visited parks. */
export function statesCovered(visits: Visit[], parks: Park[]): Set<string> {
  const byId = new Map(parks.map((p) => [p.id, p]));
  const states = new Set<string>();
  for (const id of visitedParkIds(visits)) {
    const park = byId.get(id);
    if (park) for (const s of park.states) states.add(s);
  }
  return states;
}
