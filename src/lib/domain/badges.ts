// Badge evaluation. Pure functions so they unit-test trivially and can run
// server-side unchanged in part 2.

import type {
  BadgeCriteria,
  BadgeDefinition,
  EarnedBadge,
  Park,
  Visit,
} from '@/types/domain';
import { statesCovered, visitedParkIds } from './parkStatus';

export function qualifiesFor(
  criteria: BadgeCriteria,
  visited: Set<string>,
  parks: Park[],
  states: Set<string>,
): boolean {
  switch (criteria.kind) {
    case 'park-count':
      return visited.size >= criteria.count;
    case 'all-parks':
      return parks.length > 0 && parks.every((p) => visited.has(p.id));
    case 'specific-parks':
      return criteria.parkIds.every((id) => visited.has(id));
    case 'state-complete': {
      const inState = parks.filter((p) => p.states.includes(criteria.state));
      return inState.length > 0 && inState.every((p) => visited.has(p.id));
    }
    case 'region-complete': {
      const inRegion = parks.filter((p) => p.region === criteria.region);
      return inRegion.length > 0 && inRegion.every((p) => visited.has(p.id));
    }
    case 'distinct-states':
      return states.size >= criteria.count;
  }
}

/** Fraction of a criteria satisfied, for locked-badge progress hints. */
export function badgeProgress(
  criteria: BadgeCriteria,
  visited: Set<string>,
  parks: Park[],
  states: Set<string>,
): { done: number; total: number } {
  switch (criteria.kind) {
    case 'park-count':
      return { done: Math.min(visited.size, criteria.count), total: criteria.count };
    case 'all-parks':
      return { done: parks.filter((p) => visited.has(p.id)).length, total: parks.length };
    case 'specific-parks':
      return {
        done: criteria.parkIds.filter((id) => visited.has(id)).length,
        total: criteria.parkIds.length,
      };
    case 'state-complete': {
      const inState = parks.filter((p) => p.states.includes(criteria.state));
      return { done: inState.filter((p) => visited.has(p.id)).length, total: inState.length };
    }
    case 'region-complete': {
      const inRegion = parks.filter((p) => p.region === criteria.region);
      return { done: inRegion.filter((p) => visited.has(p.id)).length, total: inRegion.length };
    }
    case 'distinct-states':
      return { done: Math.min(states.size, criteria.count), total: criteria.count };
  }
}

export interface BadgeDiff {
  newlyEarned: BadgeDefinition[];
  /** EarnedBadge record ids whose criteria no longer hold. */
  revokedEarnedIds: string[];
}

export function evaluateBadges(
  definitions: BadgeDefinition[],
  visits: Visit[],
  parks: Park[],
  earned: EarnedBadge[],
): BadgeDiff {
  const visited = visitedParkIds(visits);
  const states = statesCovered(visits, parks);
  const earnedByBadgeId = new Map(earned.map((e) => [e.badgeId, e]));

  const newlyEarned: BadgeDefinition[] = [];
  const revokedEarnedIds: string[] = [];

  for (const def of definitions) {
    const qualifies = qualifiesFor(def.criteria, visited, parks, states);
    const existing = earnedByBadgeId.get(def.id);
    if (qualifies && !existing) newlyEarned.push(def);
    if (!qualifies && existing) revokedEarnedIds.push(existing.id);
  }

  return { newlyEarned, revokedEarnedIds };
}
